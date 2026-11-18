import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Integer
from sqlalchemy.orm import relationship
from app.database import Base

class Settlement(Base):
    __tablename__ = "settlements"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    household_id = Column(String(36), ForeignKey("households.id"), nullable=False, index=True)
    payer_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    payee_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    amount_paise = Column(Integer, nullable=False)
    upi_reference = Column(String(100), nullable=True)
    proof_url = Column(Text, nullable=True)
    status = Column(String(50), default="pending", nullable=False) # pending, confirmed, rejected
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    confirmed_at = Column(DateTime, nullable=True)

    household = relationship("Household", back_populates="settlements")
    payer = relationship("User", foreign_keys=[payer_id])
    payee = relationship("User", foreign_keys=[payee_id])
