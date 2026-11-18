from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.schemas.auth import UserResponse

class BillCreate(BaseModel):
    title: str
    category: str # electricity, internet, water, rent, maintenance, gas, other
    custom_category: Optional[str] = None # Mandatory if category == "other"
    amount_paise: int = Field(..., gt=0)
    due_date: datetime
    recurrence: str = "none" # none, monthly, quarterly, yearly
    notes: Optional[str] = None
    receipt_url: Optional[str] = None

class BillUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    custom_category: Optional[str] = None
    amount_paise: Optional[int] = None
    due_date: Optional[datetime] = None
    recurrence: Optional[str] = None
    is_paid: Optional[bool] = None
    notes: Optional[str] = None
    receipt_url: Optional[str] = None

class BillResponse(BaseModel):
    id: str
    household_id: str
    title: str
    category: str
    custom_category: Optional[str] = None
    amount_paise: int
    due_date: datetime
    paid_by_id: Optional[str] = None
    paid_by: Optional[UserResponse] = None
    recurrence: str
    is_paid: bool
    paid_at: Optional[datetime] = None
    receipt_url: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
