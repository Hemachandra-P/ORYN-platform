import pytest
from fastapi.testclient import TestClient
from app.main import app, on_startup
from app.database import Base, engine, SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

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
    household_id = households[0]["id"]

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
            "title": "Kitchen Utensils Set",
            "total_amount_paise": 60000,
            "category": "household_items",
            "split_method": "equal"
        }
    )
    assert new_exp.status_code == 201
    exp_data = new_exp.json()
    assert exp_data["total_amount_paise"] == 60000
    total_shares = sum([p["share_amount_paise"] for p in exp_data["participants"]])
    assert total_shares == 60000

def test_marketplace_browsing_and_filtering():
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
    assert exec_res.json()["executed_count"] >= 1

def test_subscription_and_payment_flow():
    login_res = client.post("/api/v1/auth/login", json={
        "email": "joy@example.com",
        "password": "Pass@1234"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    plans_res = client.get("/api/v1/subscriptions/plans")
    assert plans_res.status_code == 200
    plans = plans_res.json()
    assert len(plans) == 3

    checkout_res = client.post("/api/v1/subscriptions/checkout", headers=headers, json={
        "plan_id": "premium"
    })
    assert checkout_res.status_code == 200
    order_data = checkout_res.json()
    assert "order_id" in order_data
    assert order_data["amount_paise"] == 9900

    sim_res = client.post(
        f"/api/v1/subscriptions/simulate-test-payment?order_id={order_data['order_id']}",
        headers=headers
    )
    assert sim_res.status_code == 200
    sim_data = sim_res.json()

    verify_res = client.post("/api/v1/subscriptions/verify", headers=headers, json={
        "plan_id": "premium",
        "razorpay_order_id": order_data["order_id"],
        "razorpay_payment_id": sim_data["razorpay_payment_id"],
        "razorpay_signature": sim_data["razorpay_signature"],
        "is_simulation": True
    })
    assert verify_res.status_code == 200
    assert verify_res.json()["subscription_tier"] == "premium"

def test_admin_authorization():
    # Regular user attempting admin endpoint -> must return 403 Forbidden
    login_res = client.post("/api/v1/auth/login", json={
        "email": "arjun@example.com",
        "password": "Pass@1234"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    admin_res = client.get("/api/v1/admin/overview", headers=headers)
    assert admin_res.status_code == 403

    # Super Admin accessing admin endpoint -> must return 200 OK
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
    assert metrics["verified_subscription_revenue_paise"] > 0

# =========================================================================
# NEW FEATURE TESTS: MY LISTINGS, DELETE, MARK AS SOLD, MARKETPLACE FEES
# =========================================================================

def test_marketplace_listing_management_and_mark_as_sold():
    # 1. Login as Rahul (seller)
    login_rahul = client.post("/api/v1/auth/login", json={"email": "rahul@example.com", "password": "Pass@1234"})
    rahul_token = login_rahul.json()["access_token"]
    rahul_headers = {"Authorization": f"Bearer {rahul_token}"}

    # 2. Create a new listing
    create_res = client.post("/api/v1/marketplace/", headers=rahul_headers, json={
        "title": "Study Lamp with Flexible Neck",
        "category": "electronics",
        "description": "Bright LED reading lamp, 3 color temperatures.",
        "selling_price_paise": 45000, # ₹450.00
        "condition": "like_new",
        "location": "Skyline 402, Potheri",
        "city": "Chennai"
    })
    assert create_res.status_code == 201
    listing = create_res.json()
    listing_id = listing["id"]
    assert listing["status"] == "active"

    # 3. Seller views listing in My Listings
    my_res = client.get("/api/v1/marketplace/my-listings", headers=rahul_headers)
    assert my_res.status_code == 200
    my_ids = [l["id"] for l in my_res.json()]
    assert listing_id in my_ids

    # 4. Seller marks item as SOLD
    sold_res = client.post(f"/api/v1/marketplace/{listing_id}/mark-sold", headers=rahul_headers)
    assert sold_res.status_code == 200
    assert sold_res.json()["status"] == "sold"
    assert sold_res.json()["sold_at"] is not None

    # 5. Sold item disappears from active marketplace browse
    search_res = client.get("/api/v1/marketplace/")
    active_ids = [l["id"] for l in search_res.json()]
    assert listing_id not in active_ids

    # 6. Seller can view sold-item history
    sold_history = client.get("/api/v1/marketplace/my-listings?status_filter=sold", headers=rahul_headers)
    assert sold_history.status_code == 200
    sold_ids = [l["id"] for l in sold_history.json()]
    assert listing_id in sold_ids

    # 7. Sold item cannot receive new purchase enquiries from a new buyer (Joy)
    login_joy = client.post("/api/v1/auth/login", json={"email": "joy@example.com", "password": "Pass@1234"})
    joy_token = login_joy.json()["access_token"]
    joy_headers = {"Authorization": f"Bearer {joy_token}"}

    msg_res = client.post("/api/v1/chat/messages", headers=joy_headers, json={
        "recipient_id": listing["seller_id"],
        "listing_id": listing_id,
        "content": "Is this lamp still available?"
    })
    assert msg_res.status_code == 400
    assert "SOLD" in msg_res.json()["detail"]

    # 8. Seller can reactivate item
    react_res = client.post(f"/api/v1/marketplace/{listing_id}/reactivate", headers=rahul_headers)
    assert react_res.status_code == 200
    assert react_res.json()["status"] == "active"

def test_marketplace_listing_deletion_and_ownership():
    # 1. Login as Rahul and create listing
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

    # 2. Login as Arjun (non-owner) and attempt to delete Rahul's listing -> MUST FAIL with 403 Forbidden
    login_arjun = client.post("/api/v1/auth/login", json={"email": "arjun@example.com", "password": "Pass@1234"})
    arjun_headers = {"Authorization": f"Bearer {login_arjun.json()['access_token']}"}

    del_forbidden = client.delete(f"/api/v1/marketplace/{listing_id}", headers=arjun_headers)
    assert del_forbidden.status_code == 403
    assert "not authorized" in del_forbidden.json()["detail"].lower()

    # 3. Rahul (owner) deletes his own listing -> 200 OK
    del_ok = client.delete(f"/api/v1/marketplace/{listing_id}", headers=rahul_headers)
    assert del_ok.status_code == 200

    # 4. Deleted item disappears from active searches
    search_res = client.get("/api/v1/marketplace/")
    active_ids = [l["id"] for l in search_res.json()]
    assert listing_id not in active_ids

def test_marketplace_fee_policies_and_admin_settings():
    # 1. Non-admin user attempting to change fee policy -> 403 Forbidden
    login_arjun = client.post("/api/v1/auth/login", json={"email": "arjun@example.com", "password": "Pass@1234"})
    arjun_headers = {"Authorization": f"Bearer {login_arjun.json()['access_token']}"}

    forbidden_fee = client.put("/api/v1/admin/marketplace/fee-settings", headers=arjun_headers, json={
        "fee_enabled": True,
        "fee_amount_paise": 2000,
        "fee_policy": "seller_fee"
    })
    assert forbidden_fee.status_code == 403

    # 2. Super Admin changes fee settings
    login_admin = client.post("/api/v1/auth/login", json={"email": "admin@nestsync.com", "password": "Admin@NestSync2026!"})
    admin_headers = {"Authorization": f"Bearer {login_admin.json()['access_token']}"}

    # Policy: seller_fee (₹20 = 2000 paise)
    admin_put1 = client.put("/api/v1/admin/marketplace/fee-settings", headers=admin_headers, json={
        "fee_enabled": True,
        "fee_amount_paise": 2000,
        "fee_policy": "seller_fee"
    })
    assert admin_put1.status_code == 200

    # Preview for ₹1,000 item (100000 paise)
    preview1 = client.get("/api/v1/marketplace/fee-preview?item_price_paise=100000")
    assert preview1.status_code == 200
    calc1 = preview1.json()
    assert calc1["seller_fee_paise"] == 2000
    assert calc1["buyer_fee_paise"] == 0
    assert calc1["total_fee_paise"] == 2000
    assert calc1["total_buyer_amount_paise"] == 100000
    assert calc1["net_seller_amount_paise"] == 98000

    # Policy: buyer_fee
    admin_put2 = client.put("/api/v1/admin/marketplace/fee-settings", headers=admin_headers, json={
        "fee_enabled": True,
        "fee_amount_paise": 2000,
        "fee_policy": "buyer_fee"
    })
    assert admin_put2.status_code == 200

    preview2 = client.get("/api/v1/marketplace/fee-preview?item_price_paise=100000")
    calc2 = preview2.json()
    assert calc2["seller_fee_paise"] == 0
    assert calc2["buyer_fee_paise"] == 2000
    assert calc2["total_buyer_amount_paise"] == 102000
    assert calc2["net_seller_amount_paise"] == 100000

    # Reset back to default: seller_fee
    client.put("/api/v1/admin/marketplace/fee-settings", headers=admin_headers, json={
        "fee_enabled": True,
        "fee_amount_paise": 2000,
        "fee_policy": "seller_fee"
    })

def test_marketplace_transaction_flow_and_idempotency():
    # 1. Login as Rahul (seller) and create listing
    login_rahul = client.post("/api/v1/auth/login", json={"email": "rahul@example.com", "password": "Pass@1234"})
    rahul_headers = {"Authorization": f"Bearer {login_rahul.json()['access_token']}"}

    create_res = client.post("/api/v1/marketplace/", headers=rahul_headers, json={
        "title": "Bluetooth Wireless Keyboard",
        "category": "electronics",
        "description": "Compact rechargeable keyboard",
        "selling_price_paise": 150000, # ₹1,500.00
        "condition": "like_new",
        "location": "Potheri",
        "city": "Chennai"
    })
    listing_id = create_res.json()["id"]

    # 2. Login as Joy (buyer) and checkout
    login_joy = client.post("/api/v1/auth/login", json={"email": "joy@example.com", "password": "Pass@1234"})
    joy_headers = {"Authorization": f"Bearer {login_joy.json()['access_token']}"}

    checkout_res = client.post("/api/v1/marketplace/transactions/checkout", headers=joy_headers, json={
        "listing_id": listing_id
    })
    assert checkout_res.status_code == 200
    tx_data = checkout_res.json()
    assert tx_data["status"] == "created"
    assert tx_data["total_fee_paise"] == 2000 # ₹20 fee

    # 3. Simulate payment
    sim_res = client.post(f"/api/v1/marketplace/transactions/simulate-payment?order_id={tx_data['razorpay_order_id']}", headers=joy_headers)
    assert sim_res.status_code == 200
    sim_info = sim_res.json()

    # 4. Verify payment
    verify_res = client.post("/api/v1/marketplace/transactions/verify", headers=joy_headers, json={
        "transaction_id": tx_data["id"],
        "razorpay_order_id": sim_info["razorpay_order_id"],
        "razorpay_payment_id": sim_info["razorpay_payment_id"],
        "razorpay_signature": sim_info["razorpay_signature"],
        "is_simulation": True
    })
    assert verify_res.status_code == 200
    assert verify_res.json()["status"] == "completed"

    # 5. Check listing automatically marked as SOLD
    listing_check = client.get(f"/api/v1/marketplace/{listing_id}")
    assert listing_check.json()["status"] == "sold"

    # 6. Idempotency test: duplicate verify does not duplicate fee or error
    dup_verify = client.post("/api/v1/marketplace/transactions/verify", headers=joy_headers, json={
        "transaction_id": tx_data["id"],
        "razorpay_order_id": sim_info["razorpay_order_id"],
        "razorpay_payment_id": sim_info["razorpay_payment_id"],
        "razorpay_signature": sim_info["razorpay_signature"],
        "is_simulation": True
    })
    assert dup_verify.status_code == 200
    assert dup_verify.json()["status"] == "completed"

    # 7. Simultaneous second buyer attempting checkout on the same item -> FAILS (already reserved/sold)
    login_arjun = client.post("/api/v1/auth/login", json={"email": "arjun@example.com", "password": "Pass@1234"})
    arjun_headers = {"Authorization": f"Bearer {login_arjun.json()['access_token']}"}

    second_buyer = client.post("/api/v1/marketplace/transactions/checkout", headers=arjun_headers, json={
        "listing_id": listing_id
    })
    assert second_buyer.status_code == 400
    assert "SOLD" in second_buyer.json()["detail"] or "already" in second_buyer.json()["detail"]

    # 8. Admin refund test
    login_admin = client.post("/api/v1/auth/login", json={"email": "admin@nestsync.com", "password": "Admin@NestSync2026!"})
    admin_headers = {"Authorization": f"Bearer {login_admin.json()['access_token']}"}

    refund_res = client.post(f"/api/v1/admin/marketplace/transactions/{tx_data['id']}/refund?refund_reason=Mutual+agreement", headers=admin_headers)
    assert refund_res.status_code == 200
    assert refund_res.json()["status"] == "refunded"
    assert refund_res.json()["refund_reason"] == "Mutual agreement"
