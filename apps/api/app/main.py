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

        # 2. Bootstrap Subscription Plans per Final Approved Structure:
        # Free: ₹0 forever, 1 individual user
        # Basic Plus: ₹49/year, up to 3 total household members
        # Premium Household: ₹99/6 months, unlimited household members
        plans_data = [
            {
                "id": "free",
                "name": "Free Plan",
                "price_inr_year": 0,
                "validity_months": 0,
                "description": "Individual account for browsing the community marketplace and public listings.",
                "features_json": json.dumps([
                    "Individual account for 1 user",
                    "Browse campus marketplace for free",
                    "View publicly available product listings & details",
                    "Upgrade to Basic Plus to create or join a household"
                ]),
                "max_members": 1,
                "max_households": 0
            },
            {
                "id": "basic_plus",
                "name": "Basic Plus",
                "price_inr_year": 49,
                "validity_months": 12,
                "description": "Essential shared living for small flats and rooms up to 3 members.",
                "features_json": json.dumps([
                    "Create 1 household with up to 3 total members",
                    "Shared household expense tracking down to paise",
                    "Equal, custom and percentage expense splitting",
                    "Recurring and custom bill management",
                    "Shared shopping lists",
                    "Household task assignment & flatmate delegation",
                    "Household activity history",
                    "Monthly household spending reports"
                ]),
                "max_members": 3,
                "max_households": 1
            },
            {
                "id": "premium",
                "name": "Premium Household",
                "price_inr_year": 99,
                "validity_months": 6,
                "description": "Unlimited members for large flats and shared student apartments for 6 months.",
                "features_json": json.dumps([
                    "Unlimited household members",
                    "All Basic Plus features included",
                    "Only household owner pays ₹99 — flatmates join free",
                    "Advanced household expense management",
                    "Unlimited custom bill categories",
                    "Complete household financial history",
                    "Advanced household analytics",
                    "Full task assignment and flatmate delegation",
                    "Existing members preserved on expiration"
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
                existing_plan.description = p["description"]
                existing_plan.features_json = p["features_json"]
                existing_plan.max_members = p["max_members"]
                existing_plan.max_households = p["max_households"]
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
            ("platform_brand_name", "ORYN", "Consumer platform brand name"),
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
            elif key == "platform_brand_name" and existing_setting.value == "NestSync":
                existing_setting.value = "ORYN"

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
