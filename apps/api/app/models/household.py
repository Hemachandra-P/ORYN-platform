import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Integer
from sqlalchemy.orm import relationship
from app.database import Base

class Household(Base):
    __tablename__ = "households"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    address = Column(String(500), nullable=True)
    city = Column(String(100), nullable=True)
    photo_url = Column(Text, nullable=True)
    invitation_code = Column(String(32), unique=True, index=True, nullable=False)
    owner_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    status = Column(String(50), default="active", nullable=False) # active, suspended, archived
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    members = relationship("HouseholdMember", back_populates="household", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="household", cascade="all, delete-orphan")
    bills = relationship("Bill", back_populates="household", cascade="all, delete-orphan")
    settlements = relationship("Settlement", back_populates="household", cascade="all, delete-orphan")
    shopping_items = relationship("ShoppingItem", back_populates="household", cascade="all, delete-orphan")
    tasks = relationship("HouseholdTask", back_populates="household", cascade="all, delete-orphan")
    activity_logs = relationship("HouseholdActivityLog", back_populates="household", cascade="all, delete-orphan")

class HouseholdMember(Base):
    __tablename__ = "household_members"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    household_id = Column(String(36), ForeignKey("households.id"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    role = Column(String(50), default="member", nullable=False) # owner, admin, member
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    household = relationship("Household", back_populates="members")
    user = relationship("User", back_populates="household_memberships")

class HouseholdInvitation(Base):
    __tablename__ = "household_invitations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    household_id = Column(String(36), ForeignKey("households.id"), nullable=False)
    inviter_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    email = Column(String(255), nullable=True)
    invite_token = Column(String(64), unique=True, index=True, nullable=False)
    status = Column(String(50), default="pending", nullable=False) # pending, accepted, rejected, expired
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)

class HouseholdActivityLog(Base):
    __tablename__ = "household_activity_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    household_id = Column(String(36), ForeignKey("households.id"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    action_type = Column(String(50), nullable=False) # expense_created, member_joined, bill_paid, task_done, etc.
    description = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    household = relationship("Household", back_populates="activity_logs")
