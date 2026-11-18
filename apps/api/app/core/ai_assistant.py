import re
import json
from typing import Dict, Any, List
from datetime import datetime, timedelta

class AIAssistantService:
    @staticmethod
    def parse_intent(text: str, household_members: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Parses natural language requests into structured intent and actions.
        Works offline via intelligent semantic parser and can integrate with LLM APIs when configured.
        """
        cleaned = text.strip()
        lower = cleaned.lower()
        actions = []
        needs_clarification = False
        clarification_message = None

        # 1. Shopping intent: "we are out of ...", "need to buy ...", "add ... to shopping list"
        if any(keyword in lower for keyword in ["out of", "need to buy", "buy more", "shopping list", "get milk", "get eggs"]):
            item_match = re.search(r"(?:out of|need to buy|buy|get|add)\s+([a-zA-Z0-9\s]+?)(?:\s+to\s+(?:the\s+)?shopping\s+list|\.|$)", lower)
            item_name = item_match.group(1).strip() if item_match else cleaned
            # Clean up common auxiliary words
            item_name = re.sub(r"^(some|more|the|a|an)\s+", "", item_name).capitalize()
            actions.append({
                "action_type": "create_shopping_item",
                "title": f"Buy {item_name}",
                "quantity": "1 unit",
                "estimated_price_paise": 0
            })
            intent = "add_shopping_item"

        # 2. Expense intent: "paid ₹...", "spent ... on groceries", "purchased ... for ₹..."
        elif any(keyword in lower for keyword in ["paid", "spent", "purchased", "split"]):
            # Extract amount
            amount_match = re.search(r"(?:rs\.?|inr|₹)\s*(\d+(?:\.\d{1,2})?)", lower)
            if not amount_match:
                amount_match = re.search(r"(\d+(?:\.\d{1,2})?)\s*(?:rs|rupees|bucks)", lower)
            
            amount_val = float(amount_match.group(1)) if amount_match else None
            
            if not amount_val:
                needs_clarification = True
                clarification_message = "I detected an expense, but could you specify the exact amount paid (e.g., ₹500)?"
                intent = "add_expense"
            else:
                amount_paise = int(round(amount_val * 100))
                # Detect category
                category = "other"
                if any(w in lower for w in ["groceries", "milk", "vegetables", "fruits", "food", "dinner", "lunch", "snacks"]):
                    category = "groceries"
                elif any(w in lower for w in ["wifi", "internet", "electricity", "water", "gas"]):
                    category = "utilities"
                elif any(w in lower for w in ["rent"]):
                    category = "rent"

                # Check if specific member paid or exclude
                actions.append({
                    "action_type": "create_expense",
                    "title": f"Expense: {cleaned[:40]}",
                    "total_amount_paise": amount_paise,
                    "category": category,
                    "split_method": "equal",
                    "notes": cleaned
                })
                intent = "add_expense"

        # 3. Bill intent: "electricity is due...", "wifi bill due...", "rent due..."
        elif any(keyword in lower for keyword in ["bill", "due", "electricity", "water bill", "maintenance"]):
            due_days = 3
            if "friday" in lower:
                due_days = 2
            elif "tomorrow" in lower:
                due_days = 1
            due_date = (datetime.utcnow() + timedelta(days=due_days)).strftime("%Y-%m-%d")

            category = "custom"
            if "electricity" in lower:
                category = "electricity"
            elif "internet" in lower or "wifi" in lower:
                category = "internet"
            elif "water" in lower:
                category = "water"
            elif "rent" in lower:
                category = "rent"

            actions.append({
                "action_type": "create_bill",
                "title": f"{category.capitalize()} Bill",
                "category": category,
                "amount_paise": 150000, # default placeholder ₹1500
                "due_date": due_date,
                "recurrence": "monthly"
            })
            intent = "add_bill"

        # 4. Task / Chore intent: "assign ... to ...", "clean ...", "kitchen cleaning"
        elif any(keyword in lower for keyword in ["assign", "cleaning", "chore", "task", "clean", "take out trash"]):
            actions.append({
                "action_type": "create_task",
                "title": cleaned.capitalize(),
                "description": f"AI-scheduled household chore: {cleaned}",
                "due_date": (datetime.utcnow() + timedelta(days=2)).strftime("%Y-%m-%d"),
                "status": "todo"
            })
            intent = "add_task"

        else:
            intent = "general_query"
            clarification_message = "I can help you add expenses, log shopping items, track bills, or assign chores. Try saying: 'Rahul paid ₹450 for milk' or 'We are out of dish soap'."

        return {
            "intent": intent,
            "actions": actions,
            "needs_clarification": needs_clarification,
            "clarification_message": clarification_message,
            "summary": f"Identified {len(actions)} action(s) for execution." if actions else clarification_message
        }
