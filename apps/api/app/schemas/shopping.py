from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.schemas.auth import UserResponse

class ShoppingItemCreate(BaseModel):
    title: str
    quantity: str = "1"
    estimated_price_paise: Optional[int] = None
    assigned_to_id: Optional[str] = None

class ShoppingItemUpdate(BaseModel):
    title: Optional[str] = None
    quantity: Optional[str] = None
    estimated_price_paise: Optional[int] = None
    actual_price_paise: Optional[int] = None
    assigned_to_id: Optional[str] = None
    is_purchased: Optional[bool] = None
    receipt_url: Optional[str] = None

class ShoppingItemResponse(BaseModel):
    id: str
    household_id: str
    title: str
    quantity: str
    estimated_price_paise: Optional[int] = None
    actual_price_paise: Optional[int] = None
    assigned_to_id: Optional[str] = None
    assigned_to: Optional[UserResponse] = None
    is_purchased: bool
    purchased_by_id: Optional[str] = None
    purchased_by: Optional[UserResponse] = None
    purchased_at: Optional[datetime] = None
    receipt_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
