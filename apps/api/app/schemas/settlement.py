from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.schemas.auth import UserResponse

class SettlementCreate(BaseModel):
    payee_id: str
    amount_paise: int = Field(..., gt=0)
    upi_reference: Optional[str] = None
    proof_url: Optional[str] = None

class SettlementConfirmRequest(BaseModel):
    status: str # confirmed, rejected

class SettlementResponse(BaseModel):
    id: str
    household_id: str
    payer_id: str
    payer: Optional[UserResponse] = None
    payee_id: str
    payee: Optional[UserResponse] = None
    amount_paise: int
    upi_reference: Optional[str] = None
    proof_url: Optional[str] = None
    status: str
    created_at: datetime
    confirmed_at: Optional[datetime] = None

    class Config:
        from_attributes = True
