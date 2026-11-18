import uuid
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, asc
from app.database import get_db
from app.models.user import User
from app.models.household import Household, HouseholdMember
from app.models.subscription import UserSubscription, SubscriptionPlan
from app.core.deps import get_current_user

def get_household_capacity(household: Household, db: Session) -> dict:
    """
    Computes household membership capacity based on the owner's subscription.
    Free Household: Max 3 users total (including owner).
    Premium Household: ₹99 for 6 months -> Unlimited (up to 9999).
    When Premium expires, existing members are NOT removed, but new members cannot be added
    if count >= free limit.
    """
    owner_id = household.owner_id
    current_members_count = db.query(HouseholdMember).filter(HouseholdMember.household_id == household.id).count()

    # Check if owner has an active Premium subscription
    now = datetime.utcnow()
    active_premium = db.query(UserSubscription).filter(
        UserSubscription.user_id == owner_id,
        UserSubscription.plan_id == "premium",
        UserSubscription.status == "active",
        UserSubscription.current_period_end >= now
    ).first()

    # Read free limit from SubscriptionPlan
    free_plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == "free").first()
    free_limit = free_plan.max_members if free_plan and free_plan.max_members else 3

    if active_premium:
        max_allowed = 9999
        is_premium = True
        expires_at = active_premium.current_period_end
    else:
        max_allowed = free_limit
        is_premium = False
        expires_at = None

    can_add_member = current_members_count < max_allowed

    return {
        "current_members_count": current_members_count,
        "max_allowed": max_allowed,
        "is_premium": is_premium,
        "can_add_member": can_add_member,
        "free_limit": free_limit,
        "expires_at": expires_at.isoformat() if expires_at else None,
        "limit_reached_message": (
            f"Your household has reached its maximum of {free_limit} members. "
            "Upgrade to Premium for ₹99 and add unlimited members for six months."
        ) if not can_add_member else None
    }
