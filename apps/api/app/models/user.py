import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Enum, Text
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone_number = Column(String(50), nullable=True)
    city = Column(String(100), nullable=True)
    avatar_url = Column(Text, nullable=True)
    role = Column(String(50), default="user", nullable=False) # user, household_owner, household_admin, platform_admin, super_admin
    status = Column(String(50), default="active", nullable=False) # active, suspended, banned
    subscription_tier = Column(String(50), default="free", nullable=False) # free, basic_plus, premium
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    household_memberships = relationship("HouseholdMember", back_populates="user", cascade="all, delete-orphan")
    expenses_paid = relationship("Expense", back_populates="paid_by")
    marketplace_listings = relationship("MarketplaceListing", back_populates="seller", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
