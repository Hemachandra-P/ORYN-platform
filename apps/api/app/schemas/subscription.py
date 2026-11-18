from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.auth import UserResponse

class SubscriptionPlanResponse(BaseModel):
    id: str
    name: str
    price_inr_year: int
    validity_months: int = 6
    description: str
    features: List[str]
    max_members: int
    max_households: int
    is_active: bool

    class Config:
        from_attributes = True

class OrderCreateRequest(BaseModel):
    plan_id: str

class OrderCreateResponse(BaseModel):
    order_id: str
    amount_paise: int
    currency: str
    key_id: str
    plan_id: str
    is_simulation: bool

class PaymentVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    plan_id: str

class SubscriptionResponse(BaseModel):
    id: str
    user_id: str
    plan_id: str
    status: str
    current_period_start: datetime
    current_period_end: datetime
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    created_at: datetime
    plan: Optional[SubscriptionPlanResponse] = None

    class Config:
        from_attributes = True

class MarketplaceMembershipResponse(BaseModel):
    id: str
    user_id: str
    user: Optional[UserResponse] = None
    plan_name: str
    price_paise: int
    status: str # active, expired, pending, failed, cancelled, refunded
    current_period_start: datetime
    current_period_end: datetime
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    is_simulation: bool
    created_at: datetime

    class Config:
        from_attributes = True

class MarketplaceMembershipCheckoutResponse(BaseModel):
    order_id: str
    amount_paise: int
    currency: str
    key_id: str
    is_simulation: bool

class MarketplaceMembershipVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

class TransactionResponse(BaseModel):
    id: str
    user_id: str
    plan_id: str
    amount_paise: int
    currency: str
    razorpay_order_id: str
    razorpay_payment_id: Optional[str] = None
    status: str
    is_simulation: bool
    created_at: datetime
    verified_at: Optional[datetime] = None

    class Config:
        from_attributes = True
