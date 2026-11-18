import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.household import HouseholdMember
from app.models.ai import AIConversation, AIAction
from app.models.expense import Expense, ExpenseParticipant
from app.models.shopping import ShoppingItem
from app.models.task import HouseholdTask
from app.models.bill import Bill
from app.core.deps import get_current_user, require_household_member
from app.core.ai_assistant import AIAssistantService
from app.schemas.ai import AIParseRequest, AIParseResponse, AIExecuteActionsRequest

router = APIRouter(prefix="/ai", tags=["AI Household Assistant"])

@router.post("/parse", response_model=AIParseResponse)
def parse_voice_or_text(
    req: AIParseRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_household_member(req.household_id, current_user, db)

    parsed = AIAssistantService.parse_intent(req.user_input)

    # Store AI interaction
    conv = AIConversation(
        user_id=current_user.id,
        household_id=req.household_id,
        user_input=req.user_input,
        input_type=req.input_type,
        intent_detected=parsed["intent"],
        raw_response=json.dumps(parsed)
    )
    db.add(conv)
    db.flush()

    for act in parsed["actions"]:
        action_record = AIAction(
            conversation_id=conv.id,
            action_type=act["action_type"],
            payload_json=json.dumps(act),
            status="pending_confirmation"
        )
        db.add(action_record)

    db.commit()

    return AIParseResponse(
        conversation_id=conv.id,
        intent=parsed["intent"],
        actions=parsed["actions"],
        needs_clarification=parsed["needs_clarification"],
        clarification_message=parsed["clarification_message"],
        summary=parsed["summary"]
    )

@router.post("/execute")
def execute_confirmed_actions(
    req: AIExecuteActionsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = db.query(AIConversation).filter(AIConversation.id == req.conversation_id).first()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="AI Conversation not found")

    require_household_member(conv.household_id, current_user, db)

    executed_count = 0
    created_items = []

    for action_data in req.actions:
        act_type = action_data.get("action_type")
        
        if act_type == "create_shopping_item":
            item = ShoppingItem(
                household_id=conv.household_id,
                title=action_data.get("title", "Shopping Item"),
                quantity=action_data.get("quantity", "1"),
                estimated_price_paise=action_data.get("estimated_price_paise", 0),
                is_purchased=False
            )
            db.add(item)
            executed_count += 1
            created_items.append(f"Shopping Item: {item.title}")

        elif act_type == "create_expense":
            total = action_data.get("total_amount_paise", 10000)
            exp = Expense(
                household_id=conv.household_id,
                title=action_data.get("title", "AI Logged Expense"),
                total_amount_paise=total,
                category=action_data.get("category", "groceries"),
                paid_by_id=current_user.id,
                split_method="equal"
            )
            db.add(exp)
            db.flush()

            # Split equally among household members
            members = db.query(HouseholdMember).filter(HouseholdMember.household_id == conv.household_id).all()
            if members:
                base_share = total // len(members)
                remainder = total % len(members)
                for idx, m in enumerate(members):
                    share = base_share + (1 if idx < remainder else 0)
                    part = ExpenseParticipant(
                        expense_id=exp.id,
                        user_id=m.user_id,
                        share_amount_paise=share,
                        paid_status="settled" if m.user_id == current_user.id else "unpaid"
                    )
                    db.add(part)

            executed_count += 1
            created_items.append(f"Expense: {exp.title} (₹{total/100:.2f})")

        elif act_type == "create_task":
            task = HouseholdTask(
                household_id=conv.household_id,
                title=action_data.get("title", "Household Task"),
                description=action_data.get("description"),
                status="todo"
            )
            db.add(task)
            executed_count += 1
            created_items.append(f"Task: {task.title}")

        elif act_type == "create_bill":
            bill = Bill(
                household_id=conv.household_id,
                title=action_data.get("title", "Upcoming Bill"),
                category=action_data.get("category", "custom"),
                amount_paise=action_data.get("amount_paise", 150000),
                due_date=datetime.utcnow(),
                recurrence=action_data.get("recurrence", "monthly"),
                is_paid=False
            )
            db.add(bill)
            executed_count += 1
            created_items.append(f"Bill: {bill.title}")

    # Mark actions as executed
    db.query(AIAction).filter(AIAction.conversation_id == conv.id).update({
        "status": "executed",
        "executed_at": datetime.utcnow()
    })

    db.commit()

    return {
        "status": "success",
        "executed_count": executed_count,
        "created_items": created_items,
        "message": f"Successfully performed {executed_count} automated action(s) for your household!"
    }
