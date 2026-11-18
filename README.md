# Vyna — Everything Shared. Everything Simple.

**Vyna** is a production-structured digital platform for flats, apartments, hostels, PGs, shared accommodations, and student households. One connected platform to manage shared living, organize household finances, and discover products within your community.

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

Vyna offers four distinct and clearly defined subscription offerings:

| Subscription | Price | Duration | Capacity | Primary Scope |
|---|---:|---|---|---|
| **Free Plan** | ₹0 | Forever | 1 individual user | Individual account & free marketplace preview browsing |
| **Basic Plus** | ₹49 | 1 year | 3 total household members | Household creation, expense splits, bills & tasks |
| **Premium Household** | ₹99 | 6 months | Unlimited household members | Advanced analytics, custom bills & unlimited flatmates |
| **Marketplace Membership** | ₹20 | 6 months | Individual user access | Full product details, seller contact, unlimited buying & selling |

### 1. Plan 1 — Free Plan
- **Price**: ₹0 — Free Forever
- **Capacity**: 1 individual user only.
- **Features**: Create account, log in, browse marketplace in discovery preview mode.
- **Restrictions**: Cannot create or join households; cannot split expenses, manage bills, create shared shopping lists, or assign chores.

### 2. Plan 2 — Basic Plus
- **Price**: ₹49 / 1 Year (12 Months)
- **Capacity**: Up to 3 total household members (including owner).
- **Features**: Create 1 household, add up to 2 additional flatmates, shared expense tracking down to paise, equal/custom/percentage splitting, recurring & custom bill management, shared shopping lists, task assignment & flatmate delegation, monthly spending reports.

### 3. Plan 3 — Premium Household
- **Price**: ₹99 / 6 Months
- **Capacity**: Unlimited household members.
- **Features**: All Basic Plus features, unlimited members, only household owner pays ₹99 (flatmates join free), advanced expense analytics, unlimited custom bill categories, complete financial history.
- **Graceful Expiration**: Existing members are never kicked out when expired; adding new members is restricted if the household exceeds basic capacity until renewal.

### 4. Plan 4 — Marketplace Membership & Preview Access Control
- **Price**: ₹20 / 6 Months
- **Discovery Catalogue (Free Users)**:
  - Users without active membership see **limited product preview only**: cover photograph, title, short description, and seller name.
  - Price badges, location labels, item condition, specifications, additional photos, and seller contacts are **strictly withheld on the backend** (`is_preview: true`).
- **Full Member Access**:
  - Active ₹20 6-month membership unlocks the complete product page, all photos, item condition, full specifications, exact campus location, direct seller messaging, and instant protected checkout.
  - Unlimited listing publishing with zero per-listing charges and zero commission.

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
| **Super Admin** | `admin@nestsync.com` | `Admin@Vyna2026!` | Access to the Creator & Admin Panel, pricing controls, reports, logs |
| **Flat Owner** | `rahul@example.com` | `Pass@1234` | Skyline 402 Owner, Premium Plan, Active Marketplace Member |
| **Flat Admin** | `joy@example.com` | `Pass@1234` | Skyline 402 Member, Active Marketplace Member |
| **Flatmate** | `arjun@example.com` | `Pass@1234` | Skyline 402 Member, Free Plan |
| **Flatmate** | `priya@example.com` | `Pass@1234` | Skyline 402 Member, Free Plan |
