import { Navigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'

export function ProtectedRoute({ children, adminOnly = false }) {
    const { isLoaded, isSignedIn, user } = useUser()

    if (!isLoaded) return <div style={{ display: 'grid', placeItems: 'center', height: '100vh', color: '#64748b', fontWeight: 500 }}>Loading app...</div>

    if (!isSignedIn) return <Navigate to="/auth" replace />

    // Temporary logic: any user with "admin" in their email or role=admin in metadata is an admin
    const isAdmin = user?.publicMetadata?.role === 'admin' || user?.primaryEmailAddress?.emailAddress?.includes('admin')

    if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />

    return children
}

export function PublicRoute({ children }) {
    const { isLoaded, isSignedIn, user } = useUser()

    if (!isLoaded) return <div style={{ display: 'grid', placeItems: 'center', height: '100vh', color: '#64748b', fontWeight: 500 }}>Loading app...</div>

    if (isSignedIn) {
        const isAdmin = user?.publicMetadata?.role === 'admin' || user?.primaryEmailAddress?.emailAddress?.includes('admin')
        return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />
    }

    return children
}
