import uuid
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app.database import get_db
from app.models.user import User
from app.models.household import Household, HouseholdMember, HouseholdInvitation, HouseholdActivityLog, Community
from app.core.deps import get_current_user, require_household_member
from app.core.security import get_password_hash, verify_password
from app.core.household_limits import get_household_capacity
from app.schemas.household import (
    HouseholdCreate, HouseholdUpdate, HouseholdResponse, JoinHouseholdRequest,
    HouseholdActivityResponse, HouseholdMemberResponse, CommunityCreate,
    CommunityResponse, DirectInviteRequest, HouseholdInvitationResponse
)

router = APIRouter(prefix="/households", tags=["Households"])

# -------------------------------------------------------------
# COMMUNITIES MANAGEMENT
# -------------------------------------------------------------

@router.get("/communities", response_model=List[CommunityResponse])
def get_communities(
    city: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Community)
    if city:
        query = query.filter(Community.city.ilike(f"%{city}%"))
    return query.order_by(Community.name.asc()).all()

@router.post("/communities", response_model=CommunityResponse, status_code=status.HTTP_201_CREATED)
def create_community(
    comm_in: CommunityCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cleaned_name = comm_in.name.strip()
    if not cleaned_name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Community name cannot be empty")

    # Prevent accidental duplicate entries (case-insensitive)
    existing = db.query(Community).filter(
        Community.name.ilike(cleaned_name)
    ).first()
    if existing:
        return existing

    new_comm = Community(
        name=cleaned_name,
        city=comm_in.city.strip() if comm_in.city else "Chennai",
        description=comm_in.description
    )
    db.add(new_comm)
    db.commit()
    db.refresh(new_comm)
    return new_comm

# -------------------------------------------------------------
# HOUSEHOLD CREATION & IDENTIFICATION
# -------------------------------------------------------------

@router.post("/", response_model=HouseholdResponse, status_code=status.HTTP_201_CREATED)
def create_household(
    house_in: HouseholdCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Resolve or create community if provided
    community_id = house_in.community_id
    community_name = house_in.community_name.strip() if house_in.community_name else None

    if community_name:
        comm_record = db.query(Community).filter(Community.name.ilike(community_name)).first()
        if not comm_record:
            comm_record = Community(name=community_name, city=house_in.city or "Chennai")
            db.add(comm_record)
            db.flush()
        community_id = comm_record.id
        community_name = comm_record.name

    invitation_code = f"SYNC-{uuid.uuid4().hex[:6].upper()}"

    # Handle Joining Password
    pw_hash = None
    pw_enabled = False
    if house_in.joining_password and house_in.joining_password.strip():
        pw_hash = get_password_hash(house_in.joining_password.strip())
        pw_enabled = True
    elif house_in.password_joining_enabled and house_in.joining_password:
        pw_hash = get_password_hash(house_in.joining_password.strip())
        pw_enabled = True

    new_house = Household(
        name=house_in.name,
        description=house_in.description,
        address=house_in.address,
        city=house_in.city or "Chennai",
        photo_url=house_in.photo_url,
        invitation_code=invitation_code,
        owner_id=current_user.id,
        status="active",
        community_id=community_id,
        community_name=community_name,
        building=house_in.building.strip() if house_in.building else None,
        flat_number=house_in.flat_number.strip() if house_in.flat_number else None,
        joining_password_hash=pw_hash,
        password_joining_enabled=pw_enabled
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

    # Activity log
    activity = HouseholdActivityLog(
        household_id=new_house.id,
        user_id=current_user.id,
        action_type="household_created",
        description=f"{current_user.full_name} created the household '{new_house.full_identity}'"
    )
    db.add(activity)

    db.commit()
    db.refresh(new_house)
    
    res = HouseholdResponse.model_validate(new_house)
    res.full_identity = new_house.full_identity
    return res

@router.get("/", response_model=List[HouseholdResponse])
def get_user_households(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    memberships = db.query(HouseholdMember).filter(HouseholdMember.user_id == current_user.id).all()
    house_ids = [m.household_id for m in memberships]
    households = db.query(Household).filter(Household.id.in_(house_ids), Household.status == "active").all()
    
    res_list = []
    for h in households:
        r = HouseholdResponse.model_validate(h)
        r.full_identity = h.full_identity
        res_list.append(r)
    return res_list

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
    
    res = HouseholdResponse.model_validate(household)
    res.full_identity = household.full_identity
    return res

@router.get("/{household_id}/capacity")
def get_household_capacity_info(
    household_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_household_member(household_id, current_user, db)
    household = db.query(Household).filter(Household.id == household_id).first()
    if not household:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Household not found")

    return get_household_capacity(household, db)

# -------------------------------------------------------------
# JOINING METHOD A: INVITATION CODE & JOINING PASSWORD
# -------------------------------------------------------------

@router.post("/join", response_model=HouseholdResponse)
def join_household_by_code_and_password(
    req: JoinHouseholdRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    code_cleaned = req.invitation_code.strip().upper()
    household = db.query(Household).filter(
        Household.invitation_code == code_cleaned,
        Household.status == "active"
    ).first()
    if not household:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid invitation code or household is inactive"
        )

    # Check if user is already a member
    existing = db.query(HouseholdMember).filter(
        HouseholdMember.household_id == household.id,
        HouseholdMember.user_id == current_user.id
    ).first()
    if existing:
        res = HouseholdResponse.model_validate(household)
        res.full_identity = household.full_identity
        return res

    # Check password if enabled
    if household.password_joining_enabled and household.joining_password_hash:
        if not req.joining_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Household joining password is required to join this flat."
            )
        if not verify_password(req.joining_password, household.joining_password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect household joining password."
            )

    # Transactional capacity check: enforce Free 3-member limit unless owner is Premium
    capacity = get_household_capacity(household, db)
    if not capacity["can_add_member"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=capacity["limit_reached_message"]
        )

    # A valid invitation code (and joining password, when the flat has one) is enough:
    # the user becomes a member straight away.
    db.add(HouseholdMember(household_id=household.id, user_id=current_user.id, role="member"))

    # Close any pending request this user had for the same flat.
    db.query(HouseholdInvitation).filter(
        HouseholdInvitation.household_id == household.id,
        HouseholdInvitation.invitee_id == current_user.id,
        HouseholdInvitation.status == "pending"
    ).update({"status": "accepted"})

    db.add(HouseholdActivityLog(
        household_id=household.id,
        user_id=current_user.id,
        action_type="member_joined",
        description=f"{current_user.full_name} joined the household with the invitation code"
    ))
    db.commit()

    res = HouseholdResponse.model_validate(household)
    res.full_identity = household.full_identity
    return res

# -------------------------------------------------------------
# JOINING METHOD B: DIRECT INVITATIONS
# -------------------------------------------------------------

@router.post("/{household_id}/invitations")
def create_direct_invitation(
    household_id: str,
    req: DirectInviteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    mem = require_household_member(household_id, current_user, db)
    if mem.role not in ["owner", "admin"] and current_user.role not in ["platform_admin", "super_admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only owners and admins can invite members")

    household = db.query(Household).filter(Household.id == household_id).first()
    if not household:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Household not found")

    # Enforce capacity check
    capacity = get_household_capacity(household, db)
    if not capacity["can_add_member"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=capacity["limit_reached_message"])

    # Find invitee by email or user_id
    invitee = None
    if req.user_id:
        invitee = db.query(User).filter(User.id == req.user_id).first()
    elif req.email:
        invitee = db.query(User).filter(User.email == req.email.strip().lower()).first()

    if not invitee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found with provided credentials")

    # Check if already in household
    already_in = db.query(HouseholdMember).filter(
        HouseholdMember.household_id == household_id,
        HouseholdMember.user_id == invitee.id
    ).first()
    if already_in:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is already a member of this household")

    # Check duplicate pending invitation
    dup = db.query(HouseholdInvitation).filter(
        HouseholdInvitation.household_id == household_id,
        HouseholdInvitation.invitee_id == invitee.id,
        HouseholdInvitation.status == "pending"
    ).first()
    if dup:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="An invitation is already pending for this user")

    inv = HouseholdInvitation(
        household_id=household_id,
        inviter_id=current_user.id,
        invitee_id=invitee.id,
        email=invitee.email,
        type="invitation",
        invite_token=uuid.uuid4().hex,
        status="pending",
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    db.add(inv)
    db.commit()

    return {"message": f"Invitation successfully sent to {invitee.full_name} ({invitee.email})", "invitation_id": inv.id}

@router.get("/{household_id}/invitations", response_model=List[HouseholdInvitationResponse])
def get_household_invitations(
    household_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    mem = require_household_member(household_id, current_user, db)
    invs = db.query(HouseholdInvitation).filter(
        HouseholdInvitation.household_id == household_id
    ).order_by(HouseholdInvitation.created_at.desc()).all()
    return invs

@router.post("/{household_id}/invitations/{inv_id}/approve")
def approve_join_request_or_accept(
    household_id: str,
    inv_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    household = db.query(Household).filter(Household.id == household_id).first()
    if not household:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Household not found")

    inv = db.query(HouseholdInvitation).filter(
        HouseholdInvitation.id == inv_id,
        HouseholdInvitation.household_id == household_id
    ).first()
    if not inv or inv.status != "pending":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pending request not found")

    # If it is a join_request, only owner/admin can approve
    if inv.type == "join_request":
        mem = require_household_member(household_id, current_user, db)
        if mem.role not in ["owner", "admin"] and current_user.role not in ["platform_admin", "super_admin"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only owners and admins can approve join requests")
        user_to_add_id = inv.invitee_id
    else:
        # If it is an invitation sent to user, the invited user can accept
        if inv.invitee_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the invited user can accept this invitation")
        user_to_add_id = current_user.id

    # Recheck capacity right before adding member (concurrency safety)
    capacity = get_household_capacity(household, db)
    if not capacity["can_add_member"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=capacity["limit_reached_message"])

    # Add member
    new_mem = HouseholdMember(
        household_id=household.id,
        user_id=user_to_add_id,
        role="member"
    )
    db.add(new_mem)
    inv.status = "accepted"

    user_obj = db.query(User).filter(User.id == user_to_add_id).first()
    act = HouseholdActivityLog(
        household_id=household.id,
        user_id=user_to_add_id,
        action_type="member_joined",
        description=f"{user_obj.full_name if user_obj else 'New member'} joined the household"
    )
    db.add(act)
    db.commit()

    return {"message": "Member successfully added to household!"}

@router.post("/{household_id}/invitations/{inv_id}/reject")
def reject_join_request_or_invitation(
    household_id: str,
    inv_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    inv = db.query(HouseholdInvitation).filter(
        HouseholdInvitation.id == inv_id,
        HouseholdInvitation.household_id == household_id
    ).first()
    if not inv or inv.status != "pending":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pending request not found")

    inv.status = "rejected"
    db.commit()
    return {"message": "Request or invitation has been rejected."}

# -------------------------------------------------------------
# OWNER MEMBER MANAGEMENT (KICK/REMOVE, MANAGE PASSWORD)
# -------------------------------------------------------------

@router.put("/{household_id}/security-password")
def update_household_joining_password(
    household_id: str,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    household = db.query(Household).filter(Household.id == household_id).first()
    if not household:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Household not found")

    if household.owner_id != current_user.id and current_user.role not in ["platform_admin", "super_admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the household owner can configure joining passwords")

    new_password = payload.get("joining_password")
    enable_password = payload.get("enabled", True)

    if enable_password and new_password:
        household.joining_password_hash = get_password_hash(new_password.strip())
        household.password_joining_enabled = True
    else:
        household.password_joining_enabled = False
        household.joining_password_hash = None

    db.commit()
    return {
        "message": "Household joining security updated successfully",
        "password_joining_enabled": household.password_joining_enabled
    }

@router.delete("/{household_id}/members/{user_id}")
def remove_household_member(
    household_id: str,
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Removes or kicks out a member.
    Revokes household access and removes from active member list.
    Preserves all historical expenses, payments, settlements, and audit logs.
    Does NOT delete personal user account.
    """
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

    target_user = db.query(User).filter(User.id == user_id).first()
    db.delete(target)

    # Audit log preserving attribution
    act = HouseholdActivityLog(
        household_id=household_id,
        user_id=current_user.id,
        action_type="member_removed",
        description=f"{current_user.full_name} removed {target_user.full_name if target_user else 'a member'} from the household. Financial records preserved."
    )
    db.add(act)
    db.commit()

    return {"message": "Member removed from household successfully. Historical records preserved."}

@router.post("/{household_id}/transfer-ownership")
def transfer_household_ownership(
    household_id: str,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_owner_id = payload.get("new_owner_id")
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
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Selected user is not an active member of this household")

    household.owner_id = new_owner_id
    target_member.role = "owner"
    
    prev_member = db.query(HouseholdMember).filter(
        HouseholdMember.household_id == household_id,
        HouseholdMember.user_id == current_user.id
    ).first()
    if prev_member:
        prev_member.role = "admin"

    db.commit()
    return {"message": "Household ownership successfully transferred"}

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
