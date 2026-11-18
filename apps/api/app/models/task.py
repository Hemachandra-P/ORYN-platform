import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class HouseholdTask(Base):
    __tablename__ = "household_tasks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    household_id = Column(String(36), ForeignKey("households.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    assigned_to_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    due_date = Column(DateTime, nullable=True)
    recurrence = Column(String(50), default="none", nullable=False) # none, daily, weekly, monthly
    status = Column(String(50), default="todo", nullable=False) # todo, in_progress, completed
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    household = relationship("Household", back_populates="tasks")
    assigned_to = relationship("User")
