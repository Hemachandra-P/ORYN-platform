from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class AIParseRequest(BaseModel):
    household_id: str
    user_input: str
    input_type: str = "text" # text or voice

class ActionItem(BaseModel):
    action_type: str # create_expense, create_shopping_item, create_task, create_bill
    title: str
    total_amount_paise: Optional[int] = None
    category: Optional[str] = None
    split_method: Optional[str] = None
    quantity: Optional[str] = None
    due_date: Optional[str] = None
    notes: Optional[str] = None

class AIParseResponse(BaseModel):
    conversation_id: str
    intent: str
    actions: List[Dict[str, Any]]
    needs_clarification: bool
    clarification_message: Optional[str] = None
    summary: str

class AIExecuteActionsRequest(BaseModel):
    conversation_id: str
    actions: List[Dict[str, Any]]
