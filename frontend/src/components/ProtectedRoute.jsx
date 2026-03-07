import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store'

export function ProtectedRoute({ children, adminOnly = false }) {
    const { user, isAdmin } = useAuthStore()
    if (!user) return <Navigate to="/auth" replace />
    if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />
    return children
}

export function PublicRoute({ children }) {
    const { user, isAdmin } = useAuthStore()
    if (user) return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />
    return children
}
