from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.household import HouseholdActivityLog
from app.models.bill import Bill
from app.core.deps import get_current_user, require_household_member
from app.schemas.bill import BillCreate, BillUpdate, BillResponse

router = APIRouter(prefix="/households/{household_id}/bills", tags=["Bills"])

@router.post("/", response_model=BillResponse, status_code=status.HTTP_201_CREATED)
def create_bill(
    household_id: str,
    bill_in: BillCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_household_member(household_id, current_user, db)

    new_bill = Bill(
        household_id=household_id,
        title=bill_in.title,
        category=bill_in.category,
        amount_paise=bill_in.amount_paise,
        due_date=bill_in.due_date,
        recurrence=bill_in.recurrence,
        notes=bill_in.notes,
        receipt_url=bill_in.receipt_url,
        is_paid=False
    )
    db.add(new_bill)

    act = HouseholdActivityLog(
        household_id=household_id,
        user_id=current_user.id,
        action_type="bill_added",
        description=f"{current_user.full_name} added recurring/upcoming bill '{new_bill.title}' (₹{new_bill.amount_paise/100:.2f})"
    )
    db.add(act)

    db.commit()
    db.refresh(new_bill)
    return new_bill

@router.get("/", response_model=List[BillResponse])
def list_bills(
    household_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_household_member(household_id, current_user, db)
    bills = db.query(Bill).filter(Bill.household_id == household_id).order_by(Bill.due_date.asc()).all()
    return bills

@router.put("/{bill_id}", response_model=BillResponse)
def update_bill(
    household_id: str,
    bill_id: str,
    bill_in: BillUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_household_member(household_id, current_user, db)
    bill = db.query(Bill).filter(Bill.id == bill_id, Bill.household_id == household_id).first()
    if not bill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bill not found")

    if bill_in.title is not None:
        bill.title = bill_in.title
    if bill_in.amount_paise is not None:
        bill.amount_paise = bill_in.amount_paise
    if bill_in.due_date is not None:
        bill.due_date = bill_in.due_date
    if bill_in.recurrence is not None:
        bill.recurrence = bill_in.recurrence
    if bill_in.notes is not None:
        bill.notes = bill_in.notes
    if bill_in.receipt_url is not None:
        bill.receipt_url = bill_in.receipt_url
    if bill_in.is_paid is not None:
        bill.is_paid = bill_in.is_paid
        if bill_in.is_paid:
            bill.paid_at = datetime.utcnow()
            bill.paid_by_id = current_user.id
            act = HouseholdActivityLog(
                household_id=household_id,
                user_id=current_user.id,
                action_type="bill_paid",
                description=f"{current_user.full_name} marked bill '{bill.title}' as paid"
            )
            db.add(act)

    db.commit()
    db.refresh(bill)
    return bill

@router.delete("/{bill_id}")
def delete_bill(
    household_id: str,
    bill_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    mem = require_household_member(household_id, current_user, db)
    bill = db.query(Bill).filter(Bill.id == bill_id, Bill.household_id == household_id).first()
    if not bill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bill not found")

    db.delete(bill)
    db.commit()
    return {"message": "Bill removed successfully"}
