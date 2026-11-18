import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class AIConversation(Base):
    __tablename__ = "ai_conversations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    household_id = Column(String(36), ForeignKey("households.id"), nullable=False, index=True)
    user_input = Column(Text, nullable=False)
    input_type = Column(String(20), default="text", nullable=False) # text, voice
    intent_detected = Column(String(50), nullable=False) # add_expense, add_shopping_item, add_task, add_bill, general
    raw_response = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    actions = relationship("AIAction", back_populates="conversation", cascade="all, delete-orphan")

class AIAction(Base):
    __tablename__ = "ai_actions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String(36), ForeignKey("ai_conversations.id"), nullable=False, index=True)
    action_type = Column(String(50), nullable=False) # create_expense, create_shopping_item, create_task, create_bill
    payload_json = Column(Text, nullable=False) # JSON encoded action details
    status = Column(String(50), default="pending_confirmation", nullable=False) # pending_confirmation, executed, rejected
    executed_at = Column(DateTime, nullable=True)

    conversation = relationship("AIConversation", back_populates="actions")
