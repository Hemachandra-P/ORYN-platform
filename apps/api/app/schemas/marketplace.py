from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.schemas.auth import UserResponse

class ListingImageResponse(BaseModel):
    id: str
    image_url: str
    sort_order: int

    class Config:
        from_attributes = True

class MarketplaceListingCreate(BaseModel):
    title: str
    category: str # furniture, electronics, appliances, kitchen, books, study, bicycles, sports, home_essentials, other
    description: str
    selling_price_paise: int = Field(..., gt=0)
    original_price_paise: Optional[int] = None
    condition: str # brand_new, like_new, good, fair
    location: str
    city: str = "Chennai"
    reason_for_selling: Optional[str] = None
    is_moving_out_sale: bool = False
    moving_out_collection_title: Optional[str] = None
    images: List[str] = []
    contact_preference: str = "in_app_chat"
    status: str = "active" # draft, active, paused

class MarketplaceListingUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    selling_price_paise: Optional[int] = None
    original_price_paise: Optional[int] = None
    condition: Optional[str] = None
    location: Optional[str] = None
    city: Optional[str] = None
    reason_for_selling: Optional[str] = None
    is_moving_out_sale: Optional[bool] = None
    moving_out_collection_title: Optional[str] = None
    status: Optional[str] = None # draft, active, paused, sold, deleted
    images: Optional[List[str]] = None

class MarketplaceListingStatusUpdate(BaseModel):
    status: str # draft, active, paused, sold, deleted

class MarketplaceListingResponse(BaseModel):
    id: str
    seller_id: str
    seller: Optional[UserResponse] = None
    title: str
    category: str
    description: str
    selling_price_paise: Optional[int] = None
    original_price_paise: Optional[int] = None
    condition: Optional[str] = None
    location: Optional[str] = None
    city: Optional[str] = None
    reason_for_selling: Optional[str] = None
    is_moving_out_sale: bool
    moving_out_collection_title: Optional[str] = None
    status: str
    views_count: int
    contact_preference: str
    images: List[ListingImageResponse] = []
    is_favorite: Optional[bool] = False
    created_at: datetime
    updated_at: datetime
    sold_at: Optional[datetime] = None
    enquiries_count: Optional[int] = 0
    is_preview: bool = False

    class Config:
        from_attributes = True

class MarketplaceFeePolicyConfig(BaseModel):
    fee_enabled: bool = True
    fee_amount_paise: int = 2000 # default ₹20 (2000 paise)
    fee_policy: str = "seller_fee" # seller_fee, buyer_fee, both_fee, combined_fee

class MarketplaceFeeCalculationResponse(BaseModel):
    item_price_paise: int
    fee_enabled: bool
    total_fee_paise: int
    seller_fee_paise: int
    buyer_fee_paise: int
    fee_policy: str
    total_buyer_amount_paise: int
    net_seller_amount_paise: int

class MarketplaceTransactionCreateRequest(BaseModel):
    listing_id: str
    buyer_id: Optional[str] = None

class MarketplaceTransactionResponse(BaseModel):
    id: str
    listing_id: str
    seller_id: str
    buyer_id: str
    item_price_paise: int
    total_fee_paise: int
    seller_fee_paise: int
    buyer_fee_paise: int
    fee_policy_applied: str
    currency: str
    razorpay_order_id: str
    razorpay_payment_id: Optional[str] = None
    status: str
    is_simulation: bool
    created_at: datetime
    completed_at: Optional[datetime] = None
    refund_reason: Optional[str] = None
    refunded_at: Optional[datetime] = None
    listing: Optional[MarketplaceListingResponse] = None
    seller: Optional[UserResponse] = None
    buyer: Optional[UserResponse] = None

    class Config:
        from_attributes = True

class MarketplaceTransactionVerifyRequest(BaseModel):
    transaction_id: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    is_simulation: bool = False
