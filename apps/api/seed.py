import json
import uuid
from datetime import datetime, timedelta
from app.database import engine, Base, SessionLocal
from app.models.user import User
from app.models.household import Household, HouseholdMember, HouseholdActivityLog
from app.models.expense import Expense, ExpenseParticipant
from app.models.bill import Bill
from app.models.settlement import Settlement
from app.models.shopping import ShoppingItem
from app.models.task import HouseholdTask
from app.models.marketplace import MarketplaceListing, ListingImage
from app.models.chat import Conversation, ChatMessage
from app.models.notification import Notification
from app.models.subscription import SubscriptionPlan, UserSubscription, PaymentTransaction
from app.models.admin import Report, AdminAuditLog, PlatformSetting
from app.core.security import get_password_hash
from app.config import settings

def seed_database():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        print("Checking if seed data already exists...")
        if db.query(User).filter(User.email == "rahul@example.com").first():
            print("Database is already seeded.")
            return

        print("Seeding Users...")
        # Super Admin
        super_admin = db.query(User).filter(User.email == settings.FIRST_SUPERUSER_EMAIL.lower()).first()
        if not super_admin:
            super_admin = User(
                email=settings.FIRST_SUPERUSER_EMAIL.lower(),
                hashed_password=get_password_hash(settings.FIRST_SUPERUSER_PASSWORD),
                full_name=settings.FIRST_SUPERUSER_NAME,
                role="super_admin",
                status="active",
                subscription_tier="premium"
            )
            db.add(super_admin)
            db.flush()

        # Regular flatmate users
        users_data = [
            {"email": "rahul@example.com", "name": "Rahul Sharma", "phone": "+91 98765 43210", "city": "Chennai", "tier": "premium"},
            {"email": "joy@example.com", "name": "Joy Mukherjee", "phone": "+91 98765 43211", "city": "Chennai", "tier": "basic_plus"},
            {"email": "arjun@example.com", "name": "Arjun Patel", "phone": "+91 98765 43212", "city": "Chennai", "tier": "free"},
            {"email": "priya@example.com", "name": "Priya Sundaram", "phone": "+91 98765 43213", "city": "Chennai", "tier": "free"},
            {"email": "sneha@example.com", "name": "Sneha Reddy", "phone": "+91 98765 43214", "city": "Chennai", "tier": "free"},
            {"email": "karthik@example.com", "name": "Karthik Raj", "phone": "+91 98765 43215", "city": "Chennai", "tier": "free"},
        ]

        created_users = {}
        for u in users_data:
            user = User(
                email=u["email"],
                hashed_password=get_password_hash("Pass@1234"),
                full_name=u["name"],
                phone_number=u["phone"],
                city=u["city"],
                role="user",
                status="active",
                subscription_tier=u["tier"],
                avatar_url=f"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
            )
            db.add(user)
            db.flush()
            created_users[u["email"]] = user

        print("Seeding Household...")
        rahul = created_users["rahul@example.com"]
        household = Household(
            name="Skyline Apartments 402",
            description="Shared flat near campus. Collaborative expenses, clean kitchen rotation.",
            address="Flat 402, Skyline Heights, Potheri / Kattankulathur",
            city="Chennai",
            photo_url="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80",
            invitation_code="SKYLINE402",
            owner_id=rahul.id,
            status="active"
        )
        db.add(household)
        db.flush()

        # Add all 6 members to the household
        roles = [
            (rahul.id, "owner"),
            (created_users["joy@example.com"].id, "admin"),
            (created_users["arjun@example.com"].id, "member"),
            (created_users["priya@example.com"].id, "member"),
            (created_users["sneha@example.com"].id, "member"),
            (created_users["karthik@example.com"].id, "member"),
        ]
        for uid, r in roles:
            m = HouseholdMember(household_id=household.id, user_id=uid, role=r)
            db.add(m)

        db.flush()

        print("Seeding Shared Expenses (Master Prompt Example: ₹1,200 groceries split 6 ways)...")
        # Rahul purchases groceries worth ₹1,200. Split equally among 6 members (₹200 each).
        exp1 = Expense(
            household_id=household.id,
            title="Weekly Supermarket Groceries",
            description="Rice, Dal, cooking spices, fresh milk, vegetables, cooking oil",
            total_amount_paise=120000, # ₹1,200.00
            category="groceries",
            paid_by_id=rahul.id,
            expense_date=datetime.utcnow() - timedelta(days=2),
            receipt_url="https://images.unsplash.com/photo-1554415707-9e4c019a8d47?w=600&auto=format&fit=crop&q=80",
            split_method="equal"
        )
        db.add(exp1)
        db.flush()

        for uid, _ in roles:
            is_rahul = (uid == rahul.id)
            db.add(ExpenseParticipant(
                expense_id=exp1.id,
                user_id=uid,
                share_amount_paise=20000, # ₹200.00
                percentage=16.67,
                paid_status="settled" if is_rahul else "unpaid"
            ))

        # Second expense: Joy paid ₹900 for high speed fiber internet
        exp2 = Expense(
            household_id=household.id,
            title="Airtel Fiber Broadband 200Mbps",
            description="Monthly shared broadband connection bill",
            total_amount_paise=90000,
            category="utilities",
            paid_by_id=created_users["joy@example.com"].id,
            expense_date=datetime.utcnow() - timedelta(days=5),
            split_method="equal"
        )
        db.add(exp2)
        db.flush()
        for uid, _ in roles:
            is_joy = (uid == created_users["joy@example.com"].id)
            db.add(ExpenseParticipant(
                expense_id=exp2.id,
                user_id=uid,
                share_amount_paise=15000, # ₹150.00
                percentage=16.67,
                paid_status="settled" if is_joy else "unpaid"
            ))

        print("Seeding Settlements (Joy & Arjun pay Rahul ₹200 each)...")
        joy = created_users["joy@example.com"]
        arjun = created_users["arjun@example.com"]

        s1 = Settlement(
            household_id=household.id,
            payer_id=joy.id,
            payee_id=rahul.id,
            amount_paise=20000, # ₹200
            upi_reference="UPI/432190887123/GPay",
            status="confirmed",
            created_at=datetime.utcnow() - timedelta(days=1),
            confirmed_at=datetime.utcnow() - timedelta(hours=12)
        )
        db.add(s1)

        s2 = Settlement(
            household_id=household.id,
            payer_id=arjun.id,
            payee_id=rahul.id,
            amount_paise=20000, # ₹200
            upi_reference="UPI/432190889988/PhonePe",
            status="confirmed",
            created_at=datetime.utcnow() - timedelta(hours=8),
            confirmed_at=datetime.utcnow() - timedelta(hours=2)
        )
        db.add(s2)

        print("Seeding Upcoming & Recurring Bills...")
        db.add(Bill(
            household_id=household.id,
            title="TNEB Electricity Bill",
            category="electricity",
            amount_paise=245000, # ₹2,450
            due_date=datetime.utcnow() + timedelta(days=3),
            recurrence="monthly",
            notes="EB consumer number: 09-123-456. Due Friday.",
            is_paid=False
        ))
        db.add(Bill(
            household_id=household.id,
            title="Apartment Maintenance & Water Charges",
            category="maintenance",
            amount_paise=300000, # ₹3,000
            due_date=datetime.utcnow() + timedelta(days=12),
            recurrence="monthly",
            notes="Covers 24/7 security, elevator & water tanker.",
            is_paid=False
        ))

        print("Seeding Shared Shopping List...")
        db.add(ShoppingItem(
            household_id=household.id,
            title="Cow Milk (Nandini / Aavin 2L)",
            quantity="2 packets",
            estimated_price_paise=6600,
            assigned_to_id=rahul.id,
            is_purchased=False
        ))
        db.add(ShoppingItem(
            household_id=household.id,
            title="Cold Pressed Sunflower Cooking Oil",
            quantity="1 Litre",
            estimated_price_paise=16000,
            assigned_to_id=joy.id,
            is_purchased=False
        ))
        db.add(ShoppingItem(
            household_id=household.id,
            title="India Gate Basmati Rice 5kg",
            quantity="1 bag",
            estimated_price_paise=48000,
            actual_price_paise=47000,
            assigned_to_id=arjun.id,
            is_purchased=True,
            purchased_by_id=arjun.id,
            purchased_at=datetime.utcnow() - timedelta(days=1)
        ))

        print("Seeding Tasks & Chores...")
        db.add(HouseholdTask(
            household_id=household.id,
            title="Kitchen Countertop & Stove Deep Cleaning",
            description="Wipe down kitchen tiles, scrub stove, take out organic trash.",
            assigned_to_id=joy.id,
            due_date=datetime.utcnow() + timedelta(days=1),
            recurrence="weekly",
            status="todo"
        ))
        db.add(HouseholdTask(
            household_id=household.id,
            title="Living Room Vacuuming & Sofa Cleaning",
            description="Sunday rotation chore.",
            assigned_to_id=rahul.id,
            due_date=datetime.utcnow() + timedelta(days=4),
            recurrence="weekly",
            status="todo"
        ))

        print("Seeding Marketplace Second-Hand Listings...")
        listings = [
            {
                "seller": rahul,
                "title": "Green Soul Ergonomic Mesh Office Chair",
                "category": "furniture",
                "desc": "Breathable mesh back with adjustable lumbar support and armrests. Used for 8 months during college semesters. Clean and 100% sturdy.",
                "price": 220000, # ₹2,200
                "orig_price": 599900,
                "condition": "like_new",
                "location": "Potheri, Kattankulathur",
                "city": "Chennai",
                "is_moving_out": False,
                "images": [
                    "https://images.unsplash.com/photo-1580481077195-c3a82145d84c?w=800&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=800&auto=format&fit=crop&q=80"
                ]
            },
            {
                "seller": joy,
                "title": "IFB 20L Convection Microwave Oven with Grill",
                "category": "appliances",
                "desc": "Moving out after graduation! Excellent condition microwave oven, perfect for reheating, baking and student quick meals. Includes glass turntable plate.",
                "price": 349900, # ₹3,499
                "orig_price": 750000,
                "condition": "good",
                "location": "Skyline Heights, Kattankulathur",
                "city": "Chennai",
                "is_moving_out": True,
                "collection": "Joy's B.Tech Graduation Moving Out Sale",
                "images": [
                    "https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=800&auto=format&fit=crop&q=80"
                ]
            },
            {
                "seller": joy,
                "title": "Godrej 99L Single Door Mini Refrigerator",
                "category": "appliances",
                "desc": "Compact fridge with freezer compartment. Keeps drinks chilled, saves electricity. Graduation moving out sale item.",
                "price": 580000, # ₹5,800
                "orig_price": 1150000,
                "condition": "like_new",
                "location": "Skyline Heights, Kattankulathur",
                "city": "Chennai",
                "is_moving_out": True,
                "collection": "Joy's B.Tech Graduation Moving Out Sale",
                "images": [
                    "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800&auto=format&fit=crop&q=80"
                ]
            },
            {
                "seller": arjun,
                "title": "Computer Science & Engineering Standard Textbooks (7 Books)",
                "category": "books",
                "desc": "Includes Tanenbaum Computer Networks, Cormen Algorithms (CLRS), Silberschatz OS, and Korth Database Systems. Clean with pencil notes.",
                "price": 85000, # ₹850
                "orig_price": 320000,
                "condition": "good",
                "location": "Near SRM University Gate 1",
                "city": "Chennai",
                "is_moving_out": False,
                "images": [
                    "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80"
                ]
            },
            {
                "seller": created_users["priya@example.com"],
                "title": "Hercules Roadeo 21-Speed Geared Mountain Bicycle",
                "category": "bicycles",
                "desc": "Dual disc brakes, front suspension, smooth Shimano gears. Great for riding around campus and local markets. Includes heavy duty number lock.",
                "price": 420000, # ₹4,200
                "orig_price": 1050000,
                "condition": "good",
                "location": "Abode Valley, Potheri",
                "city": "Chennai",
                "is_moving_out": False,
                "images": [
                    "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&auto=format&fit=crop&q=80"
                ]
            },
            {
                "seller": created_users["sneha@example.com"],
                "title": "Solid Sheesham Wood Minimalist Study Table",
                "category": "furniture",
                "desc": "Spacious top (4ft x 2ft) with storage drawer and cable grommet. Barely 3 months old, selling due to hostel room change.",
                "price": 195000, # ₹1,950
                "orig_price": 420000,
                "condition": "like_new",
                "location": "Estancia Townships, Guduvanchery",
                "city": "Chennai",
                "is_moving_out": False,
                "images": [
                    "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&auto=format&fit=crop&q=80"
                ]
            }
        ]

        created_listings = []
        for l in listings:
            item = MarketplaceListing(
                seller_id=l["seller"].id,
                title=l["title"],
                category=l["category"],
                description=l["desc"],
                selling_price_paise=l["price"],
                original_price_paise=l["orig_price"],
                condition=l["condition"],
                location=l["location"],
                city=l["city"],
                is_moving_out_sale=l["is_moving_out"],
                moving_out_collection_title=l.get("collection"),
                status="active",
                views_count=42
            )
            db.add(item)
            db.flush()
            for idx, img_url in enumerate(l["images"]):
                db.add(ListingImage(listing_id=item.id, image_url=img_url, sort_order=idx))
            created_listings.append(item)

        print("Seeding Buyer-Seller Chat...")
        chair_listing = created_listings[0] # Rahul's chair
        buyer_priya = created_users["priya@example.com"]
        conv = Conversation(
            listing_id=chair_listing.id,
            buyer_id=buyer_priya.id,
            seller_id=rahul.id,
            last_message="Hi Rahul! Is the office chair still available? Can I inspect it today evening?",
            last_message_at=datetime.utcnow() - timedelta(hours=3)
        )
        db.add(conv)
        db.flush()

        db.add(ChatMessage(
            conversation_id=conv.id,
            sender_id=buyer_priya.id,
            content="Hi Rahul! Is the office chair still available? Can I inspect it today evening?",
            created_at=datetime.utcnow() - timedelta(hours=3)
        ))
        db.add(ChatMessage(
            conversation_id=conv.id,
            sender_id=rahul.id,
            content="Hey Priya! Yes, it's available. You can drop by Skyline 402 anytime after 6 PM.",
            created_at=datetime.utcnow() - timedelta(hours=2, minutes=30)
        ))

        print("Seeding Subscriptions & Verified Revenue for Admin Analytics...")
        # Rahul's Premium subscription transaction
        db.add(PaymentTransaction(
            user_id=rahul.id,
            plan_id="premium",
            amount_paise=9900, # ₹99.00
            currency="INR",
            razorpay_order_id="order_seed_001_rahul",
            razorpay_payment_id="pay_seed_001_rahul",
            razorpay_signature="sim_sig_verified_seed_001",
            status="verified",
            is_simulation=False,
            verified_at=datetime.utcnow() - timedelta(days=15)
        ))
        db.add(UserSubscription(
            user_id=rahul.id,
            plan_id="premium",
            status="active",
            current_period_start=datetime.utcnow() - timedelta(days=15),
            current_period_end=datetime.utcnow() + timedelta(days=350),
            razorpay_order_id="order_seed_001_rahul",
            razorpay_payment_id="pay_seed_001_rahul"
        ))

        # Joy's Basic Plus subscription transaction
        db.add(PaymentTransaction(
            user_id=joy.id,
            plan_id="basic_plus",
            amount_paise=4900, # ₹49.00
            currency="INR",
            razorpay_order_id="order_seed_002_joy",
            razorpay_payment_id="pay_seed_002_joy",
            razorpay_signature="sim_sig_verified_seed_002",
            status="verified",
            is_simulation=False,
            verified_at=datetime.utcnow() - timedelta(days=20)
        ))
        db.add(UserSubscription(
            user_id=joy.id,
            plan_id="basic_plus",
            status="active",
            current_period_start=datetime.utcnow() - timedelta(days=20),
            current_period_end=datetime.utcnow() + timedelta(days=345),
            razorpay_order_id="order_seed_002_joy",
            razorpay_payment_id="pay_seed_002_joy"
        ))

        print("Seeding Sample Report & Admin Audit Logs...")
        db.add(Report(
            reporter_id=arjun.id,
            target_type="listing",
            target_id=created_listings[3].id,
            reason="Price query or condition check",
            details="User asked if individual textbook can be sold separately.",
            status="resolved",
            resolution_notes="Contacted seller who agreed to offer split purchases.",
            resolved_by_id=super_admin.id,
            resolved_at=datetime.utcnow() - timedelta(days=1)
        ))

        db.add(AdminAuditLog(
            admin_id=super_admin.id,
            action="system_seed_initialized",
            target_type="system",
            target_id="nestsync_platform",
            details="Development environment seeded with demo households, users, marketplace listings and verified revenue.",
            ip_address="127.0.0.1"
        ))

        db.commit()
        print("Database seeded successfully with rich production-structured data!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
