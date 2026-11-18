import pytest
from fastapi.testclient import TestClient
from app.main import app, on_startup
from app.database import Base, engine, SessionLocal
from app.models.user import User
from app.models.household import Household, HouseholdMember, Community
from app.models.subscription import MarketplaceMembership, UserSubscription
from app.core.security import get_password_hash
from datetime import datetime, timedelta

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    on_startup()
    yield

def test_healthcheck():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_auth_registration_and_login():
    email = "tester_new@example.com"
    password = "TestPassword@123"
    
    # 1. Register
    reg_res = client.post("/api/v1/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "Test User",
        "city": "Chennai"
    })
    assert reg_res.status_code in [201, 400]

    # 2. Login
    login_res = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": password
    })
    assert login_res.status_code == 200
    data = login_res.json()
    assert "access_token" in data
    assert data["email"] == email

def test_household_creation_and_isolation():
    login_res = client.post("/api/v1/auth/login", json={
        "email": "rahul@example.com",
        "password": "Pass@1234"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    house_res = client.get("/api/v1/households/", headers=headers)
    assert house_res.status_code == 200
    households = house_res.json()
    assert len(households) >= 1
    
    # Target household with expenses (Skyline Apartments 402)
    target_h = next((h for h in households if h["name"] == "Skyline Apartments 402"), households[0])
    household_id = target_h["id"]

    exp_res = client.get(f"/api/v1/households/{household_id}/expenses/", headers=headers)
    assert exp_res.status_code == 200
    expenses = exp_res.json()
    assert len(expenses) >= 1

    bal_res = client.get(f"/api/v1/households/{household_id}/expenses/balances", headers=headers)
    assert bal_res.status_code == 200
    balances = bal_res.json()
    assert len(balances) >= 1

def test_expense_split_precision():
    login_res = client.post("/api/v1/auth/login", json={
        "email": "rahul@example.com",
        "password": "Pass@1234"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    house_res = client.get("/api/v1/households/", headers=headers)
    household_id = house_res.json()[0]["id"]

    new_exp = client.post(
        f"/api/v1/households/{household_id}/expenses/",
        headers=headers,
        json={
            "title": "Kitchen Spices",
            "category": "groceries",
            "total_amount_paise": 60000, # ₹600.00
            "split_type": "equal"
        }
    )
    assert new_exp.status_code == 201
    exp_data = new_exp.json()
    assert exp_data["total_amount_paise"] == 60000
    total_shares = sum([p["share_amount_paise"] for p in exp_data["participants"]])
    assert total_shares == 60000

def test_marketplace_browsing_and_filtering():
    # Anyone can browse for free without membership
    res = client.get("/api/v1/marketplace/")
    assert res.status_code == 200
    items = res.json()
    assert len(items) >= 1

    furn_res = client.get("/api/v1/marketplace/?category=furniture")
    assert furn_res.status_code == 200
    for item in furn_res.json():
        assert item["category"] == "furniture"

    mov_res = client.get("/api/v1/marketplace/?is_moving_out_sale=true")
    assert mov_res.status_code == 200
    for item in mov_res.json():
        assert item["is_moving_out_sale"] is True

def test_ai_intent_parsing_and_execution():
    login_res = client.post("/api/v1/auth/login", json={
        "email": "rahul@example.com",
        "password": "Pass@1234"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    house_res = client.get("/api/v1/households/", headers=headers)
    household_id = house_res.json()[0]["id"]

    parse_res = client.post("/api/v1/ai/parse", headers=headers, json={
        "household_id": household_id,
        "user_input": "We are out of dish soap and need to buy some."
    })
    assert parse_res.status_code == 200
    parsed_data = parse_res.json()
    assert parsed_data["intent"] == "add_shopping_item"
    assert len(parsed_data["actions"]) >= 1

    exec_res = client.post("/api/v1/ai/execute", headers=headers, json={
        "conversation_id": parsed_data["conversation_id"],
        "actions": parsed_data["actions"]
    })
    assert exec_res.status_code == 200
    assert exec_res.json()["status"] == "success"

def test_subscription_and_payment_flow():
    login_res = client.post("/api/v1/auth/login", json={
        "email": "tester_new@example.com",
        "password": "TestPassword@123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    plans_res = client.get("/api/v1/subscriptions/plans")
    assert plans_res.status_code == 200
    plans = plans_res.json()
    assert len(plans) >= 2 # Free & Premium

    checkout_res = client.post("/api/v1/subscriptions/checkout", headers=headers, json={
        "plan_id": "premium"
    })
    assert checkout_res.status_code == 200
    order_data = checkout_res.json()
    assert "order_id" in order_data
    assert order_data["amount_paise"] == 9900 # ₹99 for 6 months

    sim_res = client.post(f"/api/v1/subscriptions/simulate-test-payment?order_id={order_data['order_id']}", headers=headers)
    assert sim_res.status_code == 200
    sim_data = sim_res.json()

    verify_res = client.post("/api/v1/subscriptions/verify", headers=headers, json={
        "razorpay_order_id": order_data["order_id"],
        "razorpay_payment_id": sim_data["razorpay_payment_id"],
        "razorpay_signature": sim_data["razorpay_signature"],
        "plan_id": "premium"
    })
    assert verify_res.status_code == 200
    verify_data = verify_res.json()
    assert verify_data["status"] == "success"
    assert verify_data["subscription_tier"] == "premium"

def test_admin_authorization():
    login_res = client.post("/api/v1/auth/login", json={
        "email": "arjun@example.com",
        "password": "Pass@1234"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    admin_res = client.get("/api/v1/admin/overview", headers=headers)
    assert admin_res.status_code == 403

    admin_login = client.post("/api/v1/auth/login", json={
        "email": "admin@nestsync.com",
        "password": "Admin@NestSync2026!"
    })
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    overview_res = client.get("/api/v1/admin/overview", headers=admin_headers)
    assert overview_res.status_code == 200
    metrics = overview_res.json()
    assert metrics["total_users"] >= 1
    assert "total_verified_subscription_revenue_paise" in metrics
    assert "total_marketplace_membership_revenue_paise" in metrics

def test_marketplace_listing_management_and_mark_as_sold():
    login_rahul = client.post("/api/v1/auth/login", json={"email": "rahul@example.com", "password": "Pass@1234"})
    rahul_token = login_rahul.json()["access_token"]
    rahul_headers = {"Authorization": f"Bearer {rahul_token}"}

    my_listings_res = client.get("/api/v1/marketplace/my-listings", headers=rahul_headers)
    assert my_listings_res.status_code == 200
    listings = my_listings_res.json()
    assert len(listings) >= 1
    target_listing = listings[0]
    target_id = target_listing["id"]
    assert "enquiries_count" in target_listing

    sold_res = client.post(f"/api/v1/marketplace/{target_id}/mark-sold", headers=rahul_headers)
    assert sold_res.status_code == 200
    sold_data = sold_res.json()
    assert sold_data["status"] == "sold"
    assert sold_data["sold_at"] is not None

    browse_res = client.get("/api/v1/marketplace/")
    active_ids = [item["id"] for item in browse_res.json()]
    assert target_id not in active_ids

    login_joy = client.post("/api/v1/auth/login", json={"email": "joy@example.com", "password": "Pass@1234"})
    joy_token = login_joy.json()["access_token"]
    joy_headers = {"Authorization": f"Bearer {joy_token}"}

    blocked_msg = client.post("/api/v1/chat/messages", headers=joy_headers, json={
        "recipient_id": target_listing["seller_id"],
        "listing_id": target_id,
        "content": "Hi, is this still available?"
    })
    assert blocked_msg.status_code == 400

    reactivate_res = client.post(f"/api/v1/marketplace/{target_id}/reactivate", headers=rahul_headers)
    assert reactivate_res.status_code == 200
    assert reactivate_res.json()["status"] == "active"

def test_marketplace_listing_deletion_and_ownership():
    login_rahul = client.post("/api/v1/auth/login", json={"email": "rahul@example.com", "password": "Pass@1234"})
    rahul_token = login_rahul.json()["access_token"]
    rahul_headers = {"Authorization": f"Bearer {rahul_token}"}

    create_res = client.post("/api/v1/marketplace/", headers=rahul_headers, json={
        "title": "USB-C Hub 7-in-1",
        "category": "electronics",
        "description": "HDMI, SD card reader, 3x USB 3.0",
        "selling_price_paise": 80000,
        "condition": "good",
        "location": "Potheri",
        "city": "Chennai"
    })
    listing_id = create_res.json()["id"]

    login_arjun = client.post("/api/v1/auth/login", json={"email": "arjun@example.com", "password": "Pass@1234"})
    arjun_headers = {"Authorization": f"Bearer {login_arjun.json()['access_token']}"}

    del_forbidden = client.delete(f"/api/v1/marketplace/{listing_id}", headers=arjun_headers)
    assert del_forbidden.status_code == 403

    del_success = client.delete(f"/api/v1/marketplace/{listing_id}", headers=rahul_headers)
    assert del_success.status_code == 200

    browse_res = client.get("/api/v1/marketplace/")
    active_ids = [item["id"] for item in browse_res.json()]
    assert listing_id not in active_ids

# ----------------------------------------------------------------------
# NEW CONSOLIDATED FEATURE TESTS
# ----------------------------------------------------------------------

def test_marketplace_membership_and_selling_buying_lock():
    # User without membership CANNOT sell
    email = f"non_member_{datetime.utcnow().timestamp()}@example.com"
    client.post("/api/v1/auth/register", json={"email": email, "password": "Pass@1234", "full_name": "Non Member", "city": "Chennai"})
    login_res = client.post("/api/v1/auth/login", json={"email": email, "password": "Pass@1234"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Attempt to sell without membership -> 403 Forbidden
    sell_res = client.post("/api/v1/marketplace/", headers=headers, json={
        "title": "Old Textbooks",
        "category": "books",
        "description": "Engineering Physics 1st year",
        "selling_price_paise": 30000,
        "condition": "good",
        "location": "Potheri",
        "city": "Chennai"
    })
    assert sell_res.status_code == 403
    assert "Marketplace Membership" in sell_res.json()["detail"]

    # Purchase Marketplace Membership for ₹20 (6 months)
    checkout_res = client.post("/api/v1/subscriptions/marketplace-membership/checkout", headers=headers)
    assert checkout_res.status_code == 200
    order_data = checkout_res.json()
    assert order_data["amount_paise"] == 2000

    # Simulate payment
    sim_res = client.post(f"/api/v1/subscriptions/simulate-test-payment?order_id={order_data['order_id']}", headers=headers)
    assert sim_res.status_code == 200
    sim_info = sim_res.json()

    # Verify payment
    verify_res = client.post("/api/v1/subscriptions/marketplace-membership/verify", headers=headers, json={
        "razorpay_order_id": order_data["order_id"],
        "razorpay_payment_id": sim_info["razorpay_payment_id"],
        "razorpay_signature": sim_info["razorpay_signature"]
    })
    assert verify_res.status_code == 200
    assert "activated for six months" in verify_res.json()["message"]

    # Now publishing listing succeeds!
    sell_success = client.post("/api/v1/marketplace/", headers=headers, json={
        "title": "Old Textbooks",
        "category": "books",
        "description": "Engineering Physics 1st year",
        "selling_price_paise": 30000,
        "condition": "good",
        "location": "Potheri",
        "city": "Chennai"
    })
    assert sell_success.status_code == 201

def test_community_building_and_flat_distinction():
    # Login as admin
    admin_login = client.post("/api/v1/auth/login", json={"email": "admin@nestsync.com", "password": "Admin@NestSync2026!"})
    admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

    # Fetch communities
    comms_res = client.get("/api/v1/households/communities")
    assert comms_res.status_code == 200
    comms = [c["name"] for c in comms_res.json()]
    assert "Estancia" in comms
    assert "Abode Valley" in comms
    assert "Mini Matrix" in comms

    # Create two flats with the same number 'Flat 404' under different communities
    login_rahul = client.post("/api/v1/auth/login", json={"email": "rahul@example.com", "password": "Pass@1234"})
    rahul_headers = {"Authorization": f"Bearer {login_rahul.json()['access_token']}"}

    flat1 = client.post("/api/v1/households/", headers=rahul_headers, json={
        "name": "Estancia Flat 404",
        "community_name": "Estancia",
        "building": "Tower A",
        "flat_number": "Flat 404",
        "city": "Chennai"
    })
    assert flat1.status_code == 201
    assert flat1.json()["full_identity"] == "Estancia · Tower A · Flat 404"

    flat2 = client.post("/api/v1/households/", headers=rahul_headers, json={
        "name": "Abode Valley Flat 404",
        "community_name": "Abode Valley",
        "building": "Tower A",
        "flat_number": "Flat 404",
        "city": "Chennai"
    })
    assert flat2.status_code == 201
    assert flat2.json()["full_identity"] == "Abode Valley · Tower A · Flat 404"
    assert flat1.json()["id"] != flat2.json()["id"]

def test_household_member_limit_and_joining_password():
    login_arjun = client.post("/api/v1/auth/login", json={"email": "arjun@example.com", "password": "Pass@1234"})
    arjun_headers = {"Authorization": f"Bearer {login_arjun.json()['access_token']}"}

    # Create Free Household with joining password
    new_h = client.post("/api/v1/households/", headers=arjun_headers, json={
        "name": "Arjun Free Flat",
        "community_name": "Estancia",
        "building": "Tower B",
        "flat_number": "Flat 101",
        "joining_password": "SecretFlatPass@123",
        "password_joining_enabled": True
    })
    assert new_h.status_code == 201
    h_data = new_h.json()
    h_id = h_data["id"]
    code = h_data["invitation_code"]

    # Check capacity info
    cap = client.get(f"/api/v1/households/{h_id}/capacity", headers=arjun_headers).json()
    assert cap["max_allowed"] == 3
    assert cap["current_members_count"] == 1
    assert cap["can_add_member"] is True

    # User attempts to join with incorrect password -> 401 Unauthorized
    login_priya = client.post("/api/v1/auth/login", json={"email": "priya@example.com", "password": "Pass@1234"})
    priya_headers = {"Authorization": f"Bearer {login_priya.json()['access_token']}"}

    fail_join = client.post("/api/v1/households/join", headers=priya_headers, json={
        "invitation_code": code,
        "joining_password": "WrongPassword"
    })
    assert fail_join.status_code == 401

    # User submits join with correct password -> pending join request created
    join_res = client.post("/api/v1/households/join", headers=priya_headers, json={
        "invitation_code": code,
        "joining_password": "SecretFlatPass@123"
    })
    assert join_res.status_code == 200

    # Owner views invitations/requests and approves
    invs_res = client.get(f"/api/v1/households/{h_id}/invitations", headers=arjun_headers)
    assert invs_res.status_code == 200
    invs = invs_res.json()
    assert len(invs) >= 1
    req_id = invs[0]["id"]

    approve_res = client.post(f"/api/v1/households/{h_id}/invitations/{req_id}/approve", headers=arjun_headers)
    assert approve_res.status_code == 200

    # Remove member test: owner kicks out member
    priya_user = client.get("/api/v1/auth/me", headers=priya_headers).json()
    rem_res = client.delete(f"/api/v1/households/{h_id}/members/{priya_user['id']}", headers=arjun_headers)
    assert rem_res.status_code == 200

def test_custom_bill_category():
    login_rahul = client.post("/api/v1/auth/login", json={"email": "rahul@example.com", "password": "Pass@1234"})
    rahul_headers = {"Authorization": f"Bearer {login_rahul.json()['access_token']}"}
    households = client.get("/api/v1/households/", headers=rahul_headers).json()
    h_id = households[0]["id"]

    # 1. Other without custom category -> 400 Bad Request
    fail_bill = client.post(f"/api/v1/households/{h_id}/bills/", headers=rahul_headers, json={
        "title": "Security Guard",
        "category": "other",
        "custom_category": "",
        "amount_paise": 50000,
        "due_date": (datetime.utcnow() + timedelta(days=5)).isoformat()
    })
    assert fail_bill.status_code == 400

    # 2. Other with valid custom category -> 201 Created
    succ_bill = client.post(f"/api/v1/households/{h_id}/bills/", headers=rahul_headers, json={
        "title": "Security Guard Monthly",
        "category": "other",
        "custom_category": "Security Charges",
        "amount_paise": 50000,
        "due_date": (datetime.utcnow() + timedelta(days=5)).isoformat()
    })
    assert succ_bill.status_code == 201
    b_data = succ_bill.json()
    assert b_data["category"] == "other"
    assert b_data["custom_category"] == "Security Charges"

def test_task_assignment_to_flatmate():
    login_rahul = client.post("/api/v1/auth/login", json={"email": "rahul@example.com", "password": "Pass@1234"})
    rahul_headers = {"Authorization": f"Bearer {login_rahul.json()['access_token']}"}
    
    # Get user details for Joy and Rahul's households
    login_joy = client.post("/api/v1/auth/login", json={"email": "joy@example.com", "password": "Pass@1234"})
    joy_headers = {"Authorization": f"Bearer {login_joy.json()['access_token']}"}
    joy_user = client.get("/api/v1/auth/me", headers=joy_headers).json()
    
    rahul_households = client.get("/api/v1/households/", headers=rahul_headers).json()
    joy_households = client.get("/api/v1/households/", headers=joy_headers).json()
    
    rahul_h_ids = {h["id"] for h in rahul_households}
    common_h_ids = [h["id"] for h in joy_households if h["id"] in rahul_h_ids]
    assert len(common_h_ids) >= 1
    shared_h_id = common_h_ids[0]

    task_res = client.post(f"/api/v1/households/{shared_h_id}/tasks/", headers=rahul_headers, json={
        "title": "Clean kitchen counters and sink",
        "description": "Wipe with disinfectant after dinner",
        "assigned_to_id": joy_user["id"],
        "due_date": (datetime.utcnow() + timedelta(days=1)).isoformat()
    })
    assert task_res.status_code == 201
    task_data = task_res.json()
    assert task_data["assigned_to_id"] == joy_user["id"]
    assert task_data["status"] == "pending"

    # Reject assignment to a user outside household -> 400 Bad Request
    fail_task = client.post(f"/api/v1/households/{shared_h_id}/tasks/", headers=rahul_headers, json={
        "title": "Clean balcony",
        "assigned_to_id": "non_existent_or_external_id"
    })
    assert fail_task.status_code == 400

def test_marketplace_preview_access_control():
    # 1. Unauthenticated / Free user browses marketplace
    res = client.get("/api/v1/marketplace/")
    assert res.status_code == 200
    listings = res.json()
    assert len(listings) > 0
    first_item = listings[0]
    
    # In preview mode, price, location, condition must be None, is_preview must be True
    assert first_item["is_preview"] is True
    assert first_item["selling_price_paise"] is None
    assert first_item["location"] is None
    assert first_item["condition"] is None
    assert len(first_item["images"]) <= 1

    # 2. Detail view for unauthenticated user
    detail_res = client.get(f"/api/v1/marketplace/{first_item['id']}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["is_preview"] is True
    assert detail["selling_price_paise"] is None
    assert detail["location"] is None
    assert detail["condition"] is None
    assert detail["seller"]["email"] is None

    # 3. Non-member trying to send message is rejected with 403
    # Register/login a user without membership
    free_email = f"preview_user_{int(datetime.utcnow().timestamp())}@test.com"
    reg = client.post("/api/v1/auth/register", json={
        "email": free_email,
        "full_name": "Preview Buyer",
        "phone": "+919876543299",
        "password": "Pass@1234"
    })
    token = reg.json()["access_token"]
    buyer_headers = {"Authorization": f"Bearer {token}"}

    # Attempt to message seller
    chat_res = client.post("/api/v1/chat/messages", headers=buyer_headers, json={
        "recipient_id": detail["seller_id"],
        "listing_id": detail["id"],
        "content": "Can I buy this item?"
    })
    assert chat_res.status_code == 403
    assert "Marketplace Membership required" in chat_res.json()["detail"]

    # 4. Activate ₹20 Marketplace Membership for this user
    checkout_res = client.post("/api/v1/subscriptions/marketplace-membership/checkout", headers=buyer_headers)
    assert checkout_res.status_code == 200
    order_id = checkout_res.json()["order_id"]

    sim_res = client.post(f"/api/v1/subscriptions/simulate-test-payment?order_id={order_id}", headers=buyer_headers)
    assert sim_res.status_code == 200
    sim_data = sim_res.json()

    verify_res = client.post("/api/v1/subscriptions/marketplace-membership/verify", headers=buyer_headers, json={
        "razorpay_order_id": order_id,
        "razorpay_payment_id": sim_data["razorpay_payment_id"],
        "razorpay_signature": sim_data["razorpay_signature"]
    })
    assert verify_res.status_code == 200
    assert verify_res.json()["status"] == "success"

    # Verify membership endpoint returns active
    mkt_status = client.get("/api/v1/subscriptions/marketplace-membership", headers=buyer_headers)
    assert mkt_status.status_code == 200
    assert mkt_status.json()["membership"]["has_active_membership"] is True

    # 5. Detail view now shows FULL data for active member
    member_detail_res = client.get(f"/api/v1/marketplace/{first_item['id']}", headers=buyer_headers)
    assert member_detail_res.status_code == 200
    member_detail = member_detail_res.json()
    assert member_detail["is_preview"] is False
    assert member_detail["selling_price_paise"] is not None
    assert member_detail["location"] is not None
    assert member_detail["condition"] is not None
    assert member_detail["seller"]["email"] is not None

    # 6. Messaging is now permitted
    member_chat_res = client.post("/api/v1/chat/messages", headers=buyer_headers, json={
        "recipient_id": detail["seller_id"],
        "listing_id": detail["id"],
        "content": "Hello, I am interested in purchasing this!"
    })
    assert member_chat_res.status_code == 201
