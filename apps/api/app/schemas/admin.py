from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AdminOverviewMetrics(BaseModel):
    total_users: int
    active_users: int
    new_registrations_last_30d: int
    
    # Household Metrics
    total_households: int
    total_communities: int = 0
    total_household_members: int = 0
    free_households: int = 0
    premium_households: int = 0
    active_household_subscriptions: int = 0
    expired_household_subscriptions: int = 0
    
    # Marketplace Membership Metrics
    active_marketplace_memberships: int = 0
    expired_marketplace_memberships: int = 0
    
    # Listing Metrics
    total_listings: int
    active_listings: int
    sold_listings: int
    deleted_listings: int
    
    # Revenue Separation (Paise)
    total_verified_subscription_revenue_paise: int
    total_marketplace_membership_revenue_paise: int
    
    # Operational Status
    pending_join_requests: int = 0
    failed_payments_count: int
    reported_listings_count: int
    pending_complaints_count: int

class UserStatusUpdateRequest(BaseModel):
    status: str # active, suspended, banned

class ReportResponse(BaseModel):
    id: str
    reporter_id: str
    target_type: str
    target_id: str
    reason: str
    details: Optional[str] = None
    status: str
    resolution_notes: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ReportResolveRequest(BaseModel):
    status: str # resolved, dismissed
    resolution_notes: Optional[str] = None

class AdminAuditLogResponse(BaseModel):
    id: str
    admin_id: str
    action: str
    target_type: Optional[str] = None
    target_id: Optional[str] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class PlatformSettingResponse(BaseModel):
    key: str
    value: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

class PlatformSettingUpdate(BaseModel):
    value: str

class SubscriptionConfigUpdate(BaseModel):
    free_member_limit: int = 1
    basic_plus_price_inr: int = 49
    basic_plus_validity_months: int = 12
    basic_plus_member_limit: int = 3
    premium_price_inr: int = 99
    premium_validity_months: int = 6
    premium_member_capacity: int = 9999
    marketplace_membership_price_inr: int = 20
    marketplace_membership_validity_months: int = 6
