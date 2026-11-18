import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base, SessionLocal
import app.models # Ensure all models are imported
from app.models.user import User
from app.models.subscription import SubscriptionPlan
from app.models.admin import PlatformSetting
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
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Bootstrap data
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

        # 2. Bootstrap Subscription Plans
        plans_data = [
            {
                "id": "free",
                "name": "Free Community",
                "price_inr_year": 0,
                "description": "Essential household budgeting and marketplace access for students and flatmates.",
                "features_json": json.dumps([
                    "1 Active Household",
                    "Unlimited Shared Expenses & Equal Splits",
                    "Shared Shopping Lists & Chores",
                    "Buy & Sell Marketplace Access",
                    "Basic In-App Messaging",
                    "10 AI Assistant Requests / Month"
                ]),
                "ai_monthly_allowance": 10,
                "max_households": 1
            },
            {
                "id": "basic_plus",
                "name": "Basic Plus",
                "price_inr_year": 49,
                "description": "Advanced expense reports, custom splits, and recurring bill management.",
                "features_json": json.dumps([
                    "Up to 3 Active Households",
                    "Custom & Percentage Expense Splits",
                    "Recurring Bill Management & Due Reminders",
                    "Receipt Attachment & Settlement Verification",
                    "Exportable PDF/Excel Expense Reports",
                    "100 AI Assistant Requests / Month",
                    "Priority Marketplace Badge"
                ]),
                "ai_monthly_allowance": 100,
                "max_households": 3
            },
            {
                "id": "premium",
                "name": "Premium Lifestyle",
                "price_inr_year": 99,
                "description": "The ultimate household productivity suite with unlimited AI and moving out sale bundles.",
                "features_json": json.dumps([
                    "Unlimited Households",
                    "Full AI Voice & Text Household Automation",
                    "Moving Out & Graduation Sale Bundle Collections",
                    "Featured Marketplace Listings (3x Views)",
                    "Debt Simplification Algorithm",
                    "Advanced Multi-Year Analytics & Budget Tracking",
                    "Unlimited AI Assistant Requests"
                ]),
                "ai_monthly_allowance": 99999,
                "max_households": 999
            }
        ]

        for p in plans_data:
            existing_plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == p["id"]).first()
            if not existing_plan:
                new_plan = SubscriptionPlan(**p)
                db.add(new_plan)

        # 3. Bootstrap default platform settings
        default_settings = [
            ("platform_brand_name", "NestSync", "Consumer platform brand name"),
            ("currency_code", "INR", "Platform default currency"),
            ("currency_symbol", "₹", "Platform currency symbol"),
            ("moving_out_sales_enabled", "true", "Enable moving out collections"),
            ("ai_provider_mode", settings.AI_PROVIDER, "Active AI processing engine"),
            ("payment_gateway_mode", "test_simulation" if settings.RAZORPAY_KEY_ID.startswith("rzp_test_nestsync_mock") else "live", "Razorpay integration mode"),
            ("marketplace_fee_enabled", "true", "Enable transaction fee on marketplace sales"),
            ("marketplace_fee_amount_paise", "2000", "Default marketplace platform fee in paise (2000 = ₹20.00)"),
            ("marketplace_fee_policy", "seller_fee", "Marketplace fee policy: seller_fee, buyer_fee, both_fee, combined_fee")
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
