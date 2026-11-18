import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, asc
from app.database import get_db
from app.models.user import User
from app.models.marketplace import MarketplaceListing, ListingImage, ListingFavorite, MarketplaceTransaction
from app.models.chat import Conversation
from app.core.deps import get_current_user, get_optional_current_user
from app.core.payment_gateway import RazorpayService
from app.core.marketplace_fees import MarketplaceFeeService
from app.schemas.marketplace import (
    MarketplaceListingCreate, MarketplaceListingUpdate, MarketplaceListingResponse,
    MarketplaceListingStatusUpdate, MarketplaceFeeCalculationResponse,
    MarketplaceTransactionCreateRequest, MarketplaceTransactionResponse,
    MarketplaceTransactionVerifyRequest
)

router = APIRouter(prefix="/marketplace", tags=["Marketplace"])

def _populate_listing_response(l: MarketplaceListing, db: Session, user_fav_ids: set = None) -> MarketplaceListingResponse:
    # Compute enquiries count (conversations linked to this listing)
    enquiry_count = db.query(Conversation).filter(Conversation.listing_id == l.id).count()
    is_fav = (l.id in user_fav_ids) if user_fav_ids is not None else False
    
    res = MarketplaceListingResponse.model_validate(l)
    res.enquiries_count = enquiry_count
    res.is_favorite = is_fav
    return res

@router.post("/", response_model=MarketplaceListingResponse, status_code=status.HTTP_201_CREATED)
def create_listing(
    listing_in: MarketplaceListingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    listing = MarketplaceListing(
        seller_id=current_user.id,
        title=listing_in.title,
        category=listing_in.category,
        description=listing_in.description,
        selling_price_paise=listing_in.selling_price_paise,
        original_price_paise=listing_in.original_price_paise,
        condition=listing_in.condition,
        location=listing_in.location,
        city=listing_in.city,
        reason_for_selling=listing_in.reason_for_selling,
        is_moving_out_sale=listing_in.is_moving_out_sale,
        moving_out_collection_title=listing_in.moving_out_collection_title,
        contact_preference=listing_in.contact_preference,
        status=listing_in.status or "active"
    )
    db.add(listing)
    db.flush()

    # Add images (up to 8)
    for idx, img_url in enumerate(listing_in.images[:8]):
        img = ListingImage(
            listing_id=listing.id,
            image_url=img_url,
            sort_order=idx
        )
        db.add(img)

    db.commit()
    db.refresh(listing)
    return _populate_listing_response(listing, db)

@router.get("/", response_model=List[MarketplaceListingResponse])
def browse_listings(
    category: Optional[str] = None,
    condition: Optional[str] = None,
    min_price_paise: Optional[int] = None,
    max_price_paise: Optional[int] = None,
    city: Optional[str] = None,
    search: Optional[str] = None,
    is_moving_out_sale: Optional[bool] = None,
    sort_by: Optional[str] = "newest", # newest, price_asc, price_desc, views
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    # Only ACTIVE items appear in public search. Sold, deleted, paused, or draft are excluded.
    query = db.query(MarketplaceListing).filter(MarketplaceListing.status == "active")

    if category:
        query = query.filter(MarketplaceListing.category == category)
    if condition:
        query = query.filter(MarketplaceListing.condition == condition)
    if min_price_paise is not None:
        query = query.filter(MarketplaceListing.selling_price_paise >= min_price_paise)
    if max_price_paise is not None:
        query = query.filter(MarketplaceListing.selling_price_paise <= max_price_paise)
    if city:
        query = query.filter(MarketplaceListing.city.ilike(f"%{city}%"))
    if is_moving_out_sale is not None:
        query = query.filter(MarketplaceListing.is_moving_out_sale == is_moving_out_sale)
    if search:
        search_filter = or_(
            MarketplaceListing.title.ilike(f"%{search}%"),
            MarketplaceListing.description.ilike(f"%{search}%"),
            MarketplaceListing.location.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)

    # Sorting
    if sort_by == "price_asc":
        query = query.order_by(asc(MarketplaceListing.selling_price_paise))
    elif sort_by == "price_desc":
        query = query.order_by(desc(MarketplaceListing.selling_price_paise))
    elif sort_by == "views":
        query = query.order_by(desc(MarketplaceListing.views_count))
    else:
        query = query.order_by(desc(MarketplaceListing.created_at))

    listings = query.all()

    user_fav_ids = set()
    if current_user:
        favs = db.query(ListingFavorite.listing_id).filter(ListingFavorite.user_id == current_user.id).all()
        user_fav_ids = {f[0] for f in favs}

    return [_populate_listing_response(l, db, user_fav_ids) for l in listings]

@router.get("/my-listings", response_model=List[MarketplaceListingResponse])
def get_my_listings(
    status_filter: Optional[str] = None, # all, active, sold, draft, paused, deleted
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    FEATURE 1: My Listings Management
    Returns all listings created by the authenticated user with enquiries count and status.
    """
    query = db.query(MarketplaceListing).filter(
        MarketplaceListing.seller_id == current_user.id
    )

    if status_filter and status_filter != "all":
        query = query.filter(MarketplaceListing.status == status_filter)
    else:
        # By default exclude deleted unless requested
        query = query.filter(MarketplaceListing.status != "deleted")

    listings = query.order_by(MarketplaceListing.created_at.desc()).all()

    favs = db.query(ListingFavorite.listing_id).filter(ListingFavorite.user_id == current_user.id).all()
    user_fav_ids = {f[0] for f in favs}

    return [_populate_listing_response(l, db, user_fav_ids) for l in listings]

@router.get("/fee-preview", response_model=MarketplaceFeeCalculationResponse)
def get_marketplace_fee_preview(
    item_price_paise: int = Query(..., gt=0),
    db: Session = Depends(get_db)
):
    """
    FEATURE 4: Marketplace Transaction Fee Preview
    Calculates the configurable platform fee breakdown without charging the user.
    """
    config = MarketplaceFeeService.get_fee_config(db)
    return MarketplaceFeeService.calculate_fee(item_price_paise, config)

@router.get("/{listing_id}", response_model=MarketplaceListingResponse)
def get_listing_detail(
    listing_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    listing = db.query(MarketplaceListing).filter(MarketplaceListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")

    # Increment view count
    listing.views_count += 1
    db.commit()
    db.refresh(listing)

    user_fav_ids = set()
    if current_user:
        fav = db.query(ListingFavorite).filter(
            ListingFavorite.listing_id == listing_id,
            ListingFavorite.user_id == current_user.id
        ).first()
        if fav:
            user_fav_ids.add(listing.id)

    return _populate_listing_response(listing, db, user_fav_ids)

@router.put("/{listing_id}", response_model=MarketplaceListingResponse)
def update_listing(
    listing_id: str,
    listing_in: MarketplaceListingUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    listing = db.query(MarketplaceListing).filter(MarketplaceListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")
    if listing.seller_id != current_user.id and current_user.role not in ["platform_admin", "super_admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to edit another user's listing")

    if listing_in.title is not None:
        listing.title = listing_in.title
    if listing_in.category is not None:
        listing.category = listing_in.category
    if listing_in.description is not None:
        listing.description = listing_in.description
    if listing_in.selling_price_paise is not None:
        listing.selling_price_paise = listing_in.selling_price_paise
    if listing_in.original_price_paise is not None:
        listing.original_price_paise = listing_in.original_price_paise
    if listing_in.condition is not None:
        listing.condition = listing_in.condition
    if listing_in.location is not None:
        listing.location = listing_in.location
    if listing_in.city is not None:
        listing.city = listing_in.city
    if listing_in.reason_for_selling is not None:
        listing.reason_for_selling = listing_in.reason_for_selling
    if listing_in.is_moving_out_sale is not None:
        listing.is_moving_out_sale = listing_in.is_moving_out_sale
    if listing_in.moving_out_collection_title is not None:
        listing.moving_out_collection_title = listing_in.moving_out_collection_title
    if listing_in.status is not None:
        listing.status = listing_in.status
        if listing_in.status == "sold" and not listing.sold_at:
            listing.sold_at = datetime.utcnow()

    if listing_in.images is not None:
        db.query(ListingImage).filter(ListingImage.listing_id == listing.id).delete()
        for idx, img_url in enumerate(listing_in.images[:8]):
            img = ListingImage(listing_id=listing.id, image_url=img_url, sort_order=idx)
            db.add(img)

    db.commit()
    db.refresh(listing)
    return _populate_listing_response(listing, db)

@router.post("/{listing_id}/mark-sold", response_model=MarketplaceListingResponse)
def mark_listing_as_sold(
    listing_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    FEATURE 3: Mark as Sold
    Owner marks active listing as SOLD.
    Sets status="sold", records sold_at timestamp, removes from active searches.
    """
    listing = db.query(MarketplaceListing).filter(MarketplaceListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")
    if listing.seller_id != current_user.id and current_user.role not in ["platform_admin", "super_admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to modify another user's listing")

    listing.status = "sold"
    listing.sold_at = datetime.utcnow()
    db.commit()
    db.refresh(listing)
    return _populate_listing_response(listing, db)

@router.post("/{listing_id}/reactivate", response_model=MarketplaceListingResponse)
def reactivate_sold_listing(
    listing_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    FEATURE 3: Reactivate Sold Listing
    Allows sellers to reactivate an item when appropriate.
    """
    listing = db.query(MarketplaceListing).filter(MarketplaceListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")
    if listing.seller_id != current_user.id and current_user.role not in ["platform_admin", "super_admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to modify another user's listing")

    listing.status = "active"
    listing.sold_at = None
    db.commit()
    db.refresh(listing)
    return _populate_listing_response(listing, db)

@router.delete("/{listing_id}")
def delete_listing(
    listing_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    FEATURE 2: Delete Listing (Soft Delete)
    Verifies ownership. Updates status to 'deleted' and removes from marketplace discovery
    while preserving audit and financial records.
    """
    listing = db.query(MarketplaceListing).filter(MarketplaceListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")
    if listing.seller_id != current_user.id and current_user.role not in ["platform_admin", "super_admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to delete another user's listing")

    listing.status = "deleted"
    db.commit()
    return {"status": "success", "message": "Listing deleted successfully", "id": listing_id}

@router.post("/{listing_id}/favorite")
def toggle_favorite(
    listing_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    fav = db.query(ListingFavorite).filter(
        ListingFavorite.listing_id == listing_id,
        ListingFavorite.user_id == current_user.id
    ).first()
    if fav:
        db.delete(fav)
        db.commit()
        return {"is_favorite": False, "message": "Removed from favorites"}
    else:
        new_fav = ListingFavorite(listing_id=listing_id, user_id=current_user.id)
        db.add(new_fav)
        db.commit()
        return {"is_favorite": True, "message": "Saved to favorites"}

# ========================================================
# FEATURE 4: MARKETPLACE TRANSACTION WORKFLOW & FEES
# ========================================================

@router.post("/transactions/checkout", response_model=MarketplaceTransactionResponse)
def create_marketplace_transaction(
    req: MarketplaceTransactionCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Initiates transaction workflow for buying an item.
    - Prevents purchasing items that are already SOLD or DELETED.
    - Prevents simultaneous buyers from reserving the same item.
    - Calculates platform transaction fee according to platform settings.
    """
    listing = db.query(MarketplaceListing).filter(MarketplaceListing.id == req.listing_id).first()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")
    
    if listing.status == "sold":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This item has already been marked as SOLD and is no longer available for purchase."
        )

    if listing.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This item is currently {listing.status} and cannot be purchased."
        )

    if listing.seller_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot purchase your own listing."
        )

    # Check if there is already an active/completed transaction for this listing
    existing_completed = db.query(MarketplaceTransaction).filter(
        MarketplaceTransaction.listing_id == listing.id,
        MarketplaceTransaction.status.in_(["verified", "completed"])
    ).first()
    if existing_completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This item has already been reserved or purchased by another buyer."
        )

    # Calculate fee
    fee_config = MarketplaceFeeService.get_fee_config(db)
    fee_calc = MarketplaceFeeService.calculate_fee(listing.selling_price_paise, fee_config)

    # Total payable by buyer for order creation
    total_payable_paise = fee_calc.total_buyer_amount_paise

    order_data = RazorpayService.create_order(
        amount_paise=total_payable_paise,
        receipt=f"mkt_rcpt_{uuid.uuid4().hex[:10]}"
    )

    tx = MarketplaceTransaction(
        listing_id=listing.id,
        seller_id=listing.seller_id,
        buyer_id=current_user.id,
        item_price_paise=listing.selling_price_paise,
        total_fee_paise=fee_calc.total_fee_paise,
        seller_fee_paise=fee_calc.seller_fee_paise,
        buyer_fee_paise=fee_calc.buyer_fee_paise,
        fee_policy_applied=fee_calc.fee_policy,
        currency="INR",
        razorpay_order_id=order_data["order_id"],
        status="created",
        is_simulation=order_data["is_simulation"]
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)

    return tx

@router.post("/transactions/verify", response_model=MarketplaceTransactionResponse)
def verify_marketplace_transaction(
    req: MarketplaceTransactionVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Verifies Razorpay payment signature server-side.
    - Idempotent: duplicate callbacks do not duplicate fee collection or fail.
    - Completes the transaction and marks the item as SOLD atomically.
    """
    tx = db.query(MarketplaceTransaction).filter(
        MarketplaceTransaction.id == req.transaction_id
    ).first()
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    # Idempotency check
    if tx.status in ["verified", "completed"]:
        return tx

    # Verify signature
    is_valid = RazorpayService.verify_signature(
        order_id=req.razorpay_order_id,
        payment_id=req.razorpay_payment_id,
        signature=req.razorpay_signature
    )
    if not is_valid:
        tx.status = "failed"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cryptographic payment signature verification failed. Transaction was not activated."
        )

    tx.status = "completed"
    tx.razorpay_payment_id = req.razorpay_payment_id
    tx.razorpay_signature = req.razorpay_signature
    tx.completed_at = datetime.utcnow()

    # Automatically mark listing as SOLD
    listing = db.query(MarketplaceListing).filter(MarketplaceListing.id == tx.listing_id).first()
    if listing:
        listing.status = "sold"
        listing.sold_at = datetime.utcnow()

    db.commit()
    db.refresh(tx)
    return tx

@router.post("/transactions/simulate-payment")
def simulate_marketplace_payment(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Local test-mode payment simulation for marketplace purchases.
    """
    tx = db.query(MarketplaceTransaction).filter(
        MarketplaceTransaction.razorpay_order_id == order_id
    ).first()
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    sim_payment_id = f"pay_mkt_sim_{uuid.uuid4().hex[:12]}"
    sim_signature = f"sim_sig_mkt_{uuid.uuid4().hex[:20]}"

    return {
        "transaction_id": tx.id,
        "razorpay_order_id": order_id,
        "razorpay_payment_id": sim_payment_id,
        "razorpay_signature": sim_signature,
        "is_simulation": True,
        "message": "Local simulation credentials generated. Post to /transactions/verify to complete."
    }

@router.get("/transactions/my-transactions", response_model=List[MarketplaceTransactionResponse])
def get_user_marketplace_transactions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns user's transaction history as buyer or seller.
    """
    txs = db.query(MarketplaceTransaction).filter(
        or_(
            MarketplaceTransaction.buyer_id == current_user.id,
            MarketplaceTransaction.seller_id == current_user.id
        )
    ).order_by(MarketplaceTransaction.created_at.desc()).all()
    return txs
