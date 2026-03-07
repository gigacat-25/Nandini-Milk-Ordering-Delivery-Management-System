import { useState, useEffect } from 'react'
import { Save, MapPin, Navigation, Info } from 'lucide-react'
import { useUser } from '@clerk/clerk-react'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'
import toast from 'react-hot-toast'

export default function ProfilePage() {
    const { user, isLoaded } = useUser()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
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

    if (!isLoaded || loading) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', color: '#64748b' }}>Loading profile...</div>

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
