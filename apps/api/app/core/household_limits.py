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
    Free Plan: ₹0 forever (1 user individual account).
    Basic Plus: ₹49/year (up to 3 total members including owner).
    Premium Household: ₹99 for 6 months (unlimited members up to 9999).
    When Premium expires, existing members are NOT removed, but new members cannot be added
    if count >= 3.
    """
    owner_id = household.owner_id
    current_members_count = db.query(HouseholdMember).filter(HouseholdMember.household_id == household.id).count()

    now = datetime.utcnow()
    # Check if owner has active Premium
    active_premium = db.query(UserSubscription).filter(
        UserSubscription.user_id == owner_id,
        UserSubscription.plan_id == "premium",
        UserSubscription.status == "active",
        UserSubscription.current_period_end >= now
    ).first()

    # Check if owner has active Basic Plus
    active_basic = db.query(UserSubscription).filter(
        UserSubscription.user_id == owner_id,
        UserSubscription.plan_id == "basic_plus",
        UserSubscription.status == "active",
        UserSubscription.current_period_end >= now
    ).first()

    # Read limits
    basic_plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == "basic_plus").first()
    basic_limit = basic_plan.max_members if basic_plan and basic_plan.max_members else 3

    if active_premium:
        max_allowed = 9999
        plan_id = "premium"
        plan_name = "Premium Household"
        is_premium = True
        expires_at = active_premium.current_period_end
    elif active_basic:
        max_allowed = basic_limit
        plan_id = "basic_plus"
        plan_name = "Basic Plus"
        is_premium = False
        expires_at = active_basic.current_period_end
    else:
        # Grandfathered or standard household base limit is 3
        max_allowed = basic_limit
        plan_id = "free"
        plan_name = "Free Plan"
        is_premium = False
        expires_at = None

    can_add_member = current_members_count < max_allowed

    return {
        "current_members_count": current_members_count,
        "max_allowed": max_allowed,
        "plan_id": plan_id,
        "plan_name": plan_name,
        "is_premium": is_premium,
        "can_add_member": can_add_member,
        "free_limit": basic_limit,
        "expires_at": expires_at.isoformat() if expires_at else None,
        "limit_reached_message": (
            f"Your household has reached its maximum of {max_allowed} members. "
            "Upgrade to Premium for ₹99 and add unlimited members for six months."
        ) if not can_add_member else None
    }
