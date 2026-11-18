from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.household import HouseholdActivityLog
from app.models.settlement import Settlement
from app.models.notification import Notification
from app.core.deps import get_current_user, require_household_member
from app.schemas.settlement import SettlementCreate, SettlementConfirmRequest, SettlementResponse

router = APIRouter(prefix="/households/{household_id}/settlements", tags=["Settlements"])

@router.post("/", response_model=SettlementResponse, status_code=status.HTTP_201_CREATED)
def record_settlement(
    household_id: str,
    settlement_in: SettlementCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_household_member(household_id, current_user, db)
    if settlement_in.payee_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payer and Payee cannot be the same user"
        )

    settlement = Settlement(
        household_id=household_id,
        payer_id=current_user.id,
        payee_id=settlement_in.payee_id,
        amount_paise=settlement_in.amount_paise,
        upi_reference=settlement_in.upi_reference,
        proof_url=settlement_in.proof_url,
        status="pending"
    )
    db.add(settlement)

    # Notify payee
    notif = Notification(
        user_id=settlement_in.payee_id,
        title="Payment Settlement Recorded",
        message=f"{current_user.full_name} recorded a payment of ₹{settlement_in.amount_paise/100:.2f}. Please confirm when received.",
        type="settlement_requested",
        link_url=f"/households/{household_id}/settlements"
    )
    db.add(notif)

    act = HouseholdActivityLog(
        household_id=household_id,
        user_id=current_user.id,
        action_type="settlement_recorded",
        description=f"{current_user.full_name} recorded a payment of ₹{settlement_in.amount_paise/100:.2f}"
    )
    db.add(act)

    db.commit()
    db.refresh(settlement)
    return settlement

@router.get("/", response_model=List[SettlementResponse])
def list_settlements(
    household_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_household_member(household_id, current_user, db)
    settlements = db.query(Settlement).filter(
        Settlement.household_id == household_id
    ).order_by(Settlement.created_at.desc()).all()
    return settlements

@router.post("/{settlement_id}/confirm", response_model=SettlementResponse)
def confirm_settlement(
    household_id: str,
    settlement_id: str,
    req: SettlementConfirmRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    settlement = db.query(Settlement).filter(
        Settlement.id == settlement_id,
        Settlement.household_id == household_id
    ).first()
    if not settlement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Settlement record not found")

    # Only the payee or an authorized super admin can confirm receipt
    if settlement.payee_id != current_user.id and current_user.role not in ["platform_admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the payee can verify and confirm payment receipt"
        )

    settlement.status = req.status
    if req.status == "confirmed":
        settlement.confirmed_at = datetime.utcnow()
        # Notify payer
        notif = Notification(
            user_id=settlement.payer_id,
            title="Payment Confirmed!",
            message=f"{current_user.full_name} confirmed receipt of your ₹{settlement.amount_paise/100:.2f} payment.",
            type="settlement_confirmed",
            link_url=f"/households/{household_id}/settlements"
        )
        db.add(notif)

    act = HouseholdActivityLog(
        household_id=household_id,
        user_id=current_user.id,
        action_type="settlement_confirmed" if req.status == "confirmed" else "settlement_rejected",
        description=f"{current_user.full_name} {req.status} the settlement of ₹{settlement.amount_paise/100:.2f}"
    )
    db.add(act)

    db.commit()
    db.refresh(settlement)
    return settlement
