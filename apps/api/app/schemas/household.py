from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.auth import UserResponse

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

class HouseholdUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    photo_url: Optional[str] = None

class JoinHouseholdRequest(BaseModel):
    invitation_code: str

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
