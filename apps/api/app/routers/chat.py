from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app.database import get_db
from app.models.user import User
from app.models.marketplace import MarketplaceListing
from app.models.chat import Conversation, ChatMessage
from app.models.notification import Notification
from app.core.deps import get_current_user
from app.core.marketplace_membership import check_marketplace_membership
from app.schemas.chat import (
    ChatMessageCreate, ChatMessageResponse, ConversationResponse
)

router = APIRouter(prefix="/chat", tags=["Buyer-Seller Messaging"])

@router.get("/conversations", response_model=List[ConversationResponse])
def get_user_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    convs = db.query(Conversation).filter(
        or_(Conversation.buyer_id == current_user.id, Conversation.seller_id == current_user.id)
    ).order_by(Conversation.last_message_at.desc()).all()
    return convs

@router.get("/conversations/{conversation_id}/messages", response_model=List[ChatMessageResponse])
def get_conversation_messages(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    if conv.buyer_id != current_user.id and conv.seller_id != current_user.id and current_user.role not in ["platform_admin", "super_admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this conversation")

    messages = db.query(ChatMessage).filter(
        ChatMessage.conversation_id == conversation_id
    ).order_by(ChatMessage.created_at.asc()).all()
    return messages

@router.post("/messages", response_model=ChatMessageResponse, status_code=status.HTTP_201_CREATED)
def send_message(
    msg_in: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conversation = None

    if msg_in.conversation_id:
        conversation = db.query(Conversation).filter(Conversation.id == msg_in.conversation_id).first()
        if not conversation:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    elif msg_in.recipient_id:
        # Check if conversation already exists between buyer and seller (optionally for listing)
        query = db.query(Conversation).filter(
            or_(
                and_(Conversation.buyer_id == current_user.id, Conversation.seller_id == msg_in.recipient_id),
                and_(Conversation.buyer_id == msg_in.recipient_id, Conversation.seller_id == current_user.id)
            )
        )
        if msg_in.listing_id:
            query = query.filter(Conversation.listing_id == msg_in.listing_id)
        conversation = query.first()

        if not conversation:
            if msg_in.listing_id:
                # Require active ₹20 6-Month Marketplace Membership to initiate buyer enquiries
                mkt_status = check_marketplace_membership(current_user.id, db)
                if not mkt_status["has_active_membership"] and current_user.role not in ["platform_admin", "super_admin"]:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Active Marketplace Membership required to contact sellers or send buying inquiries. Unlock 6 months for ₹20."
                    )

                listing = db.query(MarketplaceListing).filter(MarketplaceListing.id == msg_in.listing_id).first()
                if listing and listing.status == "sold":
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="This item has been marked as SOLD and is no longer accepting new purchase enquiries."
                    )
                if listing and listing.status == "deleted":
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="This listing has been deleted and cannot receive new enquiries."
                    )

            conversation = Conversation(
                buyer_id=current_user.id,
                seller_id=msg_in.recipient_id,
                listing_id=msg_in.listing_id,
                last_message=msg_in.content[:100],
                last_message_at=datetime.utcnow()
            )
            db.add(conversation)
            db.flush()
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Must provide conversation_id or recipient_id")

    # Add message
    new_message = ChatMessage(
        conversation_id=conversation.id,
        sender_id=current_user.id,
        content=msg_in.content
    )
    db.add(new_message)

    # Update conversation last message
    conversation.last_message = msg_in.content[:100]
    conversation.last_message_at = datetime.utcnow()

    # Notify recipient
    recipient_id = conversation.seller_id if conversation.buyer_id == current_user.id else conversation.buyer_id
    notif = Notification(
        user_id=recipient_id,
        title="New Message",
        message=f"{current_user.full_name}: {msg_in.content[:50]}...",
        type="chat_message",
        link_url=f"/marketplace/messages?conversation={conversation.id}"
    )
    db.add(notif)

    db.commit()
    db.refresh(new_message)
    return new_message
