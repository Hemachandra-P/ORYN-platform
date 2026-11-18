from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.auth import UserResponse
from app.schemas.marketplace import MarketplaceListingResponse

class ChatMessageCreate(BaseModel):
    conversation_id: Optional[str] = None
    recipient_id: Optional[str] = None
    listing_id: Optional[str] = None
    content: str

class ChatMessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender_id: str
    sender: Optional[UserResponse] = None
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class ConversationResponse(BaseModel):
    id: str
    listing_id: Optional[str] = None
    listing: Optional[MarketplaceListingResponse] = None
    buyer_id: str
    buyer: Optional[UserResponse] = None
    seller_id: str
    seller: Optional[UserResponse] = None
    last_message: Optional[str] = None
    last_message_at: datetime
    created_at: datetime
    messages: Optional[List[ChatMessageResponse]] = None

    class Config:
        from_attributes = True
