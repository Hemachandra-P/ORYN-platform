from datetime import datetime
from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.household import HouseholdMember, HouseholdActivityLog
from app.models.expense import Expense, ExpenseParticipant
from app.models.settlement import Settlement
from app.models.notification import Notification
from app.core.deps import get_current_user, require_household_member
from app.schemas.expense import (
    ExpenseCreate, ExpenseResponse, BalanceSummaryItem
)

router = APIRouter(prefix="/households/{household_id}/expenses", tags=["Expenses"])

@router.post("/", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(
    household_id: str,
    expense_in: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_household_member(household_id, current_user, db)

    # Fetch active members of the household
    all_members = db.query(HouseholdMember).filter(HouseholdMember.household_id == household_id).all()
    if not all_members:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Household has no members")
    
    member_user_ids = [m.user_id for m in all_members]

    # Validate or compute participant splits
    participant_shares: List[Dict[str, int]] = []
    total = expense_in.total_amount_paise

    if not expense_in.participants or len(expense_in.participants) == 0:
        # Default: Equal split among all household members
        count = len(member_user_ids)
        base_share = total // count
        remainder = total % count
        
        for idx, uid in enumerate(member_user_ids):
            share = base_share + (1 if idx < remainder else 0)
            participant_shares.append({"user_id": uid, "share_amount_paise": share})
    else:
        # Custom or percentage split specified
        # Validate that all participant IDs belong to the household
        for p in expense_in.participants:
            if p.user_id not in member_user_ids:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"User {p.user_id} is not a member of this household"
                )

        if expense_in.split_method == "equal":
            count = len(expense_in.participants)
            base_share = total // count
            remainder = total % count
            for idx, p in enumerate(expense_in.participants):
                share = base_share + (1 if idx < remainder else 0)
                participant_shares.append({"user_id": p.user_id, "share_amount_paise": share})

        elif expense_in.split_method == "percentage":
            accumulated = 0
            for idx, p in enumerate(expense_in.participants):
                if p.percentage is None or p.percentage < 0:
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing or invalid percentage")
                if idx == len(expense_in.participants) - 1:
                    share = total - accumulated
                else:
                    share = int(round(total * (p.percentage / 100.0)))
                    accumulated += share
                participant_shares.append({"user_id": p.user_id, "share_amount_paise": share, "percentage": p.percentage})
            
        else: # custom
            sum_shares = sum([p.share_amount_paise or 0 for p in expense_in.participants])
            if sum_shares != total:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Sum of custom shares (₹{sum_shares/100:.2f}) does not match total amount (₹{total/100:.2f})"
                )
            for p in expense_in.participants:
                participant_shares.append({"user_id": p.user_id, "share_amount_paise": p.share_amount_paise or 0})

    # Create Expense
    new_expense = Expense(
        household_id=household_id,
        title=expense_in.title,
        description=expense_in.description,
        total_amount_paise=total,
        category=expense_in.category,
        paid_by_id=current_user.id,
        expense_date=expense_in.expense_date or datetime.utcnow(),
        receipt_url=expense_in.receipt_url,
        split_method=expense_in.split_method
    )
    db.add(new_expense)
    db.flush()

    # Create Participant shares
    for ps in participant_shares:
        is_payer = (ps["user_id"] == current_user.id)
        part = ExpenseParticipant(
            expense_id=new_expense.id,
            user_id=ps["user_id"],
            share_amount_paise=ps["share_amount_paise"],
            percentage=ps.get("percentage"),
            paid_status="settled" if is_payer else "unpaid"
        )
        db.add(part)

        # Notify other participants
        if not is_payer:
            notif = Notification(
                user_id=ps["user_id"],
                title="New Shared Expense",
                message=f"{current_user.full_name} added '{new_expense.title}'. Your share is ₹{ps['share_amount_paise']/100:.2f}",
                type="expense_added",
                link_url=f"/households/{household_id}/expenses"
            )
            db.add(notif)

    # Activity Log
    act = HouseholdActivityLog(
        household_id=household_id,
        user_id=current_user.id,
        action_type="expense_created",
        description=f"{current_user.full_name} logged an expense '{new_expense.title}' of ₹{total/100:.2f}"
    )
    db.add(act)

    db.commit()
    db.refresh(new_expense)
    return new_expense

@router.get("/", response_model=List[ExpenseResponse])
def list_expenses(
    household_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_household_member(household_id, current_user, db)
    expenses = db.query(Expense).filter(
        Expense.household_id == household_id
    ).order_by(Expense.expense_date.desc()).all()
    return expenses

@router.get("/balances", response_model=List[BalanceSummaryItem])
def get_household_balances(
    household_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Computes net balances for all household members:
    Net Balance = (Total Paid for expenses) + (Settlements Paid) - (Total Share owed) - (Settlements Received)
    Positive: is owed money
    Negative: owes money
    """
    require_household_member(household_id, current_user, db)
    members = db.query(HouseholdMember).filter(HouseholdMember.household_id == household_id).all()
    
    balances: Dict[str, Dict[str, Any]] = {}
    for m in members:
        u = m.user or db.query(User).filter(User.id == m.user_id).first()
        balances[m.user_id] = {
            "user_id": m.user_id,
            "user_name": u.full_name if u else "Member",
            "total_paid_paise": 0,
            "total_share_paise": 0,
            "settlements_paid_paise": 0,
            "settlements_received_paise": 0
        }

    # Sum expenses paid
    expenses = db.query(Expense).filter(Expense.household_id == household_id).all()
    for e in expenses:
        if e.paid_by_id in balances:
            balances[e.paid_by_id]["total_paid_paise"] += e.total_amount_paise

    # Sum shares owed
    exp_ids = [e.id for e in expenses]
    if exp_ids:
        participants = db.query(ExpenseParticipant).filter(ExpenseParticipant.expense_id.in_(exp_ids)).all()
        for p in participants:
            if p.user_id in balances:
                balances[p.user_id]["total_share_paise"] += p.share_amount_paise

    # Account for confirmed settlements
    settlements = db.query(Settlement).filter(
        Settlement.household_id == household_id,
        Settlement.status == "confirmed"
    ).all()
    for s in settlements:
        if s.payer_id in balances:
            balances[s.payer_id]["settlements_paid_paise"] += s.amount_paise
        if s.payee_id in balances:
            balances[s.payee_id]["settlements_received_paise"] += s.amount_paise

    results = []
    for uid, b in balances.items():
        net = (b["total_paid_paise"] + b["settlements_paid_paise"]) - (b["total_share_paise"] + b["settlements_received_paise"])
        results.append(BalanceSummaryItem(
            user_id=uid,
            user_name=b["user_name"],
            total_paid_paise=b["total_paid_paise"],
            total_share_paise=b["total_share_paise"],
            net_balance_paise=net
        ))

    return results

@router.delete("/{expense_id}")
def delete_expense(
    household_id: str,
    expense_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    mem = require_household_member(household_id, current_user, db)
    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.household_id == household_id).first()
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")

    if expense.paid_by_id != current_user.id and mem.role not in ["owner", "admin"] and current_user.role not in ["platform_admin", "super_admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this expense")

    # Record activity log before deletion
    act = HouseholdActivityLog(
        household_id=household_id,
        user_id=current_user.id,
        action_type="expense_deleted",
        description=f"{current_user.full_name} deleted expense '{expense.title}' (₹{expense.total_amount_paise/100:.2f})"
    )
    db.add(act)
    db.delete(expense)
    db.commit()
    return {"message": "Expense deleted successfully"}
