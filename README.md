# 🥛 Nandini Milk Ordering & Delivery Management System

A premium, full-stack enterprise solution for managing milk subscriptions, product orders, and daily delivery logistics for the Nandini Milk Store (Vaderhalli, Bengaluru).

![Project Banner](https://img.shields.io/badge/Status-Active-brightgreen)
![Tech Stack](https://img.shields.io/badge/Stack-React_19_|_Supabase_|_Clerk-blue)

---

## 🌟 Key Features

### 👤 Customer Experience
- **Smart Authentication**: Secure login via Clerk (Phone/Email + OTP).
- **Subscription Management**: Weekly/Daily automated deliveries for milk, curd, and ghee.
- **Flexible Controls**: Ability to pause or resume subscriptions for specific dates.
- **Integrated Wallet**: Pre-pay for deliveries with a seamless wallet system.
- **Order History**: Comprehensive view of past deliveries and billing statements.

### 🛠️ Admin Control Center
- **Dynamic Delivery Management**: Consolidated view of daily dispatches (merged orders and subscriptions).
- **Slot-Based Filtering**: Real-time filtering for **Morning** and **Evening** delivery runs.
- **Partial Skips**: Fine-grained control to cancel specific products from a day's delivery without affecting the whole order.
- **Wallet Orchestration**: Manual wallet adjustments (debit/credit) and balance tracking.
- **Inventory & Analytics**: Real-time stock requirements, revenue charts, and CSV data exports.

### 🚚 Driver Logistics
- **Mobile-First Dashboard**: Optimized view for delivery persons on the go.
- **Proof of Delivery**: compulsory photo capture for every successful delivery.
- **Route Guidance**: One-click navigation via Google Maps integration.
- **Session Control**: Admin-locked delivery sessions to ensure data integrity.

---

## 🚀 Recent Updates & Improvements

- **✅ Slot-Based Dashboards**: Implemented morning/evening slot filtering across Admin and Driver portals.
- **✅ Partial Item Cancellation**: Admins can now "Cancel Item" or "Restore Item" for specific products in any delivery.
- **✅ Delivery Proof**: Integrated camera functionality for drivers to upload proof-of-delivery photos.
- **✅ Wallet Integration**: Added visible wallet balances to the Customer Management table and administrative balance overrides.
- **✅ Unified Delivery Logic**: Merged "Orders" and "Subscriptions" into a single, cohesive delivery workflow.
- **✅ Real-time Database**: Enabled Postgres real-time listeners for instant updates on the Admin dashboard.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 + Vite |
| **Authentication** | [Clerk](https://clerk.com/) |
| **Database** | [Supabase](https://supabase.com/) (PostgreSQL) |
| **State Management** | Zustand + TanStack Query |
| **Styling** | TailwindCSS v4 |
| **Icons** | Lucide React |
| **Data Viz** | Recharts |
| **Reporting** | jsPDF + AutoTable |

---

## 🚦 Getting Started

### 1. Requirements
- Node.js 20+
- Supabase Project
- Clerk Account

### 2. Installation
```bash
# Clone the repository
git clone [repository-url]

# Navigate to frontend
cd frontend

# Install dependencies
npm install
```

### 3. Configuration
Create a `.env` file in the `frontend/` directory:
```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

### 4. Database Setup
Execute the SQL schema found in `supabase/migrations/001_initial_schema.sql` within your Supabase SQL Editor.

### 5. Development
```bash
npm run dev
# Dashboard accessible at http://localhost:5173
```

---

## 📂 Project Structure

```text
Nandini-Milk-System/
├── supabase/
│   └── migrations/         ← SQL Schema and Database Policies
├── frontend/
│   ├── public/             ← Static Assets
│   └── src/
│       ├── components/     ← Reusable UI Components
│       ├── lib/            ← Supabase Client & Data Hooks (useData.js)
│       ├── pages/
│       │   ├── admin/      ← Dashboard, Customers, Analytics, Delivery
│       │   ├── customer/   ← Portal, Subscriptions, Wallet
│       │   └── delivery/   ← Driver Route & Photo Capture
│       └── store/          ← Global State (Zustand)
```

---

## 📜 License

MIT © 2026 **Nandini Milk Store, Vaderhalli**.
All rights reserved.
