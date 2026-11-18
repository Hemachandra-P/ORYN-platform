from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.schemas.auth import UserResponse

class AdminOverviewMetrics(BaseModel):
    total_users: int
    active_users: int
    new_registrations_last_30d: int
    total_households: int
    total_listings: int
    active_listings: int
    sold_listings: int
    total_subscriptions: int
    active_premium_subscribers: int
    verified_subscription_revenue_paise: int
    failed_payments_count: int
    reported_listings_count: int
    pending_complaints_count: int

class UserStatusUpdateRequest(BaseModel):
    status: str # active, suspended, banned
    role: Optional[str] = None # user, household_owner, household_admin, platform_admin, super_admin

class ReportCreate(BaseModel):
    target_type: str # listing, user, household, message
    target_id: str
    reason: str
    details: Optional[str] = None

class ReportResponse(BaseModel):
    id: str
    reporter_id: str
    reporter: Optional[UserResponse] = None
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
    resolution_notes: str

class AdminAuditLogResponse(BaseModel):
    id: str
    admin_id: str
    admin: Optional[UserResponse] = None
    action: str
    target_type: str
    target_id: str
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class PlatformSettingUpdate(BaseModel):
    value: str
    description: Optional[str] = None

class PlatformSettingResponse(BaseModel):
    key: str
    value: str
    description: Optional[str] = None
    updated_at: datetime

    class Config:
        from_attributes = True
