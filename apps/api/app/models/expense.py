import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Integer, Float
from sqlalchemy.orm import relationship
from app.database import Base

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    household_id = Column(String(36), ForeignKey("households.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    total_amount_paise = Column(Integer, nullable=False) # In Paise (₹1 = 100 paise)
    category = Column(String(50), default="groceries", nullable=False) # groceries, rent, utilities, food_dining, household_items, entertainment, other
    paid_by_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    expense_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    receipt_url = Column(Text, nullable=True)
    split_method = Column(String(50), default="equal", nullable=False) # equal, custom, percentage
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    household = relationship("Household", back_populates="expenses")
    paid_by = relationship("User", back_populates="expenses_paid")
    participants = relationship("ExpenseParticipant", back_populates="expense", cascade="all, delete-orphan")

class ExpenseParticipant(Base):
    __tablename__ = "expense_participants"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    expense_id = Column(String(36), ForeignKey("expenses.id"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    share_amount_paise = Column(Integer, nullable=False)
    percentage = Column(Float, nullable=True)
    paid_status = Column(String(50), default="unpaid", nullable=False) # unpaid, settled

    expense = relationship("Expense", back_populates="participants")
    user = relationship("User")
