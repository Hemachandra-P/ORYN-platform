import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Integer, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class Bill(Base):
    __tablename__ = "bills"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    household_id = Column(String(36), ForeignKey("households.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False) # electricity, water, internet, rent, maintenance, gas, custom
    amount_paise = Column(Integer, nullable=False)
    due_date = Column(DateTime, nullable=False)
    paid_by_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    recurrence = Column(String(50), default="none", nullable=False) # none, monthly, quarterly, yearly
    is_paid = Column(Boolean, default=False, nullable=False)
    paid_at = Column(DateTime, nullable=True)
    receipt_url = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    household = relationship("Household", back_populates="bills")
    paid_by = relationship("User")
