import uuid
from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.household import Household, HouseholdMember, HouseholdInvitation, HouseholdActivityLog
from app.core.deps import get_current_user, require_household_member
from app.schemas.household import (
    HouseholdCreate, HouseholdUpdate, HouseholdResponse, JoinHouseholdRequest,
    HouseholdActivityResponse, HouseholdMemberResponse
)

router = APIRouter(prefix="/households", tags=["Households"])

@router.post("/", response_model=HouseholdResponse, status_code=status.HTTP_201_CREATED)
def create_household(
    house_in: HouseholdCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    invitation_code = f"SYNC-{uuid.uuid4().hex[:6].upper()}"
    new_house = Household(
        name=house_in.name,
        description=house_in.description,
        address=house_in.address,
        city=house_in.city,
        photo_url=house_in.photo_url,
        invitation_code=invitation_code,
        owner_id=current_user.id,
        status="active"
    )
    db.add(new_house)
    db.flush()

    # Creator becomes household owner member
    member = HouseholdMember(
        household_id=new_house.id,
        user_id=current_user.id,
        role="owner"
    )
    db.add(member)

    # Log initial creation
    activity = HouseholdActivityLog(
        household_id=new_house.id,
        user_id=current_user.id,
        action_type="household_created",
        description=f"{current_user.full_name} created the household '{new_house.name}'"
    )
    db.add(activity)

    db.commit()
    db.refresh(new_house)
    return new_house

@router.get("/", response_model=List[HouseholdResponse])
def get_user_households(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    memberships = db.query(HouseholdMember).filter(HouseholdMember.user_id == current_user.id).all()
    house_ids = [m.household_id for m in memberships]
    households = db.query(Household).filter(Household.id.in_(house_ids), Household.status == "active").all()
    return households

@router.get("/{household_id}", response_model=HouseholdResponse)
def get_household_details(
    household_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_household_member(household_id, current_user, db)
    household = db.query(Household).filter(Household.id == household_id).first()
    if not household:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Household not found")
    return household

@router.post("/join", response_model=HouseholdResponse)
def join_household_by_code(
    req: JoinHouseholdRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    code_cleaned = req.invitation_code.strip().upper()
    household = db.query(Household).filter(Household.invitation_code == code_cleaned, Household.status == "active").first()
    if not household:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid invitation code or household is inactive"
        )

    # Check if already a member
    existing = db.query(HouseholdMember).filter(
        HouseholdMember.household_id == household.id,
        HouseholdMember.user_id == current_user.id
    ).first()
    if existing:
        return household

    new_member = HouseholdMember(
        household_id=household.id,
        user_id=current_user.id,
        role="member"
    )
    db.add(new_member)

    activity = HouseholdActivityLog(
        household_id=household.id,
        user_id=current_user.id,
        action_type="member_joined",
        description=f"{current_user.full_name} joined the household using code {code_cleaned}"
    )
    db.add(activity)

    db.commit()
    db.refresh(household)
    return household

@router.post("/{household_id}/transfer-ownership")
def transfer_household_ownership(
    household_id: str,
    new_owner_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    household = db.query(Household).filter(Household.id == household_id).first()
    if not household:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Household not found")
    if household.owner_id != current_user.id and current_user.role not in ["platform_admin", "super_admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the household owner can transfer ownership")

    target_member = db.query(HouseholdMember).filter(
        HouseholdMember.household_id == household_id,
        HouseholdMember.user_id == new_owner_id
    ).first()
    if not target_member:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Selected user is not a member of this household")

    # Update household owner
    household.owner_id = new_owner_id
    target_member.role = "owner"
    
    # Demote previous owner to admin
    prev_member = db.query(HouseholdMember).filter(
        HouseholdMember.household_id == household_id,
        HouseholdMember.user_id == current_user.id
    ).first()
    if prev_member:
        prev_member.role = "admin"

    db.commit()
    return {"message": "Household ownership successfully transferred"}

@router.delete("/{household_id}/members/{user_id}")
def remove_household_member(
    household_id: str,
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    mem = require_household_member(household_id, current_user, db)
    if mem.role not in ["owner", "admin"] and current_user.id != user_id and current_user.role not in ["platform_admin", "super_admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to remove members")

    target = db.query(HouseholdMember).filter(
        HouseholdMember.household_id == household_id,
        HouseholdMember.user_id == user_id
    ).first()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member record not found")

    if target.role == "owner":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot remove the household owner. Transfer ownership first.")

    db.delete(target)
    db.commit()
    return {"message": "Member removed from household successfully"}

@router.get("/{household_id}/activity", response_model=List[HouseholdActivityResponse])
def get_household_activity(
    household_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_household_member(household_id, current_user, db)
    activities = db.query(HouseholdActivityLog).filter(
        HouseholdActivityLog.household_id == household_id
    ).order_by(HouseholdActivityLog.created_at.desc()).limit(50).all()
    return activities
