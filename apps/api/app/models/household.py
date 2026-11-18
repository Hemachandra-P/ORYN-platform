import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Integer, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class Community(Base):
    __tablename__ = "communities"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), unique=True, index=True, nullable=False)
    city = Column(String(100), default="Chennai", nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    households = relationship("Household", back_populates="community")

class Household(Base):
    __tablename__ = "households"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    address = Column(String(500), nullable=True)
    city = Column(String(100), default="Chennai", nullable=True)
    photo_url = Column(Text, nullable=True)
    invitation_code = Column(String(32), unique=True, index=True, nullable=False)
    owner_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    status = Column(String(50), default="active", nullable=False) # active, suspended, archived
    
    # Hierarchy: Community -> Building/Tower/Block -> Flat/Room
    community_id = Column(String(36), ForeignKey("communities.id"), nullable=True)
    community_name = Column(String(255), nullable=True)
    building = Column(String(100), nullable=True) # e.g. Tower A, Block B
    flat_number = Column(String(100), nullable=True) # e.g. Flat 404
    
    # Joining Security
    joining_password_hash = Column(String(255), nullable=True)
    password_joining_enabled = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    community = relationship("Community", back_populates="households")
    owner = relationship("User", foreign_keys=[owner_id])
    members = relationship("HouseholdMember", back_populates="household", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="household", cascade="all, delete-orphan")
    bills = relationship("Bill", back_populates="household", cascade="all, delete-orphan")
    settlements = relationship("Settlement", back_populates="household", cascade="all, delete-orphan")
    shopping_items = relationship("ShoppingItem", back_populates="household", cascade="all, delete-orphan")
    tasks = relationship("HouseholdTask", back_populates="household", cascade="all, delete-orphan")
    activity_logs = relationship("HouseholdActivityLog", back_populates="household", cascade="all, delete-orphan")

    @property
    def full_identity(self) -> str:
        parts = []
        if self.community_name:
            parts.append(self.community_name)
        if self.building:
            parts.append(self.building)
        if self.flat_number:
            parts.append(self.flat_number)
        if not parts:
            return self.name
        return " · ".join(parts)

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
    invitee_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    type = Column(String(50), default="invitation", nullable=False) # invitation, join_request
    invite_token = Column(String(64), unique=True, index=True, nullable=False)
    status = Column(String(50), default="pending", nullable=False) # pending, accepted, rejected, expired
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)

    household = relationship("Household")
    inviter = relationship("User", foreign_keys=[inviter_id])
    invitee = relationship("User", foreign_keys=[invitee_id])

class HouseholdActivityLog(Base):
    __tablename__ = "household_activity_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    household_id = Column(String(36), ForeignKey("households.id"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    action_type = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    household = relationship("Household", back_populates="activity_logs")
    user = relationship("User")
