import json
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.user import User
from app.models.household import Household, HouseholdMember, Community, HouseholdInvitation
from app.models.marketplace import MarketplaceListing, MarketplaceTransaction
from app.models.subscription import SubscriptionPlan, UserSubscription, PaymentTransaction, MarketplaceMembership
from app.models.admin import Report, AdminAuditLog, PlatformSetting
from app.models.bill import Bill
from app.models.task import HouseholdTask
from app.core.deps import require_admin
from app.schemas.auth import UserResponse
from app.schemas.admin import (
    AdminOverviewMetrics, UserStatusUpdateRequest, ReportResponse,
    ReportResolveRequest, AdminAuditLogResponse, PlatformSettingResponse, PlatformSettingUpdate,
    SubscriptionConfigUpdate
)
from app.schemas.household import CommunityResponse, CommunityCreate

router = APIRouter(prefix="/admin", tags=["Creator / Admin Panel"])

@router.get("/overview", response_model=AdminOverviewMetrics)
def get_admin_overview(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.status == "active").count()
    
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    new_registrations = db.query(User).filter(User.created_at >= thirty_days_ago).count()
    
    total_households = db.query(Household).count()
    total_comms = db.query(Community).count()
    total_members = db.query(HouseholdMember).count()

    # Household Free vs Premium breakdown
    # Owner with active Premium subscription = Premium Household
    now = datetime.utcnow()
    premium_owners = db.query(UserSubscription.user_id).filter(
        UserSubscription.plan_id == "premium",
        UserSubscription.status == "active",
        UserSubscription.current_period_end >= now
    ).subquery()

    premium_households = db.query(Household).filter(Household.owner_id.in_(premium_owners)).count()
    free_households = total_households - premium_households

    active_subs = db.query(UserSubscription).filter(
        UserSubscription.status == "active",
        UserSubscription.current_period_end >= now
    ).count()

    expired_subs = db.query(UserSubscription).filter(
        UserSubscription.current_period_end < now
    ).count()

    # Marketplace Membership stats
    active_mkt_mems = db.query(MarketplaceMembership).filter(
        MarketplaceMembership.status == "active",
        MarketplaceMembership.current_period_end >= now
    ).count()

    expired_mkt_mems = db.query(MarketplaceMembership).filter(
        MarketplaceMembership.current_period_end < now
    ).count()

    # Marketplace Listing stats
    total_listings = db.query(MarketplaceListing).count()
    active_listings = db.query(MarketplaceListing).filter(MarketplaceListing.status == "active").count()
    sold_listings = db.query(MarketplaceListing).filter(MarketplaceListing.status == "sold").count()
    deleted_listings = db.query(MarketplaceListing).filter(MarketplaceListing.status == "deleted").count()

    # Revenue separation
    sub_rev_sum = db.query(func.sum(PaymentTransaction.amount_paise)).filter(
        PaymentTransaction.plan_id.like("household_%"),
        PaymentTransaction.status == "verified"
    ).scalar() or 0

    mkt_mem_rev_sum = db.query(func.sum(PaymentTransaction.amount_paise)).filter(
        PaymentTransaction.plan_id == "marketplace_membership",
        PaymentTransaction.status == "verified"
    ).scalar() or 0

    pending_join_reqs = db.query(HouseholdInvitation).filter(
        HouseholdInvitation.status == "pending"
    ).count()

    failed_payments = db.query(PaymentTransaction).filter(
        PaymentTransaction.status == "failed"
    ).count()

    reported_listings = db.query(MarketplaceListing).filter(
        MarketplaceListing.status == "moderation_flagged"
    ).count()

    pending_reports = db.query(Report).filter(Report.status == "pending").count()

    return AdminOverviewMetrics(
        total_users=total_users,
        active_users=active_users,
        new_registrations_last_30d=new_registrations,
        total_households=total_households,
        total_communities=total_comms,
        total_household_members=total_members,
        free_households=free_households,
        premium_households=premium_households,
        active_household_subscriptions=active_subs,
        expired_household_subscriptions=expired_subs,
        active_marketplace_memberships=active_mkt_mems,
        expired_marketplace_memberships=expired_mkt_mems,
        total_listings=total_listings,
        active_listings=active_listings,
        sold_listings=sold_listings,
        deleted_listings=deleted_listings,
        total_verified_subscription_revenue_paise=sub_rev_sum,
        total_marketplace_membership_revenue_paise=mkt_mem_rev_sum,
        pending_join_requests=pending_join_reqs,
        failed_payments_count=failed_payments,
        reported_listings_count=reported_listings,
        pending_complaints_count=pending_reports
    )

# -------------------------------------------------------------
# SUBSCRIPTION & PRICING CONFIGURATION
# -------------------------------------------------------------

@router.get("/subscriptions/config")
def get_subscription_config(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    free_plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == "free").first()
    premium_plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == "premium").first()

    mkt_price_setting = db.query(PlatformSetting).filter(PlatformSetting.key == "marketplace_membership_price_inr").first()
    mkt_validity_setting = db.query(PlatformSetting).filter(PlatformSetting.key == "marketplace_membership_validity_months").first()

    return {
        "free_member_limit": free_plan.max_members if free_plan else 3,
        "premium_price_inr": premium_plan.price_inr_year if premium_plan else 99,
        "premium_validity_months": getattr(premium_plan, "validity_months", 6),
        "premium_member_capacity": getattr(premium_plan, "max_members", 9999),
        "marketplace_membership_price_inr": int(mkt_price_setting.value) if mkt_price_setting else 20,
        "marketplace_membership_validity_months": int(mkt_validity_setting.value) if mkt_validity_setting else 6
    }

@router.put("/subscriptions/config")
def update_subscription_config(
    req: SubscriptionConfigUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    free_plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == "free").first()
    if free_plan:
        free_plan.max_members = req.free_member_limit

    premium_plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == "premium").first()
    if premium_plan:
        premium_plan.price_inr_year = req.premium_price_inr
        premium_plan.validity_months = req.premium_validity_months
        premium_plan.max_members = req.premium_member_capacity

    # Save platform settings for marketplace membership
    def _set_setting(k, v, desc):
        s = db.query(PlatformSetting).filter(PlatformSetting.key == k).first()
        if s:
            s.value = str(v)
        else:
            db.add(PlatformSetting(key=k, value=str(v), description=desc))

    _set_setting("marketplace_membership_price_inr", req.marketplace_membership_price_inr, "Marketplace membership price in INR")
    _set_setting("marketplace_membership_validity_months", req.marketplace_membership_validity_months, "Marketplace membership validity in months")

    # Audit log
    db.add(AdminAuditLog(
        admin_id=admin.id,
        action="UPDATE_SUBSCRIPTION_PRICING_CONFIG",
        details=f"Admin updated pricing: Free limit={req.free_member_limit}, Premium=₹{req.premium_price_inr}, Mkt Membership=₹{req.marketplace_membership_price_inr}"
    ))

    db.commit()
    return {"message": "Subscription & Pricing Configuration updated successfully!"}

# -------------------------------------------------------------
# COMMUNITY MANAGEMENT
# -------------------------------------------------------------

@router.get("/communities", response_model=List[CommunityResponse])
def admin_list_communities(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return db.query(Community).order_by(Community.name.asc()).all()

@router.post("/communities", response_model=CommunityResponse)
def admin_create_community(
    comm_in: CommunityCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    cleaned = comm_in.name.strip()
    existing = db.query(Community).filter(Community.name.ilike(cleaned)).first()
    if existing:
        return existing

    new_comm = Community(name=cleaned, city=comm_in.city or "Chennai", description=comm_in.description)
    db.add(new_comm)
    db.add(AdminAuditLog(admin_id=admin.id, action="CREATE_COMMUNITY", details=f"Created community {cleaned}"))
    db.commit()
    db.refresh(new_comm)
    return new_comm

@router.delete("/communities/{comm_id}")
def admin_delete_community(
    comm_id: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    comm = db.query(Community).filter(Community.id == comm_id).first()
    if not comm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Community not found")
    
    # Check associated households
    h_count = db.query(Household).filter(Household.community_id == comm_id).count()
    if h_count > 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Cannot delete community with {h_count} active households.")

    db.delete(comm)
    db.add(AdminAuditLog(admin_id=admin.id, action="DELETE_COMMUNITY", details=f"Deleted community {comm.name}"))
    db.commit()
    return {"message": "Community removed successfully"}

# -------------------------------------------------------------
# SEPARATE FINANCIAL REPORTS & PAYMENTS
# -------------------------------------------------------------

@router.get("/financials/report")
def get_financial_reports(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    # 1. Household Subscriptions
    hh_txs = db.query(PaymentTransaction).filter(
        PaymentTransaction.plan_id.like("household_%")
    ).order_by(PaymentTransaction.created_at.desc()).all()

    hh_verified = sum(tx.amount_paise for tx in hh_txs if tx.status == "verified")

    # 2. Marketplace Memberships
    mkt_txs = db.query(PaymentTransaction).filter(
        PaymentTransaction.plan_id == "marketplace_membership"
    ).order_by(PaymentTransaction.created_at.desc()).all()

    mkt_verified = sum(tx.amount_paise for tx in mkt_txs if tx.status == "verified")

    mkt_memberships = db.query(MarketplaceMembership).order_by(MarketplaceMembership.created_at.desc()).all()

    return {
        "household_subscriptions": {
            "gross_revenue_paise": hh_verified,
            "total_transactions": len(hh_txs),
            "transactions": hh_txs
        },
        "marketplace_memberships": {
            "gross_revenue_paise": mkt_verified,
            "total_memberships": len(mkt_memberships),
            "memberships": mkt_memberships,
            "transactions": mkt_txs
        }
    }

# -------------------------------------------------------------
# USER MANAGEMENT & HOUSEHOLDS
# -------------------------------------------------------------

@router.get("/users", response_model=List[UserResponse])
def list_all_users(
    search: Optional[str] = None,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = db.query(User)
    if search:
        s = f"%{search}%"
        query = query.filter(or_(User.email.ilike(s), User.full_name.ilike(s)))
    return query.order_by(User.created_at.desc()).all()

@router.put("/users/{user_id}/status")
def update_user_status(
    user_id: str,
    req: UserStatusUpdateRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.status = req.status
    db.add(AdminAuditLog(admin_id=admin.id, action="UPDATE_USER_STATUS", target_type="user", target_id=user_id, details=f"Status set to {req.status}"))
    db.commit()
    return {"message": f"User status updated to {req.status}"}

@router.get("/households")
def list_all_households(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    houses = db.query(Household).order_by(Household.created_at.desc()).all()
    results = []
    for h in houses:
        m_count = db.query(HouseholdMember).filter(HouseholdMember.household_id == h.id).count()
        results.append({
            "id": h.id,
            "name": h.name,
            "full_identity": h.full_identity,
            "community_name": h.community_name,
            "building": h.building,
            "flat_number": h.flat_number,
            "city": h.city,
            "invite_code": h.invitation_code,
            "status": h.status,
            "owner": {"id": h.owner.id, "full_name": h.owner.full_name, "email": h.owner.email} if h.owner else None,
            "members_count": m_count,
            "created_at": h.created_at.isoformat()
        })
    return results

@router.get("/task-bill-analytics")
def get_task_bill_analytics(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    total_bills = db.query(Bill).count()
    custom_bills = db.query(Bill).filter(Bill.category == "other").all()
    custom_categories = list(set(b.custom_category for b in custom_bills if b.custom_category))

    total_tasks = db.query(HouseholdTask).count()
    completed_tasks = db.query(HouseholdTask).filter(HouseholdTask.status == "completed").count()
    pending_tasks = total_tasks - completed_tasks

    return {
        "total_bills": total_bills,
        "custom_bill_count": len(custom_bills),
        "custom_categories_used": custom_categories,
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "pending_tasks": pending_tasks
    }

@router.get("/marketplace/moderation")
def list_moderation_listings(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return db.query(MarketplaceListing).order_by(MarketplaceListing.created_at.desc()).limit(100).all()

@router.put("/marketplace/moderation/{listing_id}")
def moderate_listing(
    listing_id: str,
    action: str = Query(...), # approve, remove
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    listing = db.query(MarketplaceListing).filter(MarketplaceListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")
    
    if action == "approve":
        listing.status = "active"
    elif action == "remove":
        listing.status = "removed"
    
    db.add(AdminAuditLog(admin_id=admin.id, action=f"MODERATE_{action.upper()}", target_type="listing", target_id=listing_id, details=f"Listing {listing.title} moderated: {action}"))
    db.commit()
    return {"message": f"Listing {action}ed successfully"}

@router.get("/reports", response_model=List[ReportResponse])
def list_reports(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(Report).order_by(Report.created_at.desc()).all()

@router.put("/reports/{report_id}/resolve")
def resolve_report(
    report_id: str,
    req: ReportResolveRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    rep = db.query(Report).filter(Report.id == report_id).first()
    if not rep:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    rep.status = req.status
    rep.resolution_notes = req.resolution_notes
    rep.resolved_at = datetime.utcnow()
    db.commit()
    return {"message": f"Report marked as {req.status}"}

@router.get("/audit-logs", response_model=List[AdminAuditLogResponse])
def get_audit_logs(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(AdminAuditLog).order_by(AdminAuditLog.created_at.desc()).limit(100).all()

@router.get("/settings", response_model=List[PlatformSettingResponse])
def get_settings(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(PlatformSetting).all()
