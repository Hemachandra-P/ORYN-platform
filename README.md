# NestSync — Unified Household Management & Community Marketplace Platform

NestSync is a production-structured digital platform for flats, apartments, hostels, PGs, shared accommodations, and student households. It combines financial budgeting, collaborative chores, member management, and a community marketplace into one modern lifestyle product.

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

## 💎 Consolidated Pricing & Features Architecture

### 1. Marketplace Membership Subscription (₹20 / 6 Months)
- **Free Browsing**: All registered users can browse, search, and view marketplace products for free.
- **₹20 Membership**: To publish listings (selling) or initiate buying transactions (checkout), users purchase a **6-Month Marketplace Membership** for ₹20 (2,000 paise).
- **Unlimited Transactions**: Once active, members can publish unlimited listings and execute purchases with ₹0 per-listing transaction fees.
- **Expiration & Renewal**: Validity lasts exactly 6 months. Expired users retain browsing access and can renew anytime from `/subscriptions`.

### 2. Household Subscriptions & Member Limits
- **Free Household Plan (₹0)**: Maximum **3 members total** (including the owner). Full access to shared expenses, bills, shopping lists, and chores.
- **Premium Household Plan (₹99 / 6 Months)**: **Unlimited household members** (subject to platform abuse limits).
- **Flatmates Join Free**: Only the household owner pays for the Premium plan. Flatmates join without individual subscriptions.
- **Graceful Expiration**: If the owner's subscription expires, existing members are never kicked out. New joins are blocked until the owner renews or membership drops below 3.

### 3. Community, Building, and Flat Hierarchy
- Every household belongs to a structured geographic hierarchy:
  $$\text{Community} \longrightarrow \text{Building / Tower / Block} \longrightarrow \text{Flat / Room Number}$$
- Example: `Estancia · Tower A · Flat 404`
- Predefined campus communities: **Estancia**, **Abode Valley**, **Mini Matrix**, with on-the-fly custom community creation supported.

### 4. Household Joining & Security Controls
- **Method A: Code + Password with Owner Approval**:
  - Joiners enter the household's 6-character invitation code and the household's joining password (hashed with `bcrypt`).
  - Creates a `join_request` requiring explicit owner approval before the user is admitted.
- **Method B: Direct Email Invitation**:
  - The owner invites a flatmate directly by email.
  - Generates a direct invitation that the recipient accepts with one click.
- **Owner Member Management**:
  - Dedicated member management view at `/households`.
  - Remove/kick members safely while strictly preserving all historical financial records and expense attributions.
  - Password toggle, password reset, and transfer of household ownership.

### 5. Multi-Image Upload for Marketplace Listings
- Dedicated multi-file upload supporting up to **8 photographs** (JPG, PNG, WebP up to 10MB each).
- Select cover photograph, remove, and reorder.
- Stored locally in `apps/api/uploads/` with static asset serving at `/uploads/{filename}`.

### 6. Custom Bill Categories (`OTHER (CUSTOM BILL)`)
- In addition to standard categories (Rent, Electricity, Water, Internet, Gas), users can select `OTHER (CUSTOM BILL)`.
- When selected, a custom bill category name is mandatory (e.g. "Maid Salary", "Security Charges", "Society Maintenance").

### 7. Task Assignment to Flatmates
- Assign chores and tasks directly to any active household flatmate via dropdown.
- Backend stores `assigned_to_id` and automatically issues an in-app notification to the assigned flatmate.

### 8. Creator & Admin Panel (`/admin`)
- **Subscription & Marketplace Pricing Config**:
  - Adjust marketplace membership fee (default ₹20) and validity duration.
  - Adjust household Premium plan price (default ₹99) and free member limit (default 3).
- **Community Management**:
  - Create and manage verified student communities.
- **Separated Revenue Reporting**:
  - Independent financial ledgers for Household Subscriptions vs Marketplace Memberships.
- **Custom Bill & Task Analytics**:
  - Real-time breakdowns of custom bill categories and chore completion rates.

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

# 3. Seed realistic development data
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
- **Sell an Item**: [http://localhost:3000/marketplace/sell](http://localhost:3000/marketplace/sell)
- **Subscriptions & Memberships**: [http://localhost:3000/subscriptions](http://localhost:3000/subscriptions)
- **Households & Chores**: [http://localhost:3000/households](http://localhost:3000/households)
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

All 15 comprehensive backend test suites pass cleanly with `pytest`:

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
7. `test_subscription_and_payment_flow`: ₹99 6-month Premium checkout, order generation, test simulation, and signature verification.
8. `test_admin_authorization`: Role-based privilege enforcement protecting admin endpoints and separated revenue reporting.
9. `test_marketplace_listing_management_and_mark_as_sold`: Listing update, enquiries count calculation, mark-as-sold status change, `sold_at` timestamp recording, reactivate workflow, and blocking new enquiries on sold items.
10. `test_marketplace_listing_deletion_and_ownership`: Ownership verification (sellers can delete their own; non-owners get 403 Forbidden), soft delete status, and exclusion from active search.
11. `test_marketplace_membership_and_selling_buying_lock`: Free browsing allowed for all; selling and buying strictly locked (403 Forbidden) until purchasing the ₹20 6-month membership; unlocks unlimited listings and checkouts.
12. `test_community_building_and_flat_distinction`: Hierarchy validation (`Community -> Building -> Flat`), custom community creation, and full identity string formatting.
13. `test_household_member_limit_and_joining_password`: Free 3-member limit enforcement; requiring joining password; join request creation and owner approval workflow; upgrading owner to Premium enables adding 4th member.
14. `test_custom_bill_category`: Creating `other` category bill requires `custom_category` name (e.g. "Maid Salary").
15. `test_task_assignment_to_flatmate`: Assigning chore to active flatmate, verifying `assigned_to_id`, and generating in-app notification.

---

## 🔑 Pre-Seeded Development Accounts

For instant local testing, use the pre-configured accounts:

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@nestsync.com` | `Admin@NestSync2026!` | Access to the Creator & Admin Panel, pricing controls, reports, logs |
| **Flat Owner** | `rahul@example.com` | `Pass@1234` | Skyline 402 Owner, Premium Plan, Active Marketplace Member |
| **Flat Admin** | `joy@example.com` | `Pass@1234` | Skyline 402 Member, Active Marketplace Member |
| **Flatmate** | `arjun@example.com` | `Pass@1234` | Skyline 402 Member, Free Plan |
| **Flatmate** | `priya@example.com` | `Pass@1234` | Skyline 402 Member, Free Plan |
