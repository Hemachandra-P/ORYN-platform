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
    status: Optional[str] = None # active, paused, sold
    images: Optional[List[str]] = None

class MarketplaceListingResponse(BaseModel):
    id: str
    seller_id: str
    seller: Optional[UserResponse] = None
    title: str
    category: str
    description: str
    selling_price_paise: int
    original_price_paise: Optional[int] = None
    condition: str
    location: str
    city: str
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

    class Config:
        from_attributes = True
