import { useState, useMemo } from 'react'
import { Download, CheckCircle, MapPin, Phone, MessageSquare, ExternalLink, Loader2, PlayCircle, StopCircle, RotateCcw } from 'lucide-react'
import { useSubscriptions, useCustomers, useSubscriptionPauses, useOrdersByDate, useDeliveries, markOrderDelivered, markSubscriptionDelivered, unmarkOrderDelivered, unmarkSubscriptionDelivered, useDeliverySession, startDeliverySession, endDeliverySession } from '../../lib/useData'
import Navbar from '../../components/Navbar'
import toast from 'react-hot-toast'
import { formatCurrency } from '../../lib/utils'
import { useUser } from '@clerk/clerk-react'

export default function AdminDelivery() {
    const { user } = useUser()
    const { data: subscriptions, loading: subsLoading } = useSubscriptions()
    const { data: customers, loading: custLoading } = useCustomers()
    const [date, setDate] = useState(newtoISOStringDate())
    const [activeSlot, setActiveSlot] = useState('morning')
    const { data: pauses, loading: pausesLoading } = useSubscriptionPauses(date)
    const { data: orders, loading: ordersLoading, refetch: refetchOrders } = useOrdersByDate(date)
    const { data: completedDeliveries, loading: compLoading, refetch: refetchComp } = useDeliveries(date)
    const { data: deliverySession, refetch: refetchSession } = useDeliverySession(date, activeSlot)

    const [updatingId, setUpdatingId] = useState(null)
    const [sessionLoading, setSessionLoading] = useState(false)
    const isSessionActive = !!deliverySession

    function newtoISOStringDate() {
        return new Date().toISOString().split('T')[0];
    }

    // Generate daily delivery sheet from active subscriptions and one-off orders
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
                amount: order.total_amount || 0,
                status: order.status === 'delivered' ? 'delivered' : 'pending'
            }
        })

        return [...activeSubs, ...orderDeliveries]
    }, [subscriptions, customers, pauses, orders, completedDeliveries, date])

    async function handleStartSession() {
        setSessionLoading(true)
        try {
            await startDeliverySession(date, activeSlot, user?.id)
            await refetchSession()
            toast.success(`🚚 ${activeSlot === 'morning' ? 'Morning' : 'Evening'} delivery run started! Delivery person can now mark items.`)
        } catch (err) {
            toast.error('Failed to start session: ' + err.message)
        } finally {
            setSessionLoading(false)
        }
    }

    async function handleEndSession() {
        setSessionLoading(true)
        try {
            await endDeliverySession(date, activeSlot)
            await refetchSession()
            toast.success('Delivery run ended. Marking is now locked.')
        } catch (err) {
            toast.error('Failed to end session: ' + err.message)
        } finally {
            setSessionLoading(false)
        }
    }

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

    async function handleUndoDelivery(d) {
        if (!confirm('Are you sure you want to undo this delivery? Any deducted funds will be refunded.')) return

        setUpdatingId(d.id)
        try {
            if (d.type === 'order') {
                await unmarkOrderDelivered(d.id)
                await refetchOrders()
            } else {
                await unmarkSubscriptionDelivered(d.customerId, d.id, date, d.amount)
                await refetchComp()
            }
            toast.success('Delivery reverted successfully')
        } catch (err) {
            console.error(err)
            toast.error('Failed to undo delivery: ' + err.message)
        } finally {
            setUpdatingId(null)
        }
    }

    function exportCSV() {
        const rows = [
            ['#', 'Customer', 'Address', 'Phone', 'Items', 'Amount', 'Status'],
            ...deliveries.map((d, i) => [i + 1, d.customer, d.address, d.phone, d.items, d.amount, d.status])
        ]
        const csv = rows.map(r => `"${r.join('","')}"`).join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = `delivery-${date}.csv`; a.click()
        toast.success('Delivery sheet exported!')
    }

    const pending = deliveries.filter(d => d.status === 'pending').length
    const delivered = deliveries.filter(d => d.status === 'delivered').length
    const totalAmt = deliveries.reduce((s, d) => s + d.amount, 0)

    if (subsLoading || custLoading || pausesLoading || ordersLoading || compLoading) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', color: '#64748b' }}><Loader2 className="spin" size={32} /></div>

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
            <Navbar />
            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 className="page-title">Daily Delivery Report</h1>
                        <p className="page-subtitle">Delivery schedule and route generated from active subscriptions.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: 'auto' }} />
                        <button className="btn-primary" onClick={exportCSV}><Download size={16} /> Export CSV</button>
                    </div>
                </div>

                {/* Delivery Run Control Panel */}
                <div style={{
                    padding: '1.25rem 1.5rem',
                    background: isSessionActive ? '#f0fdf4' : '#fff7ed',
                    border: `2px solid ${isSessionActive ? '#86efac' : '#fed7aa'}`,
                    borderRadius: 12,
                    marginBottom: '1.5rem',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.25rem' }}>{isSessionActive ? '🟢' : '🔴'}</span>
                            <span style={{ fontWeight: 800, fontSize: '1rem', color: isSessionActive ? '#166534' : '#92400e' }}>
                                {isSessionActive ? `${activeSlot === 'morning' ? 'Morning' : 'Evening'} Run — ACTIVE` : 'Delivery Locked'}
                            </span>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            {isSessionActive
                                ? 'Delivery person can now mark items as delivered.'
                                : 'Press "Start Run" to allow the delivery person to mark deliveries.'}
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <select
                            className="input"
                            value={activeSlot}
                            onChange={e => setActiveSlot(e.target.value)}
                            style={{ width: 'auto', paddingRight: '2rem' }}
                            disabled={isSessionActive}
                        >
                            <option value="morning">🌅 Morning Slot</option>
                            <option value="evening">🌆 Evening Slot</option>
                        </select>
                        {isSessionActive ? (
                            <button
                                onClick={handleEndSession}
                                disabled={sessionLoading}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem', opacity: sessionLoading ? 0.6 : 1 }}
                            >
                                {sessionLoading ? <Loader2 size={16} className="spin" /> : <StopCircle size={16} />}
                                End Run
                            </button>
                        ) : (
                            <button
                                onClick={handleStartSession}
                                disabled={sessionLoading}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', background: '#059669', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem', opacity: sessionLoading ? 0.6 : 1 }}
                            >
                                {sessionLoading ? <Loader2 size={16} className="spin" /> : <PlayCircle size={16} />}
                                Start Delivery Run
                            </button>
                        )}
                    </div>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                    {[
                        { label: 'Total Deliveries', value: deliveries.length, color: '#2563eb' },
                        { label: 'Pending', value: pending, color: '#f59e0b' },
                        { label: 'Delivered', value: delivered, color: '#059669' },
                        { label: 'Total Value', value: formatCurrency(totalAmt), color: '#7c3aed' },
                    ].map(s => (
                        <div key={s.label} className="card" style={{ textAlign: 'center', padding: '1rem' }}>
                            <div style={{ fontSize: '1.375rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                            <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Delivery Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    {deliveries.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                            No deliveries scheduled for this date. (Only active subscriptions are considered).
                        </div>
                    ) : deliveries.map((d, idx) => (
                        <div key={d.id} className="card fade-in" style={{
                            display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
                            opacity: d.status === 'delivered' ? 0.7 : 1,
                        }}>
                            {/* Number badge */}
                            <div style={{
                                width: 36, height: 36, borderRadius: '50%', background: d.status === 'delivered' ? '#d1fae5' : d.status === 'insufficient_funds' ? '#fee2e2' : '#dbeafe',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 700, color: d.status === 'delivered' ? '#059669' : d.status === 'insufficient_funds' ? '#dc2626' : '#2563eb', flexShrink: 0, fontSize: '0.875rem',
                            }}>
                                {d.status === 'delivered' ? <CheckCircle size={16} /> : idx + 1}
                            </div>

                            {/* Customer Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9375rem', marginBottom: '0.2rem' }}>{d.customer}</div>
                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '0.8125rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <MapPin size={12} /> {d.address}
                                    </span>
                                    <span style={{ fontSize: '0.8125rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <Phone size={12} /> {d.phone}
                                    </span>
                                    {d.google_maps && (
                                        <a href={d.google_maps} target="_blank" rel="noreferrer" style={{ fontSize: '0.8125rem', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}>
                                            <ExternalLink size={12} /> Maps
                                        </a>
                                    )}
                                </div>
                                {d.instructions && (
                                    <div style={{ fontSize: '0.8125rem', color: '#f59e0b', display: 'flex', alignItems: 'flex-start', gap: '0.35rem', marginTop: '0.35rem', background: '#fffbeb', padding: '0.35rem 0.5rem', borderRadius: 6, border: '1px solid #fef3c7' }}>
                                        <MessageSquare size={12} style={{ marginTop: 2, flexShrink: 0 }} /> {d.instructions}
                                    </div>
                                )}
                            </div>

                            {/* Items */}
                            <div style={{ fontSize: '0.8125rem', color: '#374151', fontWeight: 500, maxWidth: 200 }}>{d.items}</div>

                            {/* Amount */}
                            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>{formatCurrency(d.amount)}</div>

                            {d.status === 'delivered' ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                                    <span className="badge-success">✓ Delivered</span>
                                    <button
                                        onClick={() => handleUndoDelivery(d)}
                                        disabled={updatingId === d.id}
                                        style={{ background: 'transparent', border: '1px solid #cbd5e1', padding: '0.3rem 0.6rem', borderRadius: 6, color: '#64748b', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                        title="Undo Delivery"
                                    >
                                        {updatingId === d.id ? <Loader2 size={12} className="spin" /> : <RotateCcw size={12} />} Undo
                                    </button>
                                </div>
                            ) : d.status === 'insufficient_funds' ? (
                                <span style={{ color: '#dc2626', background: '#fee2e2', padding: '0.25rem 0.75rem', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 600, flexShrink: 0 }}>
                                    No Funds (₹{d.amount})
                                </span>
                            ) : (
                                <button
                                    className="btn-primary"
                                    onClick={() => handleMarkDelivered(d)}
                                    disabled={updatingId === d.id}
                                    style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem', flexShrink: 0 }}
                                >
                                    {updatingId === d.id ? <Loader2 size={14} className="spin" /> : <CheckCircle size={14} />}
                                    {updatingId === d.id ? 'Saving...' : 'Mark Delivered'}
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Summary */}
                {deliveries.length > 0 && (
                    <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '1rem 1.5rem', marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#166534', fontWeight: 600 }}>
                            <CheckCircle size={18} /> {delivered} of {deliveries.length} deliveries completed
                        </div>
                        <div style={{ fontWeight: 700, color: '#166534' }}>
                            Collection: {formatCurrency(deliveries.filter(d => d.status === 'delivered').reduce((s, d) => s + d.amount, 0))} / {formatCurrency(totalAmt)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
