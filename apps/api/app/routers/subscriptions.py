import json
import uuid
from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.subscription import SubscriptionPlan, UserSubscription, PaymentTransaction, PaymentWebhookEvent
from app.core.deps import get_current_user
from app.core.payment_gateway import RazorpayService
from app.schemas.subscription import (
    SubscriptionPlanResponse, OrderCreateRequest, OrderCreateResponse,
    PaymentVerifyRequest, SubscriptionResponse, TransactionResponse
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
            description=p.description,
            features=features,
            ai_monthly_allowance=p.ai_monthly_allowance,
            max_households=p.max_households,
            is_active=p.is_active
        ))
    return results

@router.get("/my-subscription")
def get_my_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    active_sub = db.query(UserSubscription).filter(
        UserSubscription.user_id == current_user.id,
        UserSubscription.status == "active"
    ).first()

    plan = None
    if active_sub:
        plan_db = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == active_sub.plan_id).first()
        if plan_db:
            plan = {
                "id": plan_db.id,
                "name": plan_db.name,
                "price_inr_year": plan_db.price_inr_year,
                "features": json.loads(plan_db.features_json) if plan_db.features_json else []
            }

    return {
        "subscription_tier": current_user.subscription_tier,
        "subscription": active_sub,
        "plan": plan
    }

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
        # Free plan activates immediately
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

    amount_paise = plan.price_inr_year * 100
    order_data = RazorpayService.create_order(amount_paise=amount_paise)

    # Record pending transaction
    tx = PaymentTransaction(
        user_id=current_user.id,
        plan_id=plan.id,
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
    """
    Verifies payment signature server-side and activates annual subscription.
    Never trusts client unverified claims.
    """
    # Verify cryptographic signature
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

    # Idempotent check: if already verified, return success without duplicate subscription
    if tx.status == "verified":
        return {"status": "success", "message": "Subscription already active"}

    # Update transaction
    tx.status = "verified"
    tx.razorpay_payment_id = req.razorpay_payment_id
    tx.razorpay_signature = req.razorpay_signature
    tx.verified_at = datetime.utcnow()

    # Activate annual subscription
    start_date = datetime.utcnow()
    end_date = start_date + timedelta(days=365)

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

    # Elevate user subscription tier
    current_user.subscription_tier = req.plan_id
    db.commit()

    return {
        "status": "success",
        "message": f"Successfully activated {req.plan_id.upper()} subscription for 1 year!",
        "subscription_tier": current_user.subscription_tier,
        "valid_until": end_date.isoformat()
    }

@router.post("/simulate-test-payment")
def simulate_test_payment(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Local development test payment simulator.
    Clearly marks transaction as simulated.
    """
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
        "message": "Local simulation credentials generated. Post to /verify to complete activation."
    }

@router.post("/webhook")
async def razorpay_webhook(request: Request, db: Session = Depends(get_db)):
    body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")

    if not RazorpayService.verify_webhook_signature(body, signature):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid webhook signature")

    payload = json.loads(body.decode("utf-8"))
    event_id = payload.get("id", str(uuid.uuid4()))

    # Idempotency check: duplicate webhooks cannot create duplicate records
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
