from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.schemas.auth import UserResponse

class HouseholdTaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    assigned_to_id: Optional[str] = None
    due_date: Optional[datetime] = None
    recurrence: Optional[str] = "none"

class HouseholdTaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assigned_to_id: Optional[str] = None
    due_date: Optional[datetime] = None
    recurrence: Optional[str] = None
    status: Optional[str] = None # todo, in_progress, completed

class HouseholdTaskResponse(BaseModel):
    id: str
    household_id: str
    title: str
    description: Optional[str] = None
    assigned_to_id: Optional[str] = None
    assigned_to: Optional[UserResponse] = None
    due_date: Optional[datetime] = None
    recurrence: str
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True
