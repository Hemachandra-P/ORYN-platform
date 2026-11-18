import json
import uuid
from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.subscription import (
    SubscriptionPlan, UserSubscription, PaymentTransaction, PaymentWebhookEvent, MarketplaceMembership
)
from app.core.deps import get_current_user
from app.core.payment_gateway import RazorpayService
from app.core.marketplace_membership import check_marketplace_membership
from app.schemas.subscription import (
    SubscriptionPlanResponse, OrderCreateRequest, OrderCreateResponse,
    PaymentVerifyRequest, SubscriptionResponse, TransactionResponse,
    MarketplaceMembershipResponse, MarketplaceMembershipCheckoutResponse,
    MarketplaceMembershipVerifyRequest
)

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions & Revenue"])

@router.get("/plans", response_model=List[SubscriptionPlanResponse])
def get_subscription_plans(db: Session = Depends(get_db)):
    plans = db.query(SubscriptionPlan).filter(SubscriptionPlan.is_active == True).all()
    results = []
    for p in plans:
        features = json.loads(p.features_json) if p.features_json else []
        results.append(SubscriptionPlanResponse(
            id=p.id,
            name=p.name,
            price_inr_year=p.price_inr_year,
            validity_months=getattr(p, "validity_months", 6),
            description=p.description,
            features=features,
            max_members=getattr(p, "max_members", 3),
            max_households=p.max_households,
            is_active=p.is_active
        ))
    return results

@router.get("/my-subscription")
def get_my_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.utcnow()
    active_sub = db.query(UserSubscription).filter(
        UserSubscription.user_id == current_user.id,
        UserSubscription.status == "active",
        UserSubscription.current_period_end >= now
    ).order_by(UserSubscription.current_period_end.desc()).first()

    plan = None
    if active_sub:
        plan_db = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == active_sub.plan_id).first()
        if plan_db:
            plan = {
                "id": plan_db.id,
                "name": plan_db.name,
                "price_inr_year": plan_db.price_inr_year,
                "validity_months": plan_db.validity_months,
                "features": json.loads(plan_db.features_json) if plan_db.features_json else []
            }

    # Also include marketplace membership status
    mkt_status = check_marketplace_membership(current_user.id, db)

    return {
        "subscription_tier": current_user.subscription_tier if active_sub else "free",
        "subscription": active_sub,
        "plan": plan,
        "marketplace_membership": mkt_status
    }

# -------------------------------------------------------------
# HOUSEHOLD PREMIUM SUBSCRIPTION (₹99 FOR 6 MONTHS)
# -------------------------------------------------------------

@router.post("/checkout", response_model=OrderCreateResponse)
def create_subscription_order(
    req: OrderCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == req.plan_id).first()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription plan not found")

    if plan.price_inr_year == 0:
        current_user.subscription_tier = "free"
        db.commit()
        return OrderCreateResponse(
            order_id="free_plan_active",
            amount_paise=0,
            currency="INR",
            key_id="free",
            plan_id="free",
            is_simulation=False
        )

    amount_paise = plan.price_inr_year * 100 # ₹99 = 9900 paise
    order_data = RazorpayService.create_order(amount_paise=amount_paise)

    tx = PaymentTransaction(
        user_id=current_user.id,
        plan_id=f"household_{plan.id}",
        amount_paise=amount_paise,
        currency="INR",
        razorpay_order_id=order_data["order_id"],
        status="created",
        is_simulation=order_data["is_simulation"]
    )
    db.add(tx)
    db.commit()

    return OrderCreateResponse(
        order_id=order_data["order_id"],
        amount_paise=amount_paise,
        currency="INR",
        key_id=order_data["key_id"],
        plan_id=plan.id,
        is_simulation=order_data["is_simulation"]
    )

@router.post("/verify")
def verify_payment(
    req: PaymentVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    is_valid = RazorpayService.verify_signature(
        order_id=req.razorpay_order_id,
        payment_id=req.razorpay_payment_id,
        signature=req.razorpay_signature
    )
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cryptographic payment signature verification failed"
        )

    tx = db.query(PaymentTransaction).filter(
        PaymentTransaction.razorpay_order_id == req.razorpay_order_id
    ).first()

    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction record not found")

    # Idempotent check
    if tx.status == "verified":
        return {"status": "success", "message": "Subscription already active"}

    tx.status = "verified"
    tx.razorpay_payment_id = req.razorpay_payment_id
    tx.razorpay_signature = req.razorpay_signature
    tx.verified_at = datetime.utcnow()

    # Determine plan duration
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == req.plan_id).first()
    if plan and plan.validity_months == 12:
        validity_days = 365
        duration_label = "1 year"
    else:
        validity_days = 180
        duration_label = "6 months"

    start_date = datetime.utcnow()
    end_date = start_date + timedelta(days=validity_days)

    sub = UserSubscription(
        user_id=current_user.id,
        plan_id=req.plan_id,
        status="active",
        current_period_start=start_date,
        current_period_end=end_date,
        razorpay_order_id=req.razorpay_order_id,
        razorpay_payment_id=req.razorpay_payment_id
    )
    db.add(sub)

    current_user.subscription_tier = req.plan_id
    db.commit()

    return {
        "status": "success",
        "message": f"Successfully activated {plan.name if plan else req.plan_id.upper()} subscription for {duration_label}!",
        "subscription_tier": current_user.subscription_tier,
        "valid_until": end_date.isoformat()
    }

# -------------------------------------------------------------
# MARKETPLACE MEMBERSHIP (₹20 FOR 6 MONTHS)
# -------------------------------------------------------------

@router.get("/marketplace-membership")
def get_marketplace_membership_details(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    status_info = check_marketplace_membership(current_user.id, db)
    history = db.query(MarketplaceMembership).filter(
        MarketplaceMembership.user_id == current_user.id
    ).order_by(MarketplaceMembership.created_at.desc()).all()

    return {
        "membership": status_info,
        "price_inr": 20,
        "price_paise": 2000,
        "validity_months": 6,
        "history": history
    }

@router.post("/marketplace-membership/checkout", response_model=MarketplaceMembershipCheckoutResponse)
def checkout_marketplace_membership(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    amount_paise = 2000 # ₹20.00
    order_data = RazorpayService.create_order(amount_paise=amount_paise)

    tx = PaymentTransaction(
        user_id=current_user.id,
        plan_id="marketplace_membership",
        amount_paise=amount_paise,
        currency="INR",
        razorpay_order_id=order_data["order_id"],
        status="created",
        is_simulation=order_data["is_simulation"]
    )
    db.add(tx)
    db.commit()

    return MarketplaceMembershipCheckoutResponse(
        order_id=order_data["order_id"],
        amount_paise=amount_paise,
        currency="INR",
        key_id=order_data["key_id"],
        is_simulation=order_data["is_simulation"]
    )

@router.post("/marketplace-membership/verify")
def verify_marketplace_membership(
    req: MarketplaceMembershipVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    is_valid = RazorpayService.verify_signature(
        order_id=req.razorpay_order_id,
        payment_id=req.razorpay_payment_id,
        signature=req.razorpay_signature
    )
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cryptographic payment signature verification failed"
        )

    tx = db.query(PaymentTransaction).filter(
        PaymentTransaction.razorpay_order_id == req.razorpay_order_id
    ).first()

    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment transaction record not found")

    # Idempotency check: if already verified or active, return without duplicate charges
    if tx.status == "verified":
        existing_mem = db.query(MarketplaceMembership).filter(
            MarketplaceMembership.razorpay_order_id == req.razorpay_order_id
        ).first()
        if existing_mem:
            return {
                "status": "success",
                "message": "Marketplace membership is already active!",
                "membership": existing_mem
            }

    tx.status = "verified"
    tx.razorpay_payment_id = req.razorpay_payment_id
    tx.razorpay_signature = req.razorpay_signature
    tx.verified_at = datetime.utcnow()

    # Activate 6-month Marketplace Membership
    start_date = datetime.utcnow()
    end_date = start_date + timedelta(days=180)

    mem = MarketplaceMembership(
        user_id=current_user.id,
        plan_name="Marketplace 6-Month Membership",
        price_paise=2000,
        status="active",
        current_period_start=start_date,
        current_period_end=end_date,
        razorpay_order_id=req.razorpay_order_id,
        razorpay_payment_id=req.razorpay_payment_id,
        razorpay_signature=req.razorpay_signature,
        is_simulation=tx.is_simulation
    )
    db.add(mem)
    db.commit()

    return {
        "status": "success",
        "message": "Marketplace membership successfully activated for six months! You can now buy and publish unlimited listings.",
        "membership_id": mem.id,
        "valid_until": end_date.isoformat()
    }

@router.post("/simulate-test-payment")
def simulate_test_payment(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tx = db.query(PaymentTransaction).filter(
        PaymentTransaction.razorpay_order_id == order_id,
        PaymentTransaction.user_id == current_user.id
    ).first()
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    sim_payment_id = f"pay_sim_{uuid.uuid4().hex[:12]}"
    sim_signature = f"sim_sig_{uuid.uuid4().hex[:20]}"

    return {
        "razorpay_order_id": order_id,
        "razorpay_payment_id": sim_payment_id,
        "razorpay_signature": sim_signature,
        "is_simulation": True,
        "message": "Local simulation credentials generated. Post to verify endpoint to complete activation."
    }

@router.post("/webhook")
async def razorpay_webhook(request: Request, db: Session = Depends(get_db)):
    body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")

    if not RazorpayService.verify_webhook_signature(body, signature):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid webhook signature")

    payload = json.loads(body.decode("utf-8"))
    event_id = payload.get("id", str(uuid.uuid4()))

    existing_event = db.query(PaymentWebhookEvent).filter(PaymentWebhookEvent.event_id == event_id).first()
    if existing_event:
        return {"status": "ignored", "reason": "duplicate_event"}

    webhook_record = PaymentWebhookEvent(
        event_id=event_id,
        event_type=payload.get("event", "unknown"),
        payload=json.dumps(payload),
        processed=True
    )
    db.add(webhook_record)
    db.commit()

    return {"status": "success", "event_id": event_id}
