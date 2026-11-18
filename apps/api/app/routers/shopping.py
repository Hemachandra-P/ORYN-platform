from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.household import HouseholdActivityLog
from app.models.shopping import ShoppingItem
from app.core.deps import get_current_user, require_household_member
from app.schemas.shopping import ShoppingItemCreate, ShoppingItemUpdate, ShoppingItemResponse

router = APIRouter(prefix="/households/{household_id}/shopping", tags=["Shopping List"])

@router.post("/", response_model=ShoppingItemResponse, status_code=status.HTTP_201_CREATED)
def add_shopping_item(
    household_id: str,
    item_in: ShoppingItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_household_member(household_id, current_user, db)

    item = ShoppingItem(
        household_id=household_id,
        title=item_in.title,
        quantity=item_in.quantity,
        estimated_price_paise=item_in.estimated_price_paise,
        assigned_to_id=item_in.assigned_to_id,
        is_purchased=False
    )
    db.add(item)

    act = HouseholdActivityLog(
        household_id=household_id,
        user_id=current_user.id,
        action_type="shopping_item_added",
        description=f"{current_user.full_name} added '{item.title}' to the shopping list"
    )
    db.add(act)

    db.commit()
    db.refresh(item)
    return item

@router.get("/", response_model=List[ShoppingItemResponse])
def get_shopping_list(
    household_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_household_member(household_id, current_user, db)
    items = db.query(ShoppingItem).filter(
        ShoppingItem.household_id == household_id
    ).order_by(ShoppingItem.is_purchased.asc(), ShoppingItem.created_at.desc()).all()
    return items

@router.put("/{item_id}", response_model=ShoppingItemResponse)
def update_shopping_item(
    household_id: str,
    item_id: str,
    item_in: ShoppingItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_household_member(household_id, current_user, db)
    item = db.query(ShoppingItem).filter(ShoppingItem.id == item_id, ShoppingItem.household_id == household_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shopping item not found")

    if item_in.title is not None:
        item.title = item_in.title
    if item_in.quantity is not None:
        item.quantity = item_in.quantity
    if item_in.estimated_price_paise is not None:
        item.estimated_price_paise = item_in.estimated_price_paise
    if item_in.actual_price_paise is not None:
        item.actual_price_paise = item_in.actual_price_paise
    if item_in.assigned_to_id is not None:
        item.assigned_to_id = item_in.assigned_to_id
    if item_in.receipt_url is not None:
        item.receipt_url = item_in.receipt_url
    if item_in.is_purchased is not None:
        item.is_purchased = item_in.is_purchased
        if item_in.is_purchased:
            item.purchased_at = datetime.utcnow()
            item.purchased_by_id = current_user.id
            act = HouseholdActivityLog(
                household_id=household_id,
                user_id=current_user.id,
                action_type="shopping_item_purchased",
                description=f"{current_user.full_name} marked '{item.title}' as purchased"
            )
            db.add(act)

    db.commit()
    db.refresh(item)
    return item

@router.delete("/{item_id}")
def delete_shopping_item(
    household_id: str,
    item_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_household_member(household_id, current_user, db)
    item = db.query(ShoppingItem).filter(ShoppingItem.id == item_id, ShoppingItem.household_id == household_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shopping item not found")

    db.delete(item)
    db.commit()
    return {"message": "Shopping item deleted successfully"}
