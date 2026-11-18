from datetime import datetime
from sqlalchemy.orm import Session
from app.models.subscription import MarketplaceMembership
from app.models.user import User

def check_marketplace_membership(user_id: str, db: Session) -> dict:
    """
    Checks if a user has an active 6-month Marketplace Membership (₹20).
    Returns dict with active status, expiry, and membership record.
    """
    now = datetime.utcnow()
    membership = db.query(MarketplaceMembership).filter(
        MarketplaceMembership.user_id == user_id,
        MarketplaceMembership.status == "active",
        MarketplaceMembership.current_period_end >= now
    ).order_by(MarketplaceMembership.current_period_end.desc()).first()

    if membership:
        return {
            "has_active_membership": True,
            "status": "active",
            "membership_id": membership.id,
            "expires_at": membership.current_period_end.isoformat(),
            "price_paise": membership.price_paise,
            "validity_months": 6
        }

    # Check if there is an expired or past membership
    past_membership = db.query(MarketplaceMembership).filter(
        MarketplaceMembership.user_id == user_id
    ).order_by(MarketplaceMembership.created_at.desc()).first()

    status_val = past_membership.status if past_membership else "none"
    if past_membership and past_membership.status == "active" and past_membership.current_period_end < now:
        status_val = "expired"

    return {
        "has_active_membership": False,
        "status": status_val,
        "membership_id": past_membership.id if past_membership else None,
        "expires_at": past_membership.current_period_end.isoformat() if past_membership else None,
        "price_paise": 2000,
        "validity_months": 6
    }
