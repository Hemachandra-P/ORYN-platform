import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Integer, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class MarketplaceListing(Base):
    __tablename__ = "marketplace_listings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    seller_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False, index=True)
    category = Column(String(50), nullable=False, index=True) # furniture, electronics, appliances, kitchen, books, study, bicycles, sports, home_essentials, other
    description = Column(Text, nullable=False)
    selling_price_paise = Column(Integer, nullable=False, index=True)
    original_price_paise = Column(Integer, nullable=True)
    condition = Column(String(50), nullable=False) # brand_new, like_new, good, fair
    location = Column(String(255), nullable=False)
    city = Column(String(100), default="Chennai", nullable=False, index=True)
    reason_for_selling = Column(Text, nullable=True)
    is_moving_out_sale = Column(Boolean, default=False, nullable=False, index=True)
    moving_out_collection_title = Column(String(255), nullable=True)
    status = Column(String(50), default="active", nullable=False, index=True) # draft, active, sold, paused, deleted, moderation_flagged, removed
    views_count = Column(Integer, default=0, nullable=False)
    contact_preference = Column(String(50), default="in_app_chat", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    sold_at = Column(DateTime, nullable=True)

    seller = relationship("User", back_populates="marketplace_listings")
    images = relationship("ListingImage", back_populates="listing", cascade="all, delete-orphan", order_by="ListingImage.sort_order")
    favorites = relationship("ListingFavorite", back_populates="listing", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="listing", cascade="all, delete-orphan")
    transactions = relationship("MarketplaceTransaction", back_populates="listing", cascade="all, delete-orphan")

class ListingImage(Base):
    __tablename__ = "listing_images"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    listing_id = Column(String(36), ForeignKey("marketplace_listings.id"), nullable=False, index=True)
    image_url = Column(Text, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)

    listing = relationship("MarketplaceListing", back_populates="images")

class ListingFavorite(Base):
    __tablename__ = "listing_favorites"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    listing_id = Column(String(36), ForeignKey("marketplace_listings.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    listing = relationship("MarketplaceListing", back_populates="favorites")

class MarketplaceTransaction(Base):
    __tablename__ = "marketplace_transactions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    listing_id = Column(String(36), ForeignKey("marketplace_listings.id"), nullable=False, index=True)
    seller_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    buyer_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    item_price_paise = Column(Integer, nullable=False)
    total_fee_paise = Column(Integer, default=2000, nullable=False) # default ₹20.00
    seller_fee_paise = Column(Integer, default=2000, nullable=False)
    buyer_fee_paise = Column(Integer, default=0, nullable=False)
    fee_policy_applied = Column(String(50), default="seller_fee", nullable=False) # seller_fee, buyer_fee, both_fee, combined_fee
    currency = Column(String(10), default="INR", nullable=False)
    
    razorpay_order_id = Column(String(100), unique=True, index=True, nullable=False)
    razorpay_payment_id = Column(String(100), unique=True, index=True, nullable=True)
    razorpay_signature = Column(String(255), nullable=True)
    status = Column(String(50), default="created", nullable=False, index=True) # created, verified, completed, failed, refunded
    refund_reason = Column(Text, nullable=True)
    refunded_at = Column(DateTime, nullable=True)
    is_simulation = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    listing = relationship("MarketplaceListing", back_populates="transactions")
    seller = relationship("User", foreign_keys=[seller_id])
    buyer = relationship("User", foreign_keys=[buyer_id])
