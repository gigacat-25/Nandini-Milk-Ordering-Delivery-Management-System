import { useState, useEffect } from 'react'
import { Save, MapPin, Navigation, Info } from 'lucide-react'
import { useUser } from '@clerk/clerk-react'
import { supabase } from '../../lib/supabase'
import { renewAppAccess, useUserProfile } from '../../lib/useData'
import Navbar from '../../components/Navbar'
import toast from 'react-hot-toast'
import { formatCurrency } from '../../lib/utils'

export default function ProfilePage() {
    const { user, isLoaded } = useUser()
    const { data: userProfile, refetch: refetchProfile } = useUserProfile(user?.id)

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [paying, setPaying] = useState(false)
    const [profile, setProfile] = useState({
        address: '',
        delivery_instructions: '',
        google_maps_url: '',
        phone: ''
    })

    useEffect(() => {
        if (!isLoaded || !user) return

        async function fetchProfile() {
            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('address, delivery_instructions, google_maps_url, phone')
                    .eq('id', user.id)
                    .single()

                if (error && error.code !== 'PGRST116') throw error // Ignore 'no row' error on first load

                if (data) {
                    setProfile({
                        address: data.address || '',
                        delivery_instructions: data.delivery_instructions || '',
                        google_maps_url: data.google_maps_url || '',
                        phone: data.phone || user.primaryPhoneNumber?.phoneNumber || ''
                    })
                } else {
                    setProfile(prev => ({ ...prev, phone: user.primaryPhoneNumber?.phoneNumber || '' }))
                }
            } catch (err) {
                console.error('Error fetching profile:', err)
                toast.error('Failed to load profile details')
            } finally {
                setLoading(false)
            }
        }

        fetchProfile()
    }, [isLoaded, user])

    async function handleSave(e) {
        e.preventDefault()
        if (!user) return

        setSaving(true)
        try {
            const { error } = await supabase
                .from('users')
                .update({
                    address: profile.address,
                    delivery_instructions: profile.delivery_instructions,
                    google_maps_url: profile.google_maps_url,
                    phone: profile.phone
                })
                .eq('id', user.id)

            if (error) throw error
            toast.success('Delivery details saved successfully!')
        } catch (err) {
            console.error('Error saving profile:', err)
            toast.error('Failed to save details: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    async function handlePayment() {
        if (!user) return
        setPaying(true)
        try {
            await new Promise(r => setTimeout(r, 1500))
            await renewAppAccess(user.id)
            toast.success('App subscription renewed successfully!')
            refetchProfile()
        } catch (err) {
            toast.error('Failed to process payment. Please try again.')
        } finally {
            setPaying(false)
        }
    }

    if (!isLoaded || loading) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', color: '#64748b' }}>Loading profile...</div>

    const expiry = userProfile?.app_fee_expiry ? new Date(userProfile.app_fee_expiry) : null
    const isExpired = !expiry || expiry < new Date()
    const daysLeft = expiry ? Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24)) : 0

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
            <Navbar />
            <div style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1.5rem' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem' }}>Delivery Settings</h1>
                    <p style={{ color: '#64748b', margin: 0, fontSize: '0.9375rem' }}>
                        Help us find your location easily for daily morning deliveries.
                    </p>
                </div>

                {/* Subscriptions Section */}
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', margin: '0 0 1rem' }}>Monthly App Access</h2>

                    <div style={{ background: isExpired ? '#fee2e2' : '#f0fdf4', padding: '1.25rem', borderRadius: 12, border: '1px solid', borderColor: isExpired ? '#fca5a5' : '#86efac', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <div style={{ fontWeight: 700, color: isExpired ? '#b91c1c' : '#166534', fontSize: '1.05rem', marginBottom: '0.25rem' }}>
                                {isExpired ? '❌ Subscription Required' : '✅ Active Subscription'}
                            </div>
                            <div style={{ color: isExpired ? '#991b1b' : '#15803d', fontSize: '0.875rem' }}>
                                {isExpired
                                    ? 'Pay ₹150 to unlock daily milk subscriptions and free one-time deliveries.'
                                    : `Your access is valid for ${daysLeft} more days. Free delivery enabled.`}
                            </div>
                        </div>

                        <button
                            className="btn-primary"
                            onClick={handlePayment}
                            disabled={paying}
                            style={{
                                background: isExpired ? '#2563eb' : 'white',
                                color: isExpired ? 'white' : '#2563eb',
                                border: isExpired ? 'none' : '1px solid #2563eb',
                                padding: '0.6rem 1.2rem',
                                opacity: paying ? 0.7 : 1
                            }}
                        >
                            {paying ? 'Processing...' : isExpired ? `Pay ₹150` : 'Renew for ₹150'}
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSave} className="card">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div>
                            <label className="label"><MapPin size={14} style={{ display: 'inline', marginRight: 6 }} />Full Address</label>
                            <textarea
                                className="input"
                                rows={3}
                                placeholder="House Number, Street, Landmark..."
                                value={profile.address}
                                onChange={e => setProfile({ ...profile, address: e.target.value })}
                                required
                                style={{ resize: 'vertical' }}
                            />
                        </div>

                        <div>
                            <label className="label"><Navigation size={14} style={{ display: 'inline', marginRight: 6 }} />Google Maps Link</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="url"
                                    className="input"
                                    placeholder="https://maps.google.com/..."
                                    value={profile.google_maps_url}
                                    onChange={e => setProfile({ ...profile, google_maps_url: e.target.value })}
                                    style={{ paddingLeft: '2.5rem' }}
                                />
                                <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>📍</div>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Info size={12} /> Drop a pin in Google Maps and paste the share link here.
                            </p>
                        </div>

                        <div>
                            <label className="label">Delivery Instructions (Optional)</label>
                            <textarea
                                className="input"
                                rows={2}
                                placeholder="E.g., Leave the packet in the blue bag hanging on the gate."
                                value={profile.delivery_instructions}
                                onChange={e => setProfile({ ...profile, delivery_instructions: e.target.value })}
                                style={{ resize: 'vertical' }}
                            />
                        </div>

                        <div>
                            <label className="label">Contact Phone</label>
                            <input
                                type="tel"
                                className="input"
                                placeholder="+91..."
                                value={profile.phone}
                                onChange={e => setProfile({ ...profile, phone: e.target.value })}
                            />
                        </div>

                        <div style={{ borderTop: '1px solid #e2e8f0', margin: '0.5rem -1.5rem 0', padding: '1.5rem 1.5rem 0' }}>
                            <button type="submit" className="btn-primary" disabled={saving} style={{ width: '100%', justifyContent: 'center' }}>
                                <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
