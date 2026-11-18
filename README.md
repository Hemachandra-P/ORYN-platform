# NestSync — Unified Household Management & Community Marketplace Platform

NestSync is a production-structured digital platform for flats, apartments, hostels, PGs, shared accommodations and student households. It combines financial budgeting, collaborative chores, AI intent parsing, and a second-hand community marketplace into one modern lifestyle product.

---

## 🎨 Design System & Color Palette

- **Primary Navy**: `#14213D` (Navigation bars, primary visual containers)
- **Cream**: `#F4EDE0` (Primary application canvas & backgrounds)
- **Coral**: `#FF6B5B` (Primary action buttons, active badges, accents)
- **White**: `#FFFFFF` (Card surfaces, clean form dialogs)
- **Muted Blue**: `#A9B4C3` (Secondary captions, subtle borders)
- **Secondary Navy**: `#253A56` (Elevated headers, active navigation pills)

---

## 🏗️ Project Architecture

```
D:\SRM_website/
├── apps/
│   ├── api/                 # Python FastAPI backend (SQLAlchemy, Pydantic v2, JWT)
│   ├── web/                 # Next.js 14 App Router (Tailwind CSS, TypeScript)
│   └── mobile/              # React Native Expo cross-platform application
├── packages/
│   └── shared-types/        # Shared TypeScript data models and API contracts
├── database/                # Schema migrations & database documentation
├── docs/                    # Architecture diagrams & ER schema
├── docker-compose.yml       # Optional containerized local deployment
├── .env.example             # Environment variable template
└── README.md                # System documentation
```

---

## 🛒 Marketplace Listing Management & Protected Transaction Fees

### 1. Dedicated "My Listings" Management (`/marketplace/my-listings`)
- Authenticated sellers have a centralized command center for all items they have created.
- Filter by status tabs: **All**, **Active**, **Sold**, **Paused**, and **Draft**.
- Real-time **Enquiries count** tracked per listing from buyer chat conversations.
- Inline actions:
  - **Edit Listing**: Modal allowing updates to title, price, description, condition, and location.
  - **Mark as Sold**: Confirmation dialog changes status to `sold` and records the exact `sold_at` timestamp.
  - **Reactivate**: Allows sellers to re-open sold listings if a deal falls through.
  - **Delete Listing**: Confirmation dialog with backend ownership enforcement, soft-deleting the item (`status = "deleted"`) and removing it from public marketplace searches while preserving audit history.

### 2. Marketplace Protection & Configurable ₹20 Transaction Fee
- **Configurable Platform Policies**: Supported in the database and manageable via the Admin Panel:
  1. `seller_fee`: Deducted from seller proceeds (e.g. ₹20).
  2. `buyer_fee`: Charged directly to the buyer at checkout (e.g. ₹20).
  3. `both_fee`: Shared ₹20 fee split evenly between buyer and seller.
  4. `combined_fee`: Single combined fee paid by the buyer.
- **Fair Fee Principle**: Users are **never** charged merely for browsing items or sending inquiry messages to sellers.
- **Protected Checkout Flow**:
  1. `/marketplace/fee-preview`: Transparent fee breakdown preview without charging.
  2. `/marketplace/transactions/checkout`: Validates item status (`active`), prevents simultaneous duplicate buyer checkouts/reservations, calculates fees according to the current policy, and issues a Razorpay order.
  3. `/marketplace/transactions/simulate-payment`: Fast local sandbox simulation generating cryptographic mock HMAC-SHA256 signatures.
  4. `/marketplace/transactions/verify`: Server-side signature verification, idempotency protection (duplicate webhooks/calls do not duplicate fees), and automatically sets listing status to `sold`.
- **Inquiry Protection**: New purchase enquiries via chat are strictly blocked (400 Bad Request) on `sold` or `deleted` items while existing chat threads remain accessible.

### 3. Creator & Admin Panel Marketplace Controls (`/admin`)
- **Marketplace Fee Configuration**:
  - Live toggle to enable/disable marketplace transaction fees.
  - Editable fee amount (default ₹20 / 2,000 paise).
  - Policy selector (`seller_fee`, `buyer_fee`, `both_fee`, `combined_fee`).
- **Revenue Separation**: Marketplace transaction revenues are tracked and reported **strictly separated** from annual subscription revenues.
- **Financial Ledger & Refunds**:
  - View full ledger of completed marketplace transactions.
  - Dedicated "Refund Fee" action calling `/admin/marketplace/transactions/{id}/refund` with audit log recording.
  - One-click JSON export of marketplace fee reports.
- **Dashboard Metrics**: Active listings, sold listings, deleted listings, total completed marketplace purchases, net fees collected, and pending payment counts.

---

## 🚀 Local Development Setup (Windows PowerShell)

### Prerequisites:
- **Node.js**: v18+ (tested on Node v24)
- **Python**: 3.10+ (tested on Python 3.14)
- **Git**

---

### Step 1: Start the FastAPI Backend

Open a PowerShell terminal:

```powershell
cd D:\SRM_website\apps\api

# 1. Activate the Python virtual environment
.\venv\Scripts\Activate.ps1

# 2. Set the PYTHONPATH environment variable
$env:PYTHONPATH = "D:\SRM_website\apps\api"

# 3. Seed realistic development data (Users, flatmates, expenses, marketplace items, audit logs)
python seed.py

# 4. Start the FastAPI development server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

### Step 2: Start the Next.js Web Application

Open a second PowerShell terminal:

```powershell
cd D:\SRM_website\apps\web

# Start Next.js development server
npm run dev
```

- **Web Application**: [http://localhost:3000](http://localhost:3000)
- **Marketplace**: [http://localhost:3000/marketplace](http://localhost:3000/marketplace)
- **My Listings**: [http://localhost:3000/marketplace/my-listings](http://localhost:3000/marketplace/my-listings)
- **Admin Panel**: [http://localhost:3000/admin](http://localhost:3000/admin)

---

### Step 3: Run the Expo Mobile Application

Open a third PowerShell terminal:

```powershell
cd D:\SRM_website\apps\mobile

# Start Expo development bundler
npx expo start
```

Press `w` in the terminal to view on web, or scan the QR code with the Expo Go mobile app.

---

## 🧪 Running the Automated Test Suite

All 12 comprehensive backend test suites run cleanly with `pytest`:

```powershell
cd D:\SRM_website\apps\api
$env:PYTHONPATH = "D:\SRM_website\apps\api"
.\venv\Scripts\pytest.exe tests/test_backend.py -v
```

### Verified Test Cases:
1. `test_healthcheck`: API operational status.
2. `test_auth_registration_and_login`: JWT token issuance and password verification.
3. `test_household_creation_and_isolation`: Multi-tenant data isolation.
4. `test_expense_split_precision`: Penny-accurate integer paise arithmetic without float roundoff errors.
5. `test_marketplace_browsing_and_filtering`: Category, price, and moving-out sale filters.
6. `test_ai_intent_parsing_and_execution`: Natural language action extraction and safe validation.
7. `test_subscription_and_payment_flow`: Annual checkout, order generation, test simulation, and signature verification.
8. `test_admin_authorization`: Role-based privilege enforcement protecting admin endpoints.
9. `test_marketplace_listing_management_and_mark_as_sold`: Listing update, enquiries count calculation, mark-as-sold status change, `sold_at` timestamp recording, reactivate workflow, and blocking new enquiries on sold items while preserving existing chat history.
10. `test_marketplace_listing_deletion_and_ownership`: Ownership verification (sellers can delete their own; non-owners get 403 Forbidden), soft delete status, and exclusion from active search.
11. `test_marketplace_fee_policies_and_admin_settings`: Admin authorization requirement (403 for regular users), dynamic configuration of fee amount and policies (`seller_fee`, `buyer_fee`, `both_fee`, `combined_fee`), and mathematical verification of fee splits.
12. `test_marketplace_transaction_flow_and_idempotency`: End-to-end checkout, local simulation, HMAC-SHA256 verification, automatic mark-as-sold upon payment completion, duplicate webhook idempotency, preventing simultaneous duplicate purchases on reserved items, and admin refund handling with audit trail.

---

## 🔑 Pre-Seeded Development Accounts

For instant local testing, use the pre-configured accounts:

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@nestsync.com` | `Admin@NestSync2026!` | Access to the Creator & Admin Panel, fee controls, refunds, logs |
| **Flat Owner** | `rahul@example.com` | `Pass@1234` | Skyline 402 Owner, Premium Plan, Marketplace Seller |
| **Flat Admin** | `joy@example.com` | `Pass@1234` | Skyline 402 Admin, Basic Plus Plan, Marketplace Buyer |
| **Flatmate** | `arjun@example.com` | `Pass@1234` | Skyline 402 Member, Free Plan |
| **Flatmate** | `priya@example.com` | `Pass@1234` | Skyline 402 Member, Free Plan |
