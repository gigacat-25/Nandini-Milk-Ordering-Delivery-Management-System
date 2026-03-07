import { useState, useEffect } from 'react'
import { CheckCircle, Lock, ShieldCheck, CreditCard } from 'lucide-react'
import { useUser } from '@clerk/clerk-react'
import { supabase } from '../lib/supabase'
import { renewAppAccess } from '../lib/useData'
import toast from 'react-hot-toast'
import { formatCurrency } from '../lib/utils'

export default function AppAccessGuard({ children }) {
    const { user, isLoaded } = useUser()
    const [accessData, setAccessData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [paying, setPaying] = useState(false)

    const fetchAccess = async () => {
        if (!user) return
        try {
            const { data, error } = await supabase
                .from('users')
                .select('app_fee_expiry')
                .eq('id', user.id)
                .single()

            if (error && error.code !== 'PGRST116') throw error
            setAccessData(data || {})
        } catch (err) {
            console.error('Failed to check app access', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (isLoaded && user) {
            fetchAccess()
        } else if (isLoaded) {
            setLoading(false)
        }
    }, [isLoaded, user])

    async function handlePayment() {
        if (!user) return
        setPaying(true)
        try {
            // Simulate payment delay
            await new Promise(r => setTimeout(r, 1500))
            await renewAppAccess(user.id)
            toast.success('App subscription renewed! Thank you.')
            await fetchAccess() // Refresh local state
            window.location.reload() // Force a hard refresh to re-mount dashboard
        } catch (err) {
            toast.error('Failed to process payment. Please try again.')
        } finally {
            setPaying(false)
        }
    }

    if (!isLoaded || loading) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#64748b' }}>Checking access...</div>

    // If clerk user doesn't exist here for some reason, let the ProtectedRoute handle the redirect.
    if (!user) return children

    // Admins bypass the paywall
    const isAdmin = user?.publicMetadata?.role === 'admin' || user?.primaryEmailAddress?.emailAddress === 'thejaswinp6@gmail.com'
    if (isAdmin) return children

    const now = new Date()
    const expiry = accessData?.app_fee_expiry ? new Date(accessData.app_fee_expiry) : null

    // Status states
    const isExpired = !expiry || expiry < now
    const daysLeft = expiry ? Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)) : 0
    const expiringSoon = !isExpired && daysLeft <= 3

    return (
        <>
            {/* Soft Warning Banner (if nearing expiry) */}
            {expiringSoon && (
                <div style={{ background: '#fef3c7', color: '#b45309', padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: 600, borderBottom: '1px solid #fde68a' }}>
                    ⚠️ Your app access subscription expires in {daysLeft} day(s). Renew soon to avoid interruption!
                </div>
            )}

            {/* The actual children routes */}
            {children}

            {/* Hard Block Paywall (if expired) */}
            {isExpired && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)',
                    zIndex: 9999, display: 'grid', placeItems: 'center', padding: '1.5rem',
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <div className="card" style={{ maxWidth: 440, width: '100%', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'linear-gradient(90deg, #2563eb, #7c3aed)' }} />

                        <div style={{ width: 64, height: 64, background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#0f172a' }}>
                            <Lock size={32} />
                        </div>

                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                            Subscription Required
                        </h2>
                        <p style={{ color: '#64748b', fontSize: '0.9375rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                            Your app access subscription has expired or hasn't been activated. Pay the monthly fee to unlock the store, delivery tracking, and all premium features.
                        </p>

                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem', textAlign: 'left' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <span style={{ fontWeight: 600, color: '#0f172a' }}>Monthly App Access</span>
                                <span style={{ fontWeight: 800, color: '#2563eb', fontSize: '1.25rem' }}>₹150</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {['Access to all fresh dairy products', 'Manage daily subscriptions', 'Track real-time drops', 'Priority customer support'].map(f => (
                                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#475569' }}>
                                        <CheckCircle size={14} color="#059669" /> {f}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            className="btn-primary"
                            style={{ width: '100%', justifyContent: 'center', padding: '0.875rem', fontSize: '1rem' }}
                            onClick={handlePayment}
                            disabled={paying}
                        >
                            {paying ? 'Processing Payment...' : (
                                <>
                                    <CreditCard size={18} /> Pay ₹150 Now
                                </>
                            )}
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                            <ShieldCheck size={14} /> Secured by Razorpay
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
