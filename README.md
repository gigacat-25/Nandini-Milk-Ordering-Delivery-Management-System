# 🥛 Nandini Milk Ordering & Delivery Management System

A premium, full-stack enterprise solution for managing milk subscriptions, product orders, and daily delivery logistics for the Nandini Milk Store (Vaderhalli, Bengaluru).

![Project Banner](https://img.shields.io/badge/Status-Active-brightgreen)
![Tech Stack](https://img.shields.io/badge/Stack-React_19_|_Cloudflare_|_Clerk-orange)

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
- **Proof of Delivery**: Compulsory photo capture for every successful delivery stored in Cloudflare R2.
- **Route Guidance**: One-click navigation via Google Maps integration.
- **Session Control**: Admin-locked delivery sessions to ensure data integrity.

---

## 🚀 Recent Updates & Improvements

- **✅ Cloudflare Migration**: Entire backend moved from Supabase to Cloudflare Workers, D1 (Database), and R2 (Storage).
- **✅ Slot-Based Dashboards**: Implemented morning/evening slot filtering across Admin and Driver portals.
- **✅ Partial Item Cancellation**: Admins can now "Cancel Item" or "Restore Item" for specific products in any delivery.
- **✅ Delivery Proof**: Integrated camera functionality for drivers to upload proof-of-delivery photos to R2.
- **✅ Wallet Integration**: Added visible wallet balances to the Customer Management table and administrative balance overrides.
- **✅ Unified Delivery Logic**: Merged "Orders" and "Subscriptions" into a single, cohesive delivery workflow.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 + Vite |
| **Backend** | Cloudflare Workers (Hono.js) |
| **Database** | Cloudflare D1 (SQLite) |
| **Storage** | Cloudflare R2 |
| **Authentication** | [Clerk](https://clerk.com/) |
| **State Management** | Zustand + TanStack Query |
| **Styling** | TailwindCSS v4 |
| **Icons** | Lucide React |

---

## 🚦 Getting Started

### 1. Requirements
- Node.js 20+
- Cloudflare Account (Wrangler CLI)
- Clerk Account

### 2. Installation
```bash
# Clone the repository
git clone [repository-url]

# Setup Backend
cd backend
npm install
# Deploy/Init D1
npx wrangler d1 execute nandini_db --file=schema.sql

# Setup Frontend
cd ../frontend
npm install
```

### 3. Configuration
Create a `.env` file in the `frontend/` directory:
```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
```

### 4. Development
```bash
# Run Backend (Terminal 1)
cd backend
npm run dev

# Run Frontend (Terminal 2)
cd frontend
npm run dev
```

---

## 📂 Project Structure

```text
Nandini-Milk-System/
├── backend/                ← Cloudflare Worker (Hono API)
│   ├── src/                ← API Logic & Endpoints
│   └── schema.sql          ← D1 Database Schema
├── frontend/
│   ├── public/             ← Static Assets
│   └── src/
│       ├── components/     ← Reusable UI Components
│       ├── lib/            ← Worker API Client & Hooks (useData.js)
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
