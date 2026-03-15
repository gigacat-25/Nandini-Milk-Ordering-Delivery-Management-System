import { Navigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { useEffect } from 'react'
import { upsertUser, useUserProfile } from '../lib/useData'

export function ProtectedRoute({ children, adminOnly = false, deliveryOnly = false }) {
    const { isLoaded, isSignedIn, user } = useUser()
    const { data: profile, loading: profileLoading } = useUserProfile(user?.id)

    useEffect(() => {
        if (isSignedIn && user) {
            upsertUser(user)
        }
    }, [isSignedIn, user])

    if (!isLoaded || (isSignedIn && profileLoading)) return <div style={{ display: 'grid', placeItems: 'center', height: '100vh', color: '#64748b', fontWeight: 500 }}>Loading app...</div>

    if (!isSignedIn) return <Navigate to="/auth" replace />

    const isAdmin = profile?.role === 'admin' || user?.publicMetadata?.role === 'admin' || user?.primaryEmailAddress?.emailAddress === 'thejaswinp6@gmail.com'
    const isDelivery = profile?.role === 'delivery' || user?.publicMetadata?.role === 'delivery' || user?.primaryEmailAddress?.emailAddress === 'delivery@nandini.com'

    if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />

    // Delivery portal is strictly for delivery personnel or admins
    if (deliveryOnly && !isDelivery && !isAdmin) return <Navigate to="/dashboard" replace />

    // Block delivery personnel from entering the customer dashboard
    if (!adminOnly && !deliveryOnly && isDelivery && !isAdmin) return <Navigate to="/delivery" replace />

    return children
}

export function PublicRoute({ children }) {
    const { isLoaded, isSignedIn, user } = useUser()
    const { data: profile, loading: profileLoading } = useUserProfile(user?.id)

    useEffect(() => {
        if (isSignedIn && user) {
            upsertUser(user)
        }
    }, [isSignedIn, user])

    if (!isLoaded || (isSignedIn && profileLoading)) return <div style={{ display: 'grid', placeItems: 'center', height: '100vh', color: '#64748b', fontWeight: 500 }}>Loading app...</div>

    if (isSignedIn) {
        const isAdmin = profile?.role === 'admin' || user?.publicMetadata?.role === 'admin' || user?.primaryEmailAddress?.emailAddress === 'thejaswinp6@gmail.com'
        const isDelivery = profile?.role === 'delivery' || user?.publicMetadata?.role === 'delivery' || user?.primaryEmailAddress?.emailAddress === 'delivery@nandini.com'

        if (isAdmin) return <Navigate to="/admin" replace />
        if (isDelivery) return <Navigate to="/delivery" replace />
        return <Navigate to="/dashboard" replace />
    }

    return children
}
