from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from app.database import get_db
from app.models.user import User
from app.models.marketplace import MarketplaceListing, ListingImage, ListingFavorite
from app.core.deps import get_current_user, get_optional_current_user
from app.schemas.marketplace import (
    MarketplaceListingCreate, MarketplaceListingUpdate, MarketplaceListingResponse
)

router = APIRouter(prefix="/marketplace", tags=["Marketplace"])

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
        status="active"
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
    return listing

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

    # Populate favorites if user logged in
    user_fav_ids = set()
    if current_user:
        favs = db.query(ListingFavorite.listing_id).filter(ListingFavorite.user_id == current_user.id).all()
        user_fav_ids = {f[0] for f in favs}

    for l in listings:
        l.is_favorite = l.id in user_fav_ids

    return listings

@router.get("/my-listings", response_model=List[MarketplaceListingResponse])
def get_my_listings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    listings = db.query(MarketplaceListing).filter(
        MarketplaceListing.seller_id == current_user.id
    ).order_by(MarketplaceListing.created_at.desc()).all()
    return listings

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

    if current_user:
        fav = db.query(ListingFavorite).filter(
            ListingFavorite.listing_id == listing_id,
            ListingFavorite.user_id == current_user.id
        ).first()
        listing.is_favorite = fav is not None

    return listing

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
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to edit this listing")

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

    if listing_in.images is not None:
        # Replace images
        db.query(ListingImage).filter(ListingImage.listing_id == listing.id).delete()
        for idx, img_url in enumerate(listing_in.images[:8]):
            img = ListingImage(listing_id=listing.id, image_url=img_url, sort_order=idx)
            db.add(img)

    db.commit()
    db.refresh(listing)
    return listing

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
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this listing")

    db.delete(listing)
    db.commit()
    return {"message": "Listing deleted successfully"}

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
