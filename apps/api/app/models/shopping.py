import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Integer, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class ShoppingItem(Base):
    __tablename__ = "shopping_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    household_id = Column(String(36), ForeignKey("households.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    quantity = Column(String(100), default="1", nullable=False)
    estimated_price_paise = Column(Integer, nullable=True)
    actual_price_paise = Column(Integer, nullable=True)
    assigned_to_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    is_purchased = Column(Boolean, default=False, nullable=False)
    purchased_by_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    purchased_at = Column(DateTime, nullable=True)
    receipt_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    household = relationship("Household", back_populates="shopping_items")
    assigned_to = relationship("User", foreign_keys=[assigned_to_id])
    purchased_by = relationship("User", foreign_keys=[purchased_by_id])
