import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Pages
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'

// Customer
import CustomerDashboard from './pages/customer/CustomerDashboard'
import ProductsPage from './pages/customer/ProductsPage'
import OrderPage from './pages/customer/OrderPage'
import SubscriptionsPage from './pages/customer/SubscriptionsPage'
import BillingPage from './pages/customer/BillingPage'
import ProfilePage from './pages/customer/ProfilePage'

// Admin
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminOrders from './pages/admin/AdminOrders'
import AdminCustomers from './pages/admin/AdminCustomers'
import AdminProducts from './pages/admin/AdminProducts'
import AdminDelivery from './pages/admin/AdminDelivery'
import AdminAnalytics from './pages/admin/AdminAnalytics'

// Delivery
import DeliveryDashboard from './pages/delivery/DeliveryDashboard'

// Route Guards
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute'
import AppAccessGuard from './components/AppAccessGuard'

export default function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { borderRadius: '10px', background: '#1e293b', color: '#f8fafc', fontSize: '0.875rem' },
          success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />
        <Route path="/products" element={<ProductsPage />} />

        {/* Customer Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><AppAccessGuard><CustomerDashboard /></AppAccessGuard></ProtectedRoute>} />
        <Route path="/order" element={<ProtectedRoute><AppAccessGuard><OrderPage /></AppAccessGuard></ProtectedRoute>} />
        <Route path="/subscriptions" element={<ProtectedRoute><AppAccessGuard><SubscriptionsPage /></AppAccessGuard></ProtectedRoute>} />
        <Route path="/billing" element={<ProtectedRoute><AppAccessGuard><BillingPage /></AppAccessGuard></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><AppAccessGuard><ProfilePage /></AppAccessGuard></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/orders" element={<ProtectedRoute adminOnly><AdminOrders /></ProtectedRoute>} />
        <Route path="/admin/customers" element={<ProtectedRoute adminOnly><AdminCustomers /></ProtectedRoute>} />
        <Route path="/admin/products" element={<ProtectedRoute adminOnly><AdminProducts /></ProtectedRoute>} />
        <Route path="/admin/delivery" element={<ProtectedRoute adminOnly><AdminDelivery /></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute adminOnly><AdminAnalytics /></ProtectedRoute>} />

        {/* Delivery Routes */}
        <Route path="/delivery" element={<ProtectedRoute deliveryOnly><DeliveryDashboard /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}
