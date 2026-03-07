import { Navigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { useEffect } from 'react'
import { upsertUser } from '../lib/useData'

export function ProtectedRoute({ children, adminOnly = false }) {
    const { isLoaded, isSignedIn, user } = useUser()

    useEffect(() => {
        if (isSignedIn && user) {
            upsertUser(user)
        }
    }, [isSignedIn, user])

    if (!isLoaded) return <div style={{ display: 'grid', placeItems: 'center', height: '100vh', color: '#64748b', fontWeight: 500 }}>Loading app...</div>

    if (!isSignedIn) return <Navigate to="/auth" replace />

    // The specified admin email
    const isAdmin = user?.publicMetadata?.role === 'admin' || user?.primaryEmailAddress?.emailAddress === 'thejaswinp6@gmail.com'

    if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />

    return children
}

export function PublicRoute({ children }) {
    const { isLoaded, isSignedIn, user } = useUser()

    useEffect(() => {
        if (isSignedIn && user) {
            upsertUser(user)
        }
    }, [isSignedIn, user])

    if (!isLoaded) return <div style={{ display: 'grid', placeItems: 'center', height: '100vh', color: '#64748b', fontWeight: 500 }}>Loading app...</div>

    if (isSignedIn) {
        const isAdmin = user?.publicMetadata?.role === 'admin' || user?.primaryEmailAddress?.emailAddress === 'thejaswinp6@gmail.com'
        return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />
    }

    return children
}
