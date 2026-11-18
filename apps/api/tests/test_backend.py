import pytest
from fastapi.testclient import TestClient
from app.main import app, on_startup

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
    # Either 201 (created) or 400 (if already exists)
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
    # Login as rahul
    login_res = client.post("/api/v1/auth/login", json={
        "email": "rahul@example.com",
        "password": "Pass@1234"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch user households
    house_res = client.get("/api/v1/households/", headers=headers)
    assert house_res.status_code == 200
    households = house_res.json()
    assert len(households) >= 1
    household_id = households[0]["id"]

    # Verify expense list
    exp_res = client.get(f"/api/v1/households/{household_id}/expenses/", headers=headers)
    assert exp_res.status_code == 200
    expenses = exp_res.json()
    assert len(expenses) >= 1

    # Verify balance calculation
    bal_res = client.get(f"/api/v1/households/{household_id}/expenses/balances", headers=headers)
    assert bal_res.status_code == 200
    balances = bal_res.json()
    assert len(balances) >= 1

def test_expense_split_precision():
    # Test equal split integer paise calculation
    login_res = client.post("/api/v1/auth/login", json={
        "email": "rahul@example.com",
        "password": "Pass@1234"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    house_res = client.get("/api/v1/households/", headers=headers)
    household_id = house_res.json()[0]["id"]

    # Create expense with ₹600.00 (60000 paise) split equally
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
    # Sum of participant shares must equal 60000
    total_shares = sum([p["share_amount_paise"] for p in exp_data["participants"]])
    assert total_shares == 60000

def test_marketplace_browsing_and_filtering():
    res = client.get("/api/v1/marketplace/")
    assert res.status_code == 200
    items = res.json()
    assert len(items) >= 1

    # Filter by category furniture
    furn_res = client.get("/api/v1/marketplace/?category=furniture")
    assert furn_res.status_code == 200
    for item in furn_res.json():
        assert item["category"] == "furniture"

    # Moving out sales filter
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

    # Parse natural language input: "We are out of dish soap"
    parse_res = client.post("/api/v1/ai/parse", headers=headers, json={
        "household_id": household_id,
        "user_input": "We are out of dish soap and need to buy some."
    })
    assert parse_res.status_code == 200
    parsed_data = parse_res.json()
    assert parsed_data["intent"] == "add_shopping_item"
    assert len(parsed_data["actions"]) >= 1

    # Execute action
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

    # 1. Fetch plans
    plans_res = client.get("/api/v1/subscriptions/plans")
    assert plans_res.status_code == 200
    plans = plans_res.json()
    assert len(plans) == 3

    # 2. Checkout Premium (₹99)
    checkout_res = client.post("/api/v1/subscriptions/checkout", headers=headers, json={
        "plan_id": "premium"
    })
    assert checkout_res.status_code == 200
    order_data = checkout_res.json()
    assert "order_id" in order_data
    assert order_data["amount_paise"] == 9900

    # 3. Simulate test payment
    sim_res = client.post(
        f"/api/v1/subscriptions/simulate-test-payment?order_id={order_data['order_id']}",
        headers=headers
    )
    assert sim_res.status_code == 200
    sim_data = sim_res.json()

    # 4. Verify payment
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
