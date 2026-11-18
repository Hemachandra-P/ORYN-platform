from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
from app.schemas.auth import UserResponse

class ParticipantShareInput(BaseModel):
    user_id: str
    share_amount_paise: Optional[int] = None # Calculated automatically if split is equal
    percentage: Optional[float] = None

class ExpenseCreate(BaseModel):
    title: str
    description: Optional[str] = None
    total_amount_paise: int = Field(..., gt=0, description="Amount in integer paise (e.g., 120000 for ₹1,200.00)")
    category: str = "groceries"
    split_method: str = "equal" # equal, custom, percentage
    receipt_url: Optional[str] = None
    expense_date: Optional[datetime] = None
    participants: Optional[List[ParticipantShareInput]] = None # If empty or null, splits equally among all members

class ExpenseParticipantResponse(BaseModel):
    id: str
    user_id: str
    share_amount_paise: int
    percentage: Optional[float] = None
    paid_status: str
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True

class ExpenseResponse(BaseModel):
    id: str
    household_id: str
    title: str
    description: Optional[str] = None
    total_amount_paise: int
    category: str
    paid_by_id: str
    paid_by: Optional[UserResponse] = None
    expense_date: datetime
    receipt_url: Optional[str] = None
    split_method: str
    participants: List[ExpenseParticipantResponse]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class BalanceSummaryItem(BaseModel):
    user_id: str
    user_name: str
    total_paid_paise: int
    total_share_paise: int
    net_balance_paise: int # Positive: owed money (+), Negative: owes money (-)
