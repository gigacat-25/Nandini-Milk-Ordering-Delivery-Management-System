# 🥛 Nandini Milk Ordering & Delivery Management System

A modern, full-stack milk delivery management platform for the Nandini Milk Store, Vaderhalli, Bengaluru.

## Features

### Customer Portal
- 📱 Phone / Email + OTP authentication
- 🛍️ Browse and order Nandini milk, curd, and ghee
- 🔁 Create daily subscription orders
- ⏸️ Pause / resume subscriptions for specific dates
- 📅 View upcoming deliveries
- 💳 Monthly billing summary + UPI payment
- 📜 Full order history

### Admin Dashboard
- 📊 Stats: tomorrow's stock requirement, active customers, revenue
- 📦 Order management with status updates
- 👥 Customer management with profiles
- 📋 Product CRUD with pricing and stock
- 🚚 Daily delivery list with mark-delivered + CSV export
- 📈 Sales analytics with charts

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Styling | TailwindCSS v4 |
| Routing | React Router v6 |
| State | Zustand |
| Charts | Recharts |
| Icons | Lucide React |
| **Database** | **Supabase (PostgreSQL)** |
| **Auth** | Supabase Auth (OTP/Password) |
| Payments | Razorpay (UPI) |

---

## Getting Started

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Supabase Environment Variables
Copy the `.env.example` file to a new `.env` file in the `frontend/` directory:
```bash
cp frontend/.env.example frontend/.env
```
Add your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the `.env` file from your Supabase dashboard.

### 3. Set Up Supabase Database
Run the provided SQL file in your Supabase SQL Editor to create tables, enable RLS, and seed the initial products:
```text
supabase/migrations/001_initial_schema.sql
```

### 4. Run the App
```bash
npm run dev
# Opens at http://localhost:5173
```

---

## Demo Login

On the login page:
1. Enter any phone number → click **Send OTP**
2. Enter OTP: **`1234`**
3. ✅ Check **"Log in as Admin"** to test the admin dashboard

---

## Project Structure

```
Nandini-Milk-Ordering-Delivery-Management-System/
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  ← Database schema and RLS policies
├── frontend/
│   └── src/
│       ├── components/         ← Navbar, Modal, ProductCard, StatsCard
│       ├── pages/
│       │   ├── LandingPage.jsx
│       │   ├── AuthPage.jsx
│       │   ├── customer/       ← Dashboard, Products, Order, Subscriptions, Billing
│       │   └── admin/          ← Dashboard, Orders, Customers, Products, Delivery, Analytics
│       ├── store/              ← Zustand (auth + cart)
│       └── lib/
│           ├── supabase.js     ← Supabase client initialization
│           ├── mockData.js     ← Fallback demo data
│           └── utils.js        ← Formatting helpers
```

---

## Production Deployment

### Vercel (Recommended)
```bash
cd frontend
npx vercel --prod
# Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to Vercel environment variables
```

---

## License

MIT © 2026 Nandini Milk Store, Vaderhalli, Bengaluru
