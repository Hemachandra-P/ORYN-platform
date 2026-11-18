import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Integer, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id = Column(String(50), primary_key=True) # free, basic_plus, premium
    name = Column(String(100), nullable=False)
    price_inr_year = Column(Integer, nullable=False) # ₹0, ₹49, ₹99
    description = Column(Text, nullable=False)
    features_json = Column(Text, nullable=False) # JSON list of feature strings
    ai_monthly_allowance = Column(Integer, default=10, nullable=False)
    max_households = Column(Integer, default=1, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

class UserSubscription(Base):
    __tablename__ = "user_subscriptions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    plan_id = Column(String(50), ForeignKey("subscription_plans.id"), nullable=False)
    status = Column(String(50), default="active", nullable=False) # active, expired, canceled
    current_period_start = Column(DateTime, default=datetime.utcnow, nullable=False)
    current_period_end = Column(DateTime, nullable=False)
    razorpay_order_id = Column(String(100), nullable=True)
    razorpay_payment_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User")
    plan = relationship("SubscriptionPlan")

class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    plan_id = Column(String(50), nullable=False)
    amount_paise = Column(Integer, nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    razorpay_order_id = Column(String(100), unique=True, index=True, nullable=False)
    razorpay_payment_id = Column(String(100), unique=True, index=True, nullable=True)
    razorpay_signature = Column(String(255), nullable=True)
    status = Column(String(50), default="created", nullable=False) # created, verified, failed, refunded
    error_reason = Column(Text, nullable=True)
    is_simulation = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    verified_at = Column(DateTime, nullable=True)

    user = relationship("User")

class PaymentWebhookEvent(Base):
    __tablename__ = "payment_webhook_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id = Column(String(100), unique=True, index=True, nullable=False)
    event_type = Column(String(100), nullable=False)
    payload = Column(Text, nullable=False)
    processed = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
