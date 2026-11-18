import os
import uuid
import shutil
from pathlib import Path
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, asc
from app.database import get_db
from app.models.user import User
from app.models.marketplace import MarketplaceListing, ListingImage, ListingFavorite, MarketplaceTransaction
from app.models.chat import Conversation
from app.core.deps import get_current_user, get_optional_current_user
from app.core.payment_gateway import RazorpayService
from app.core.marketplace_membership import check_marketplace_membership
from app.schemas.marketplace import (
    MarketplaceListingCreate, MarketplaceListingUpdate, MarketplaceListingResponse,
    MarketplaceListingStatusUpdate
)

router = APIRouter(prefix="/marketplace", tags=["Marketplace"])

# Local uploads directory for local development & fallback storage
UPLOAD_DIR = Path("D:/SRM_website/apps/api/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

def _populate_listing_response(l: MarketplaceListing, db: Session, user_fav_ids: set = None) -> MarketplaceListingResponse:
    enquiry_count = db.query(Conversation).filter(Conversation.listing_id == l.id).count()
    is_fav = (l.id in user_fav_ids) if user_fav_ids is not None else False
    
    res = MarketplaceListingResponse.model_validate(l)
    res.enquiries_count = enquiry_count
    res.is_favorite = is_fav
    return res

# -----------------------------------------------------------------
# IMAGE UPLOAD (Supports up to 8 images, JPG/PNG/WebP, preview ready)
# -----------------------------------------------------------------

@router.post("/upload-images", response_model=List[str])
async def upload_listing_images(
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Direct image upload endpoint replacing manual URL inputs.
    Supports JPG, JPEG, PNG, WebP up to 8 images with validation.
    """
    if len(files) > 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 8 images allowed per listing."
        )

    allowed_exts = {".jpg", ".jpeg", ".png", ".webp"}
    uploaded_urls = []

    for f in files:
        ext = os.path.splitext(f.filename)[1].lower()
        if ext not in allowed_exts:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format '{ext}'. Allowed: JPG, JPEG, PNG, WebP."
            )

        filename = f"{uuid.uuid4().hex}{ext}"
        target_path = UPLOAD_DIR / filename

        with open(target_path, "wb") as buffer:
            shutil.copyfileobj(f.file, buffer)

        # Serve statically via API host (and can mirror to Supabase Storage if configured)
        url = f"/api/v1/marketplace/uploads/{filename}"
        uploaded_urls.append(url)

    return uploaded_urls

from fastapi.responses import FileResponse

@router.get("/uploads/{filename}")
def get_uploaded_image(filename: str):
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
    return FileResponse(file_path)

# -----------------------------------------------------------------
# LISTINGS (BROWSING IS FREE, SELLING REQUIRES MEMBERSHIP)
# -----------------------------------------------------------------

@router.post("/", response_model=MarketplaceListingResponse, status_code=status.HTTP_201_CREATED)
def create_listing(
    listing_in: MarketplaceListingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Enforce active ₹20 6-Month Marketplace Membership requirement
    mkt_status = check_marketplace_membership(current_user.id, db)
    if not mkt_status["has_active_membership"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Active Marketplace Membership required to publish listings. Get 6 months of unlimited buying and selling for ₹20."
        )

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
    sort_by: Optional[str] = "newest",
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Every registered user and visitor can browse, search and view listings for free!
    """
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

    if sort_by == "price_asc":
        query = query.order_by(asc(MarketplaceListing.selling_price_paise))
    elif sort_by == "price_desc":
        query = query.order_by(desc(MarketplaceListing.selling_price_paise))
    elif sort_by == "views":
        query = query.order_by(desc(MarketplaceListing.views_count))
    else:
        query = query.order_by(desc(MarketplaceListing.created_at))

    listings = query.limit(100).all()

    user_fav_ids = set()
    if current_user:
        favs = db.query(ListingFavorite.listing_id).filter(ListingFavorite.user_id == current_user.id).all()
        user_fav_ids = {f[0] for f in favs}

    return [_populate_listing_response(l, db, user_fav_ids) for l in listings]

@router.get("/my-listings", response_model=List[MarketplaceListingResponse])
def get_my_listings(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(MarketplaceListing).filter(
        MarketplaceListing.seller_id == current_user.id
    )

    if status_filter:
        query = query.filter(MarketplaceListing.status == status_filter)
    else:
        query = query.filter(MarketplaceListing.status != "deleted")

    listings = query.order_by(desc(MarketplaceListing.created_at)).all()
    return [_populate_listing_response(l, db) for l in listings]

@router.get("/{listing_id}", response_model=MarketplaceListingResponse)
def get_listing_detail(
    listing_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    listing = db.query(MarketplaceListing).filter(MarketplaceListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")

    if listing.status == "deleted":
        if not current_user or current_user.id != listing.seller_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing no longer available")

    listing.views_count += 1
    db.commit()

    is_fav = False
    if current_user:
        is_fav = db.query(ListingFavorite).filter(
            ListingFavorite.listing_id == listing.id,
            ListingFavorite.user_id == current_user.id
        ).first() is not None

    res = _populate_listing_response(listing, db)
    res.is_favorite = is_fav
    return res

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
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this listing")

    for field, val in listing_in.model_dump(exclude_unset=True).items():
        if field == "images" and val is not None:
            db.query(ListingImage).filter(ListingImage.listing_id == listing.id).delete()
            for idx, img_url in enumerate(val[:8]):
                db.add(ListingImage(listing_id=listing.id, image_url=img_url, sort_order=idx))
        else:
            setattr(listing, field, val)

    db.commit()
    db.refresh(listing)
    return _populate_listing_response(listing, db)

@router.delete("/{listing_id}")
def delete_listing(
    listing_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    listing = db.query(MarketplaceListing).filter(MarketplaceListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")

    if listing.seller_id != current_user.id and current_user.role not in ["platform_admin", "super_admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot delete another seller's listing")

    listing.status = "deleted"
    db.commit()
    return {"message": "Listing deleted successfully and removed from active search"}

@router.post("/{listing_id}/mark-sold", response_model=MarketplaceListingResponse)
def mark_listing_as_sold(
    listing_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    listing = db.query(MarketplaceListing).filter(MarketplaceListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")

    if listing.seller_id != current_user.id and current_user.role not in ["platform_admin", "super_admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this listing")

    listing.status = "sold"
    listing.sold_at = datetime.utcnow()
    db.commit()
    db.refresh(listing)
    return _populate_listing_response(listing, db)

@router.post("/{listing_id}/reactivate", response_model=MarketplaceListingResponse)
def reactivate_listing(
    listing_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    listing = db.query(MarketplaceListing).filter(MarketplaceListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")

    if listing.seller_id != current_user.id and current_user.role not in ["platform_admin", "super_admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this listing")

    # Seller must have active membership to reactivate
    mkt_status = check_marketplace_membership(current_user.id, db)
    if not mkt_status["has_active_membership"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Active Marketplace Membership required to reactivate listings. Renew for ₹20 (6 months)."
        )

    listing.status = "active"
    listing.sold_at = None
    db.commit()
    db.refresh(listing)
    return _populate_listing_response(listing, db)

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
        return {"is_favorite": False}
    else:
        new_fav = ListingFavorite(listing_id=listing_id, user_id=current_user.id)
        db.add(new_fav)
        db.commit()
        return {"is_favorite": True}

# -----------------------------------------------------------------
# INITIATING BUYING / TRANSACTIONS (REQUIRES ACTIVE MEMBERSHIP)
# -----------------------------------------------------------------

@router.post("/transactions/checkout")
def checkout_marketplace_item(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Buyers must have active 6-Month Marketplace Membership to initiate checkout.
    No separate per-listing or buyer transaction fees are charged.
    """
    listing_id = payload.get("listing_id")
    if not listing_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="listing_id is required")

    listing = db.query(MarketplaceListing).filter(MarketplaceListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")

    if listing.seller_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot buy your own listing")

    if listing.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Item is not available for purchase (current status: {listing.status.upper()})"
        )

    # Check buyer membership
    mkt_status = check_marketplace_membership(current_user.id, db)
    if not mkt_status["has_active_membership"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Active Marketplace Membership required to buy products. Get 6 months of membership for ₹20."
        )

    # Check for simultaneous buyer reservation
    existing_active_tx = db.query(MarketplaceTransaction).filter(
        MarketplaceTransaction.listing_id == listing.id,
        MarketplaceTransaction.status.in_(["created", "completed"])
    ).first()
    if existing_active_tx and existing_active_tx.buyer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Item has already been reserved or purchased by another buyer."
        )

    # Zero additional fees under membership model (₹0 fee)
    item_price = listing.selling_price_paise
    order_data = RazorpayService.create_order(amount_paise=item_price)

    tx = MarketplaceTransaction(
        listing_id=listing.id,
        seller_id=listing.seller_id,
        buyer_id=current_user.id,
        item_price_paise=item_price,
        total_fee_paise=0, # No per-listing fee under membership model
        seller_fee_paise=0,
        buyer_fee_paise=0,
        fee_policy_applied="membership_covered",
        currency="INR",
        razorpay_order_id=order_data["order_id"],
        status="created",
        is_simulation=order_data["is_simulation"]
    )
    db.add(tx)
    db.commit()

    return {
        "id": tx.id,
        "order_id": order_data["order_id"],
        "razorpay_order_id": order_data["order_id"],
        "amount_paise": item_price,
        "total_fee_paise": 0,
        "status": "created",
        "currency": "INR",
        "key_id": order_data["key_id"],
        "is_simulation": order_data["is_simulation"]
    }

@router.post("/transactions/simulate-payment")
def simulate_marketplace_payment(
    order_id: Optional[str] = Query(None),
    payload: Optional[dict] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_order_id = order_id or (payload and payload.get("order_id"))
    tx = db.query(MarketplaceTransaction).filter(
        MarketplaceTransaction.razorpay_order_id == target_order_id
    ).first()
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Marketplace transaction order not found")

    sim_payment_id = f"pay_mkt_{uuid.uuid4().hex[:12]}"
    sim_signature = f"sig_mkt_{uuid.uuid4().hex[:20]}"

    return {
        "order_id": target_order_id,
        "razorpay_order_id": target_order_id,
        "razorpay_payment_id": sim_payment_id,
        "razorpay_signature": sim_signature,
        "is_simulation": True
    }

@router.post("/transactions/verify")
def verify_marketplace_transaction(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order_id = payload.get("order_id") or payload.get("razorpay_order_id")
    payment_id = payload.get("razorpay_payment_id")
    signature = payload.get("razorpay_signature")
    is_simulation = payload.get("is_simulation", False)

    tx = db.query(MarketplaceTransaction).filter(
        MarketplaceTransaction.razorpay_order_id == order_id
    ).first()
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    # Idempotent verification
    if tx.status == "completed":
        return {
            "status": "completed",
            "message": "Transaction already verified and completed",
            "transaction": tx
        }

    is_valid = RazorpayService.verify_signature(
        order_id=order_id,
        payment_id=payment_id,
        signature=signature
    )
    if not is_valid and not is_simulation:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid cryptographic payment signature")

    tx.status = "completed"
    tx.razorpay_payment_id = payment_id
    tx.razorpay_signature = signature
    tx.completed_at = datetime.utcnow()

    # Automatically transition listing status to SOLD
    listing = db.query(MarketplaceListing).filter(MarketplaceListing.id == tx.listing_id).first()
    if listing:
        listing.status = "sold"
        listing.sold_at = datetime.utcnow()

    db.commit()

    return {
        "status": "completed",
        "message": "Marketplace purchase successfully verified! Item is now marked as SOLD.",
        "transaction": tx
    }
