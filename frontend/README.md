# 🍦 Nandini Milk Management (Frontend)

This is the React 19 / Vite application that powers the Nandini Milk Ordering & Delivery Management System.

## 🛠 Features

- **Customer Dashboard**: Subscriptions, wallet top-ups, and one-off orders.
- **Admin Panel**: Unified delivery console, customer management, and sales analytics.
- **Driver Portal**: Route Sheets, slot filtering, and mobile photo capture (Proof of Delivery).

## 🚀 Development

```bash
# Install dependencies
npm install

# Start the dev server with HMR
npm run dev

# Build for production
npm run build
```

## 🏗 Key Components

- **`lib/useData.js`**: Core TanStack Query hooks for real-time data sync with Supabase.
- **`pages/admin/AdminDelivery.jsx`**: The consolidated delivery management hub (with slot and partial skip logic).
- **`pages/delivery/DeliveryDashboard.jsx`**: Driver-facing route dashboard with active session locks.
- **`components/Navbar.jsx` & `DeliveryNavbar.jsx`**: Role-based navigation headers.

## 📦 Tech Stack Detail

- **Framework**: React 19
- **Build Tool**: Vite 7
- **Styling**: TailwindCSS v4
- **Persistence**: Supabase (via PostgreSQL RLS)
- **Auth**: Clerk
- **State**: Zustand (global) & TanStack Query (server state)

*Refer to the [root README](../README.md) for full project documentation and environment setup.*
