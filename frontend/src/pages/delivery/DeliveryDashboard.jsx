import { useState, useMemo } from 'react'
import { CheckCircle, MapPin, Phone, MessageSquare, ExternalLink } from 'lucide-react'
import { useSubscriptions, useCustomers, useSubscriptionPauses } from '../../lib/useData'
import DeliveryNavbar from '../../components/DeliveryNavbar'
import toast from 'react-hot-toast'

export default function DeliveryDashboard() {
    const { data: subscriptions, loading: subsLoading } = useSubscriptions()
    const { data: customers, loading: custLoading } = useCustomers()
    const [date, setDate] = useState(() => {
        // Default to tomorrow since deliveries are usually prepped the night before
        return new Date(Date.now() + 86400000).toISOString().split('T')[0]
    })
    const { data: pauses, loading: pausesLoading } = useSubscriptionPauses(date)
    const [deliveredIds, setDeliveredIds] = useState(new Set()) // Local state for demo purposes

    // Generate daily delivery sheet on the fly
    const deliveries = useMemo(() => {
        if (!subscriptions || !customers) return []

        const activeSubs = subscriptions.filter(s => {
            if (s.status !== 'active') return false
            const isPaused = pauses?.some(p => p.subscription_id === s.id && p.pause_date === date)
            return !isPaused
        })

        return activeSubs.map(sub => {
            const customer = customers.find(c => c.id === sub.customer_id)
            return {
                id: sub.id,
                customer: customer?.full_name || 'Unknown',
                address: customer?.address || 'Address not provided',
                phone: customer?.phone || 'N/A',
                google_maps: customer?.google_maps_url,
                instructions: customer?.delivery_instructions,
                items: `${sub.quantity}x ${sub.products?.name} (${sub.products?.size_label}) [${sub.delivery_slot}]`,
                status: deliveredIds.has(sub.id) ? 'delivered' : 'pending'
            }
        })
    }, [subscriptions, customers, deliveredIds, pauses, date])

    function markDelivered(id) {
        setDeliveredIds(prev => {
            const next = new Set(prev)
            next.add(id)
            return next
        })
        toast.success('Marked as delivered')
    }

    const pending = deliveries.filter(d => d.status === 'pending').length
    const delivered = deliveries.filter(d => d.status === 'delivered').length

    if (subsLoading || custLoading || pausesLoading) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', color: '#64748b' }}>Loading deliveries...</div>

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
            <DeliveryNavbar />
            <div style={{ maxWidth: 800, margin: '0 auto', padding: '1.5rem 1rem' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Driver Route</h1>
                        <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>Your active run sheet.</p>
                    </div>
                    <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: 'auto', padding: '0.5rem', fontSize: '0.875rem' }} />
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <div className="card" style={{ flex: 1, textAlign: 'center', padding: '0.75rem' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563eb' }}>{deliveries.length}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total</div>
                    </div>
                    <div className="card" style={{ flex: 1, textAlign: 'center', padding: '0.75rem' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f59e0b' }}>{pending}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Pending</div>
                    </div>
                    <div className="card" style={{ flex: 1, textAlign: 'center', padding: '0.75rem' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>{delivered}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Done</div>
                    </div>
                </div>

                {/* Delivery Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {deliveries.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.875rem' }}>
                            No deliveries scheduled for this date.
                        </div>
                    ) : deliveries.map((d, idx) => (
                        <div key={d.id} className="card fade-in" style={{
                            padding: '1rem',
                            display: 'flex', flexDirection: 'column', gap: '0.75rem',
                            opacity: d.status === 'delivered' ? 0.7 : 1,
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{
                                        width: 32, height: 32, borderRadius: '50%', background: d.status === 'delivered' ? '#d1fae5' : '#dbeafe',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 700, color: d.status === 'delivered' ? '#059669' : '#2563eb', flexShrink: 0, fontSize: '0.875rem',
                                    }}>
                                        {d.status === 'delivered' ? <CheckCircle size={14} /> : idx + 1}
                                    </div>
                                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>{d.customer}</div>
                                </div>
                                {d.google_maps && (
                                    <a href={d.google_maps} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: '#2563eb', padding: '0.25rem 0.5rem', background: '#eff6ff', borderRadius: 20, display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none', fontWeight: 600 }}>
                                        <ExternalLink size={12} /> Directions
                                    </a>
                                )}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                <span style={{ fontSize: '0.8125rem', color: '#475569', display: 'flex', alignItems: 'flex-start', gap: '0.35rem' }}>
                                    <MapPin size={14} style={{ flexShrink: 0, marginTop: 2, color: '#94a3b8' }} />
                                    <span>{d.address}</span>
                                </span>
                                <span style={{ fontSize: '0.8125rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <Phone size={14} style={{ color: '#94a3b8' }} /> {d.phone}
                                </span>
                            </div>

                            {d.instructions && (
                                <div style={{ fontSize: '0.8125rem', color: '#b45309', display: 'flex', alignItems: 'flex-start', gap: '0.35rem', background: '#fffbeb', padding: '0.5rem', borderRadius: 8, border: '1px solid #fef3c7' }}>
                                    <MessageSquare size={14} style={{ marginTop: 1, flexShrink: 0 }} /> {d.instructions}
                                </div>
                            )}

                            <div style={{ fontSize: '0.875rem', color: '#0f172a', fontWeight: 600, padding: '0.5rem', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                                📦 {d.items}
                            </div>

                            {d.status === 'delivered' ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '0.5rem', background: '#f0fdf4', color: '#166534', borderRadius: 8, fontWeight: 600, fontSize: '0.875rem' }}>
                                    <CheckCircle size={16} style={{ marginRight: '0.35rem' }} /> Delivered Successfully
                                </div>
                            ) : (
                                <button
                                    className="btn-primary"
                                    onClick={() => markDelivered(d.id)}
                                    style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '0.9rem' }}
                                >
                                    <CheckCircle size={16} /> Mark as Delivered
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
