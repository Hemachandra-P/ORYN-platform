from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.auth import UserResponse

class CommunityCreate(BaseModel):
    name: str
    city: str = "Chennai"
    description: Optional[str] = None

class CommunityResponse(BaseModel):
    id: str
    name: str
    city: str
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class HouseholdMemberResponse(BaseModel):
    id: str
    user_id: str
    role: str
    joined_at: datetime
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True

class HouseholdCreate(BaseModel):
    name: str
    description: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = "Chennai"
    photo_url: Optional[str] = None
    
    # Community & Building Hierarchy
    community_name: Optional[str] = None
    community_id: Optional[str] = None
    building: Optional[str] = None
    flat_number: Optional[str] = None
    
    # Optional Joining Password
    joining_password: Optional[str] = None
    password_joining_enabled: Optional[bool] = False

class HouseholdUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    photo_url: Optional[str] = None
    community_name: Optional[str] = None
    community_id: Optional[str] = None
    building: Optional[str] = None
    flat_number: Optional[str] = None
    joining_password: Optional[str] = None
    password_joining_enabled: Optional[bool] = None

class JoinHouseholdRequest(BaseModel):
    invitation_code: str
    joining_password: Optional[str] = None

class DirectInviteRequest(BaseModel):
    email: Optional[str] = None
    user_id: Optional[str] = None

class HouseholdInvitationResponse(BaseModel):
    id: str
    household_id: str
    inviter_id: str
    inviter: Optional[UserResponse] = None
    invitee_id: Optional[str] = None
    invitee: Optional[UserResponse] = None
    email: Optional[str] = None
    type: str # invitation, join_request
    status: str # pending, accepted, rejected, expired
    created_at: datetime
    expires_at: datetime

    class Config:
        from_attributes = True

class HouseholdResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    photo_url: Optional[str] = None
    invitation_code: str
    owner_id: str
    status: str
    
    community_id: Optional[str] = None
    community_name: Optional[str] = None
    building: Optional[str] = None
    flat_number: Optional[str] = None
    password_joining_enabled: Optional[bool] = False
    full_identity: Optional[str] = None
    
    created_at: datetime
    updated_at: datetime
    members: Optional[List[HouseholdMemberResponse]] = None

    class Config:
        from_attributes = True

class HouseholdActivityResponse(BaseModel):
    id: str
    household_id: str
    user_id: str
    action_type: str
    description: str
    created_at: datetime

    class Config:
        from_attributes = True
