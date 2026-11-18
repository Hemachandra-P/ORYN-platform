import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base, SessionLocal
import app.models
from app.models.user import User
from app.models.subscription import SubscriptionPlan
from app.models.admin import PlatformSetting
from app.models.household import Community
from app.core.security import get_password_hash

# Routers
from app.routers import (
    auth, households, expenses, bills, settlements,
    shopping, tasks, marketplace, chat, notifications,
    subscriptions, admin, ai
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="Unified Living & Community Marketplace API. Complete production-structured backend.",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers under API_V1_STR
api_v1 = settings.API_V1_STR
app.include_router(auth.router, prefix=api_v1)
app.include_router(households.router, prefix=api_v1)
app.include_router(expenses.router, prefix=api_v1)
app.include_router(bills.router, prefix=api_v1)
app.include_router(settlements.router, prefix=api_v1)
app.include_router(shopping.router, prefix=api_v1)
app.include_router(tasks.router, prefix=api_v1)
app.include_router(marketplace.router, prefix=api_v1)
app.include_router(chat.router, prefix=api_v1)
app.include_router(notifications.router, prefix=api_v1)
app.include_router(subscriptions.router, prefix=api_v1)
app.include_router(admin.router, prefix=api_v1)
app.include_router(ai.router, prefix=api_v1)

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # 1. Bootstrap Super Admin if not present
        super_admin = db.query(User).filter(User.email == settings.FIRST_SUPERUSER_EMAIL.lower()).first()
        if not super_admin:
            super_admin = User(
                email=settings.FIRST_SUPERUSER_EMAIL.lower(),
                hashed_password=get_password_hash(settings.FIRST_SUPERUSER_PASSWORD),
                full_name=settings.FIRST_SUPERUSER_NAME,
                role="super_admin",
                status="active",
                subscription_tier="premium"
            )
            db.add(super_admin)

        # 2. Bootstrap Subscription Plans per Feature 2:
        # Free Household Plan: ₹0, max 3 members
        # Premium Household Plan: ₹99 for 6 months, unlimited members
        plans_data = [
            {
                "id": "free",
                "name": "Free Household Plan",
                "price_inr_year": 0,
                "validity_months": 6,
                "description": "Essential household budgeting, bills, and task management for up to 3 flatmates.",
                "features_json": json.dumps([
                    "Up to 3 Household Members Total (including Owner)",
                    "Shared Expenses & Equal Splits",
                    "Recurring Bills & Reminders",
                    "Shared Shopping Lists & Chores",
                    "Task Assignment to Flatmates",
                    "Free Marketplace Browsing"
                ]),
                "max_members": 3,
                "max_households": 1
            },
            {
                "id": "premium",
                "name": "Premium Household Plan",
                "price_inr_year": 99,
                "validity_months": 6,
                "description": "Unlock unlimited flatmates for six months. Flatmates join without paying.",
                "features_json": json.dumps([
                    "Unlimited Household Members for 6 Months",
                    "Only Owner Pays ₹99 — Flatmates Join for Free",
                    "Advanced Custom Splits & Expense Tracking",
                    "Unlimited Custom Bill Categories",
                    "Full Task Assignment & Delegation Ledger",
                    "Priority Community Badge"
                ]),
                "max_members": 9999,
                "max_households": 999
            }
        ]

        for p in plans_data:
            existing_plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == p["id"]).first()
            if not existing_plan:
                new_plan = SubscriptionPlan(**p)
                db.add(new_plan)
            else:
                existing_plan.name = p["name"]
                existing_plan.price_inr_year = p["price_inr_year"]
                existing_plan.validity_months = p["validity_months"]
                existing_plan.max_members = p["max_members"]

        # 3. Bootstrap Predefined Communities
        default_comms = [
            ("Estancia", "Chennai", "Prime residential township near SRM University"),
            ("Abode Valley", "Chennai", "Modern gated apartment complex in Potheri"),
            ("Mini Matrix", "Chennai", "Convenient student and professional flats in Kattankulathur")
        ]
        for name, city, desc in default_comms:
            existing_comm = db.query(Community).filter(Community.name.ilike(name)).first()
            if not existing_comm:
                db.add(Community(name=name, city=city, description=desc))

        # 4. Bootstrap default platform settings
        default_settings = [
            ("platform_brand_name", "NestSync", "Consumer platform brand name"),
            ("currency_code", "INR", "Platform default currency"),
            ("currency_symbol", "₹", "Platform currency symbol"),
            ("marketplace_membership_price_inr", "20", "Marketplace 6-month membership price in ₹ INR"),
            ("marketplace_membership_validity_months", "6", "Marketplace membership validity in months"),
            ("free_household_member_limit", "3", "Maximum total members for Free household plan"),
            ("premium_household_price_inr", "99", "Premium household subscription price in ₹ INR"),
            ("premium_household_validity_months", "6", "Premium household subscription validity in months")
        ]
        for key, val, desc in default_settings:
            existing_setting = db.query(PlatformSetting).filter(PlatformSetting.key == key).first()
            if not existing_setting:
                db.add(PlatformSetting(key=key, value=val, description=desc))

        db.commit()
    finally:
        db.close()

@app.get("/")
def root():
    return {
        "platform": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "docs": "/docs",
        "health": "/health",
        "status": "operational"
    }

@app.get("/health")
def healthcheck():
    return {
        "status": "healthy",
        "version": settings.PROJECT_VERSION,
        "brand": settings.PROJECT_NAME
    }
