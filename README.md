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

# 3. Seed realistic development data (Users, flatmates, expenses, marketplace items)
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

All 8 comprehensive backend test suites can be executed with `pytest`:

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

---

## 🔑 Pre-Seeded Development Accounts

For instant local testing, use the pre-configured accounts:

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@nestsync.com` | `Admin@NestSync2026!` | Access to the 15-module Creator & Admin Panel |
| **Flat Owner** | `rahul@example.com` | `Pass@1234` | Skyline 402 Owner, Premium Plan |
| **Flat Admin** | `joy@example.com` | `Pass@1234` | Skyline 402 Admin, Basic Plus Plan |
| **Flatmate** | `arjun@example.com` | `Pass@1234` | Skyline 402 Member, Free Plan |
| **Flatmate** | `priya@example.com` | `Pass@1234` | Skyline 402 Member, Free Plan |

---

## 💳 Payment Gateway & Razorpay Test Simulation

NestSync includes both live Razorpay credential configuration and an instant local test simulator:
1. When checking out plans (Basic Plus ₹49/yr or Premium ₹99/yr), the server creates an official order payload.
2. The frontend invokes `/subscriptions/simulate-test-payment` which generates cryptographically valid test signatures.
3. `/subscriptions/verify` inspects the HMAC-SHA256 signature server-side, validates idempotency, and activates the annual subscription ledger.
