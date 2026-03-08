import { useState, useMemo } from 'react'
import { CheckCircle, MapPin, Phone, MessageSquare, ExternalLink, Loader2, Lock } from 'lucide-react'
import { useSubscriptions, useCustomers, useSubscriptionPauses, useOrdersByDate, useDeliveries, markOrderDelivered, markSubscriptionDelivered, useDeliverySession } from '../../lib/useData'
import DeliveryNavbar from '../../components/DeliveryNavbar'
import toast from 'react-hot-toast'

export default function DeliveryDashboard() {
    const { data: subscriptions, loading: subsLoading } = useSubscriptions()
    const { data: customers, loading: custLoading } = useCustomers()
    const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
    const [activeSlot, setActiveSlot] = useState('morning')
    const { data: pauses, loading: pausesLoading } = useSubscriptionPauses(date)
    const { data: orders, loading: ordersLoading, refetch: refetchOrders } = useOrdersByDate(date)
    const { data: completedDeliveries, loading: compLoading, refetch: refetchComp } = useDeliveries(date)
    const { data: deliverySession } = useDeliverySession(date, activeSlot)

    const [updatingId, setUpdatingId] = useState(null)
    const isSessionActive = !!deliverySession

    // Generate daily delivery sheet on the fly
    // Generate daily delivery sheet combining recurring subscriptions and one-off orders
    const deliveries = useMemo(() => {
        if (!subscriptions || !customers || !orders || !completedDeliveries) return []

        // 1. Process Subscriptions
        const activeSubs = subscriptions.filter(s => {
            if (s.status !== 'active') return false

            // Enforce cutoff: don't show subscriptions created after the cutoff for this target date
            const subCreated = new Date(s.created_at)
            const targetDate = new Date(date)
            let cutoffTime = new Date(targetDate)

            if (s.delivery_slot === 'morning') {
                // Morning cutoff is 3:30 PM the day before
                cutoffTime.setDate(cutoffTime.getDate() - 1)
                cutoffTime.setHours(15, 30, 0, 0)
            } else {
                // Evening cutoff is 7:30 AM the same day
                cutoffTime.setHours(7, 30, 0, 0)
            }

            if (subCreated >= cutoffTime) return false

            const isPaused = pauses?.some(p => p.subscription_id === s.id && p.pause_date === date)
            return !isPaused
        }).map(sub => {
            const customer = customers.find(c => c.id === sub.customer_id)
            const isDelivered = completedDeliveries.some(d => d.subscription_id === sub.id)

            const subItemsStr = sub.items?.map(i => `${i.quantity}x ${i.products?.name}`).join(', ') || 'No Items'
            const subAmount = sub.items?.reduce((sum, i) => sum + (i.price_at_time * i.quantity), 0) || 0

            const hasFunds = (customer?.wallet_balance || 0) >= subAmount
            let status = isDelivered ? 'delivered' : 'pending'
            if (!hasFunds && !isDelivered) status = 'insufficient_funds'

            return {
                id: sub.id,
                type: 'subscription',
                customerId: sub.customer_id,
                customer: customer?.full_name || 'Unknown',
                address: customer?.address || 'Address not provided',
                phone: customer?.phone || 'N/A',
                google_maps: customer?.google_maps_url,
                instructions: customer?.delivery_instructions,
                items: `${subItemsStr} [${sub.delivery_slot}]`,
                amount: subAmount,
                status
            }
        })

        // 2. Process One-Off Orders
        const orderDeliveries = orders.map(order => {
            const customer = order.users
            const itemsStr = order.items?.map(i => `${i.quantity}x ${i.products?.name}`).join(', ')

            return {
                id: order.id,
                type: 'order',
                customerId: order.customer_id,
                customer: customer?.full_name || 'Unknown',
                address: customer?.address || 'Address not provided',
                phone: customer?.phone || 'N/A',
                google_maps: customer?.google_maps_url,
                instructions: customer?.delivery_instructions,
                items: `${itemsStr} [${order.delivery_slot}]`,
                status: order.status === 'delivered' ? 'delivered' : 'pending'
            }
        })

        return [...activeSubs, ...orderDeliveries]
    }, [subscriptions, customers, pauses, orders, completedDeliveries, date])

    async function handleMarkDelivered(d) {
        setUpdatingId(d.id)
        try {
            if (d.type === 'order') {
                await markOrderDelivered(d.id)
                await refetchOrders()
            } else {
                await markSubscriptionDelivered(d.customerId, d.id, date, d.amount)
                await refetchComp()
            }
            toast.success('Marked as delivered')
        } catch (err) {
            console.error(err)
            toast.error('Failed to mark delivered: ' + err.message)
        } finally {
            setUpdatingId(null)
        }
    }

    const pending = deliveries.filter(d => d.status === 'pending').length
    const delivered = deliveries.filter(d => d.status === 'delivered').length

    if (subsLoading || custLoading || pausesLoading || ordersLoading || compLoading) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', color: '#64748b' }}><Loader2 className="spin" size={32} /></div>

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
            <DeliveryNavbar />
            <div style={{ maxWidth: 800, margin: '0 auto', padding: '1.5rem 1rem' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Driver Route</h1>
                        <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>Your active run sheet.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <select
                            className="input"
                            value={activeSlot}
                            onChange={e => setActiveSlot(e.target.value)}
                            style={{ width: 'auto', fontSize: '0.875rem', padding: '0.5rem' }}
                        >
                            <option value="morning">🌅 Morning</option>
                            <option value="evening">🌆 Evening</option>
                        </select>
                        <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: 'auto', padding: '0.5rem', fontSize: '0.875rem' }} />
                    </div>
                </div>

                {/* Session status banner */}
                <div style={{
                    padding: '0.75rem 1rem',
                    background: isSessionActive ? '#f0fdf4' : '#fef2f2',
                    border: `1px solid ${isSessionActive ? '#86efac' : '#fecaca'}`,
                    borderRadius: 10,
                    marginBottom: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: isSessionActive ? '#166534' : '#991b1b'
                }}>
                    {isSessionActive
                        ? <><CheckCircle size={16} /> Run is active — you can mark deliveries as complete.</>
                        : <><Lock size={16} /> Delivery locked. Waiting for admin to start the run.</>}
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
                                        width: 32, height: 32, borderRadius: '50%', background: d.status === 'delivered' ? '#d1fae5' : d.status === 'insufficient_funds' ? '#fee2e2' : '#dbeafe',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 700, color: d.status === 'delivered' ? '#059669' : d.status === 'insufficient_funds' ? '#dc2626' : '#2563eb', flexShrink: 0, fontSize: '0.875rem',
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
                            ) : d.status === 'insufficient_funds' ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '0.5rem', background: '#fee2e2', color: '#dc2626', borderRadius: 8, fontWeight: 600, fontSize: '0.875rem' }}>
                                    Insufficient Funds (₹{d.amount})
                                </div>
                            ) : !isSessionActive ? (
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', padding: '0.6rem', background: '#f1f5f9', color: '#94a3b8', borderRadius: 8, fontWeight: 600, fontSize: '0.8125rem' }}>
                                    <Lock size={14} /> Locked — waiting for admin
                                </div>
                            ) : (
                                <button
                                    className="btn-primary"
                                    onClick={() => handleMarkDelivered(d)}
                                    disabled={updatingId === d.id}
                                    style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '0.9rem' }}
                                >
                                    {updatingId === d.id ? <Loader2 size={16} className="spin" /> : <CheckCircle size={16} />}
                                    {updatingId === d.id ? 'Saving...' : 'Mark as Delivered'}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
