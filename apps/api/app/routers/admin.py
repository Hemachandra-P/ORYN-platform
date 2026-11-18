import json
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.user import User
from app.models.household import Household, HouseholdMember
from app.models.marketplace import MarketplaceListing
from app.models.subscription import SubscriptionPlan, UserSubscription, PaymentTransaction
from app.models.admin import Report, AdminAuditLog, PlatformSetting
from app.core.deps import require_admin
from app.schemas.auth import UserResponse
from app.schemas.admin import (
    AdminOverviewMetrics, UserStatusUpdateRequest, ReportResponse,
    ReportResolveRequest, AdminAuditLogResponse, PlatformSettingResponse, PlatformSettingUpdate
)
from app.schemas.marketplace import MarketplaceListingResponse

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
    total_listings = db.query(MarketplaceListing).count()
    active_listings = db.query(MarketplaceListing).filter(MarketplaceListing.status == "active").count()
    sold_listings = db.query(MarketplaceListing).filter(MarketplaceListing.status == "sold").count()
    
    total_subscriptions = db.query(UserSubscription).count()
    active_premium_subscribers = db.query(UserSubscription).filter(
        UserSubscription.status == "active",
        UserSubscription.plan_id.in_(["basic_plus", "premium"])
    ).count()

    # Sum verified subscription revenue (in paise)
    revenue_sum = db.query(func.sum(PaymentTransaction.amount_paise)).filter(
        PaymentTransaction.status == "verified"
    ).scalar() or 0

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
        total_listings=total_listings,
        active_listings=active_listings,
        sold_listings=sold_listings,
        total_subscriptions=total_subscriptions,
        active_premium_subscribers=active_premium_subscribers,
        verified_subscription_revenue_paise=revenue_sum,
        failed_payments_count=failed_payments,
        reported_listings_count=reported_listings,
        pending_complaints_count=pending_reports
    )

@router.get("/users", response_model=List[UserResponse])
def list_all_users(
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    role_filter: Optional[str] = None,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = db.query(User)
    if search:
        query = query.filter(User.email.ilike(f"%{search}%") | User.full_name.ilike(f"%{search}%"))
    if status_filter:
        query = query.filter(User.status == status_filter)
    if role_filter:
        query = query.filter(User.role == role_filter)
    
    return query.order_by(User.created_at.desc()).all()

@router.put("/users/{user_id}/status", response_model=UserResponse)
def update_user_status(
    user_id: str,
    req: UserStatusUpdateRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if target_user.role == "super_admin" and admin.role != "super_admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only a Super Admin can modify another Super Admin")

    prev_status = target_user.status
    target_user.status = req.status
    if req.role:
        target_user.role = req.role

    # Audit Log
    log = AdminAuditLog(
        admin_id=admin.id,
        action=f"user_{req.status}",
        target_type="user",
        target_id=target_user.id,
        details=f"Status changed from {prev_status} to {req.status}. Role: {target_user.role}"
    )
    db.add(log)
    db.commit()
    db.refresh(target_user)
    return target_user

@router.get("/households")
def list_all_households(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    households = db.query(Household).order_by(Household.created_at.desc()).all()
    results = []
    for h in households:
        count = db.query(HouseholdMember).filter(HouseholdMember.household_id == h.id).count()
        results.append({
            "id": h.id,
            "name": h.name,
            "city": h.city,
            "status": h.status,
            "invitation_code": h.invitation_code,
            "owner_id": h.owner_id,
            "members_count": count,
            "created_at": h.created_at
        })
    return results

@router.put("/households/{household_id}/status")
def update_household_status(
    household_id: str,
    new_status: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    household = db.query(Household).filter(Household.id == household_id).first()
    if not household:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Household not found")

    household.status = new_status
    log = AdminAuditLog(
        admin_id=admin.id,
        action=f"household_{new_status}",
        target_type="household",
        target_id=household.id,
        details=f"Household status changed to {new_status}"
    )
    db.add(log)
    db.commit()
    return {"status": "success", "household_id": household_id, "new_status": new_status}

@router.get("/marketplace/moderation", response_model=List[MarketplaceListingResponse])
def get_moderation_listings(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    listings = db.query(MarketplaceListing).order_by(MarketplaceListing.created_at.desc()).all()
    return listings

@router.put("/marketplace/moderation/{listing_id}")
def moderate_listing(
    listing_id: str,
    action: str, # "approve", "reject", "flag", "remove"
    reason: Optional[str] = None,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    listing = db.query(MarketplaceListing).filter(MarketplaceListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")

    if action == "approve":
        listing.status = "active"
    elif action == "reject" or action == "remove":
        listing.status = "removed"
    elif action == "flag":
        listing.status = "moderation_flagged"

    log = AdminAuditLog(
        admin_id=admin.id,
        action=f"listing_{action}",
        target_type="listing",
        target_id=listing.id,
        details=f"Action: {action}, Reason: {reason or 'Standard review'}"
    )
    db.add(log)
    db.commit()
    return {"message": f"Listing {action} action completed successfully"}

@router.get("/transactions")
def list_transactions(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    txs = db.query(PaymentTransaction).order_by(PaymentTransaction.created_at.desc()).all()
    return txs

@router.get("/reports", response_model=List[ReportResponse])
def list_reports(
    status_filter: Optional[str] = None,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Report)
    if status_filter:
        query = query.filter(Report.status == status_filter)
    return query.order_by(Report.created_at.desc()).all()

@router.put("/reports/{report_id}/resolve", response_model=ReportResponse)
def resolve_report(
    report_id: str,
    req: ReportResolveRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

    report.status = req.status
    report.resolution_notes = req.resolution_notes
    report.resolved_by_id = admin.id
    report.resolved_at = datetime.utcnow()

    log = AdminAuditLog(
        admin_id=admin.id,
        action=f"report_{req.status}",
        target_type="report",
        target_id=report.id,
        details=f"Report resolved with notes: {req.resolution_notes}"
    )
    db.add(log)
    db.commit()
    db.refresh(report)
    return report

@router.get("/audit-logs", response_model=List[AdminAuditLogResponse])
def list_audit_logs(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    logs = db.query(AdminAuditLog).order_by(AdminAuditLog.created_at.desc()).limit(100).all()
    return logs

@router.get("/settings", response_model=List[PlatformSettingResponse])
def get_platform_settings(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    settings = db.query(PlatformSetting).all()
    return settings

@router.put("/settings/{key}", response_model=PlatformSettingResponse)
def update_platform_setting(
    key: str,
    req: PlatformSettingUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    item = db.query(PlatformSetting).filter(PlatformSetting.key == key).first()
    if not item:
        item = PlatformSetting(key=key, value=req.value, description=req.description)
        db.add(item)
    else:
        item.value = req.value
        if req.description:
            item.description = req.description

    log = AdminAuditLog(
        admin_id=admin.id,
        action="setting_updated",
        target_type="platform_setting",
        target_id=key,
        details=f"Value updated for {key}"
    )
    db.add(log)
    db.commit()
    db.refresh(item)
    return item
