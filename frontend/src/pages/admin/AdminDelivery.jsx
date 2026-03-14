import { useState, useMemo, useEffect } from 'react'
import { Download, CheckCircle, MapPin, Phone, MessageSquare, ExternalLink, Loader2, PlayCircle, StopCircle, RotateCcw, XCircle, Undo2, Camera, X, List, Coins, Clock } from 'lucide-react'
import { useSubscriptions, useCustomers, useSubscriptionPauses, useOrdersByDate, useDeliveries, markOrderDelivered, markSubscriptionDelivered, unmarkOrderDelivered, unmarkSubscriptionDelivered, useDeliverySession, startDeliverySession, endDeliverySession, usePartialSkips, skipDeliveryItem, unskipDeliveryItem, updateOrderStatus, useDeliveryPhotos, API_BASE } from '../../lib/useData'
import Navbar from '../../components/Navbar'
import toast from 'react-hot-toast'
import { formatCurrency } from '../../lib/utils'
import { useUser } from '@clerk/clerk-react'

export default function AdminDelivery() {
    const { user } = useUser()
    const { data: subscriptions, loading: subsLoading } = useSubscriptions()
    const { data: customers, loading: custLoading } = useCustomers()
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [activeSlot, setActiveSlot] = useState('morning')
    const { data: pauses, loading: pausesLoading } = useSubscriptionPauses(date)
    const { data: orders, loading: ordersLoading, refetch: refetchOrders } = useOrdersByDate(date)
    const { data: completedDeliveries, loading: compLoading, refetch: refetchComp } = useDeliveries(date)
    const { data: deliverySession, refetch: refetchSession } = useDeliverySession(date, activeSlot)
    const { data: partialSkips, loading: skipsLoading, refetch: refetchSkips } = usePartialSkips(date)

    const [updatingId, setUpdatingId] = useState(null)
    const [sessionLoading, setSessionLoading] = useState(false)
    const isSessionActive = !!deliverySession
    const [photoLightbox, setPhotoLightbox] = useState(null) // photo URL string
    const { data: deliveryPhotos, refetch: refetchPhotos } = useDeliveryPhotos(date)

    const getPhotoUrl = (url) => {
        if (!url) return null
        if (url.startsWith('http')) return url
        if (url.startsWith('/api/assets/')) {
            // Replace /api with API_BASE
            return url.replace('/api', API_BASE)
        }
        return `${API_BASE}${url}`
    }

    // Poll for updates every 10 seconds to keep the admin view in sync with drivers
    useEffect(() => {
        const interval = setInterval(() => {
           refetchOrders()
           refetchComp()
           refetchPhotos()
           refetchSkips()
        }, 10000)
        return () => clearInterval(interval)
    }, [refetchOrders, refetchComp, refetchPhotos, refetchSkips])


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

            // Find the most restrictive cutoff among all items in this subscription
            let minCutoff = s.delivery_slot === 'morning' ? 15.5 : 19.5
            if (s.items?.length > 0) {
                const cutoffs = s.items.map(i => s.delivery_slot === 'morning' ? (i.products?.cutoff_morning || 15.5) : (i.products?.cutoff_evening || 19.5))
                minCutoff = Math.min(...cutoffs)
            }

            let cutoffTime = new Date(targetDate)
            if (s.delivery_slot === 'morning') {
                cutoffTime.setDate(cutoffTime.getDate() - 1)
            }

            const hours = Math.floor(minCutoff)
            const mins = (minCutoff % 1) * 60
            cutoffTime.setHours(hours, mins, 0, 0)

            if (subCreated >= cutoffTime) return false

            const isPaused = pauses?.some(p => p.subscription_id === s.id && p.pause_date === date)
            return !isPaused
        }).map(sub => {
            const customer = customers.find(c => c.id === sub.customer_id)
            const isDelivered = completedDeliveries.some(d => d.subscription_id === sub.id)

            const subItemsRaw = sub.items?.map(i => ({
                ...i,
                isSkipped: partialSkips?.some(ps => ps.target_id === sub.id && ps.product_id === i.product_id)
            })) || []

            // Group items to avoid duplicates
            const subItems = Object.values(subItemsRaw.reduce((acc, item) => {
                const pid = item.product_id
                if (!acc[pid]) {
                    acc[pid] = { ...item }
                } else {
                    acc[pid].quantity += item.quantity
                }
                return acc
            }, {}))

            const activeItems = subItems.filter(i => !i.isSkipped)
            const subAmount = activeItems.reduce((sum, i) => sum + ((i.price_at_time ?? i.products?.price ?? 0) * i.quantity), 0)

            const hasFunds = (customer?.wallet_balance || 0) >= subAmount
            let status = isDelivered ? 'delivered' : 'pending'
            if (!hasFunds && !isDelivered) status = 'insufficient_funds'
            if (activeItems.length === 0 && subItems.length > 0) status = 'cancelled'

            return {
                id: sub.id,
                type: 'subscription',
                customerId: sub.customer_id,
                customer: customer?.full_name || 'Unknown',
                address: customer?.address || 'Address not provided',
                phone: customer?.phone || 'N/A',
                google_maps: customer?.google_maps_url,
                instructions: customer?.delivery_instructions,
                rawItems: subItems,
                slot: sub.delivery_slot,
                amount: subAmount,
                status
            }
        })

        // 2. Process One-Off Orders
        const orderDeliveries = orders.map(order => {
            const orderItemsRaw = order.items?.map(i => ({
                ...i,
                isSkipped: partialSkips?.some(ps => ps.target_id === order.id && ps.product_id === i.product_id)
            })) || []

            // Group items to avoid duplicates
            const orderItems = Object.values(orderItemsRaw.reduce((acc, item) => {
                const pid = item.product_id
                if (!acc[pid]) {
                    acc[pid] = { ...item }
                } else {
                    acc[pid].quantity += item.quantity
                }
                return acc
            }, {}))

            const activeItems = orderItems.filter(i => !i.isSkipped)
            const amount = activeItems.reduce((sum, i) => sum + ((i.price_at_time ?? i.products?.price ?? 0) * i.quantity), 0)

            let status = order.status === 'delivered' ? 'delivered' : 'pending'
            if (activeItems.length === 0 && orderItems.length > 0) status = 'cancelled'

            return {
                id: order.id,
                type: 'order',
                customerId: order.customer_id,
                customer: order.customer_name || 'Unknown',
                address: order.customer_address || 'Address not provided',
                phone: order.customer_phone || 'N/A',
                google_maps: order.google_maps_url,
                instructions: order.delivery_instructions,
                rawItems: orderItems,
                slot: order.delivery_slot,
                amount: amount,
                status
            }
        })

        return [...activeSubs, ...orderDeliveries].filter(d => d.slot === activeSlot)
    }, [subscriptions, customers, pauses, orders, completedDeliveries, date, partialSkips, activeSlot])

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
                await markOrderDelivered(d.id, d.customerId, d.amount, date)
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
                await unmarkOrderDelivered(d.customerId, d.id, date, d.amount)
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

    async function handleToggleSkip(delivery, productId, isPresentlySkipped) {
        const deliveryId = delivery.id
        setUpdatingId(`${deliveryId}-${productId}`)
        try {
            if (isPresentlySkipped) {
                await unskipDeliveryItem(date, deliveryId, productId)
                // If this is an order, restore its status to 'confirmed'
                if (delivery.type === 'order') {
                    await updateOrderStatus(deliveryId, 'confirmed')
                }
            } else {
                await skipDeliveryItem(date, deliveryId, productId)
                // If this is an order, check if ALL items are now skipped — if so, mark as cancelled
                if (delivery.type === 'order') {
                    const otherItems = delivery.rawItems.filter(i => i.product_id !== productId && !i.isSkipped)
                    if (otherItems.length === 0) {
                        await updateOrderStatus(deliveryId, 'cancelled')
                    }
                }
            }
            await refetchSkips()
            await refetchOrders()
            toast.success(isPresentlySkipped ? 'Item restored to delivery run' : 'Item cancelled from delivery run')
        } catch (err) {
            toast.error('Failed to update item status: ' + err.message)
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

    const activeDeliveries = deliveries.filter(d => d.status !== 'cancelled')
    const pending = activeDeliveries.filter(d => d.status === 'pending').length
    const delivered = activeDeliveries.filter(d => d.status === 'delivered').length
    const totalAmt = activeDeliveries.reduce((s, d) => s + d.amount, 0)
    const expectedCollection = activeDeliveries.filter(d => d.status === 'insufficient_funds').reduce((s, d) => s + d.amount, 0)

    if (subsLoading || custLoading || pausesLoading || ordersLoading || compLoading) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', color: '#64748b' }}><Loader2 className="spin" size={32} /></div>

    return (
        <>
            <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
                <Navbar />
                <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 1rem' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <h1 className="page-title" style={{ margin: 0, fontSize: '1.5rem' }}>Daily Delivery Report</h1>
                                <span style={{ 
                                    display: 'flex', alignItems: 'center', gap: '0.3rem', 
                                    padding: '0.2rem 0.5rem', background: '#f0fdf4', color: '#166534', 
                                    borderRadius: 20, fontSize: '0.65rem', fontWeight: 700, border: '1px solid #bbf7d0'
                                }}>
                                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }}></span>
                                    LIVE SYNC
                                </span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: 'auto', padding: '0.5rem 0.75rem', borderRadius: 10, fontSize: '0.85rem' }} />
                            <button className="btn-primary" onClick={exportCSV} style={{ padding: '0.5rem 1rem', borderRadius: 10, fontSize: '0.85rem' }}><Download size={14} /> Export</button>
                        </div>
                    </div>

                    {/* Delivery Run Control Panel */}
                    <div style={{
                        padding: '0.75rem 1rem',
                        background: isSessionActive ? '#f0fdf4' : '#fff7ed',
                        border: `1px solid ${isSessionActive ? '#bbf7d0' : '#fed7aa'}`,
                        borderRadius: 12,
                        marginBottom: '1rem',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.75rem',
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

                    {/* Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                        {[
                            { label: 'Total Schedule', value: activeDeliveries.length, icon: <List className="text-blue-600" size={18} />, bg: '#eff6ff' },
                            { label: 'Pending Run', value: pending, icon: <Clock className="text-amber-600" size={18} />, bg: '#fff7ed' },
                            { label: 'Completed', value: delivered, icon: <CheckCircle className="text-emerald-600" size={18} />, bg: '#f0fdf4' },
                            { label: 'Total Value', value: formatCurrency(totalAmt), icon: <Coins className="text-purple-600" size={18} />, bg: '#faf5ff' },
                        ].map(s => (
                            <div key={s.label} style={{ 
                                background: 'white', padding: '0.75rem 1rem', borderRadius: 12, 
                                border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.75rem',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}>
                                <div style={{ padding: '0.5rem', borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</div>
                                <div>
                                    <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{s.value}</div>
                                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.2rem' }}>{s.label}</div>
                                </div>
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
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1, minWidth: 250 }}>
                                    {d.rawItems.map((item, iIdx) => (
                                        <div key={`${d.id}-${item.product_id}`} style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '0.6rem 0.8rem', background: item.isSkipped ? '#f8fafc' : 'white',
                                            borderRadius: 10, border: `1px solid ${item.isSkipped ? '#e2e8f0' : '#f1f5f9'}`,
                                            opacity: item.isSkipped ? 0.6 : 1,
                                            boxShadow: item.isSkipped ? 'none' : '0 1px 2px 0 rgba(0,0,0,0.05)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ 
                                                    width: '2.4rem', height: '1.8rem', background: item.isSkipped ? '#f1f5f9' : '#eff6ff', 
                                                    borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontWeight: 800, color: item.isSkipped ? '#94a3b8' : '#2563eb', fontSize: '0.85rem'
                                                }}>
                                                    {item.quantity}x
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontWeight: 700, color: item.isSkipped ? '#94a3b8' : '#1e293b', fontSize: '0.875rem' }}>
                                                        {item.products?.name}
                                                    </span>
                                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500 }}>
                                                        {item.products?.size_label} • {d.slot.toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>

                                            {d.status !== 'delivered' && (
                                                <button
                                                    onClick={() => handleToggleSkip(d, item.product_id, item.isSkipped)}
                                                    disabled={updatingId === `${d.id}-${item.product_id}`}
                                                    style={{
                                                        background: item.isSkipped ? '#f8fafc' : 'white', 
                                                        border: `1px solid ${item.isSkipped ? '#cbd5e1' : '#fee2e2'}`, 
                                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem',
                                                        color: item.isSkipped ? '#475569' : '#ef4444', 
                                                        fontSize: '0.75rem', fontWeight: 700, padding: '0.4rem 0.6rem', borderRadius: 8,
                                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                                    }}
                                                    className="hover:scale-105 active:scale-95"
                                                >
                                                    {updatingId === `${d.id}-${item.product_id}` ? (
                                                        <Loader2 size={14} className="spin" />
                                                    ) : item.isSkipped ? (
                                                        <><Undo2 size={14} /> Restore</>
                                                    ) : (
                                                        <><XCircle size={14} /> Cancel</>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {d.rawItems.every(i => i.isSkipped) && (
                                        <div style={{ 
                                            fontSize: '0.8rem', color: '#ef4444', fontWeight: 800, 
                                            marginTop: '0.25rem', padding: '0.5rem', background: '#fef2f2', 
                                            borderRadius: 6, textAlign: 'center', border: '1px dashed #fecaca' 
                                        }}>
                                            ⚠️ Entire delivery cancelled
                                        </div>
                                    )}
                                </div>

                                {/* Amount & Status Context */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexShrink: 0 }}>
                                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a', textDecoration: d.rawItems.every(i => i.isSkipped) ? 'line-through' : 'none' }}>
                                        {formatCurrency(d.amount)}
                                    </div>

                                    {d.rawItems.every(i => i.isSkipped) ? (
                                        <span style={{ color: '#ef4444', background: '#fee2e2', padding: '0.25rem 0.75rem', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 600 }}>Cancelled</span>
                                    ) : d.status === 'delivered' ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0, flexWrap: 'wrap' }}>
                                            <span className="badge-success">✓ Delivered</span>
                                            {/* View proof-of-delivery photo if one exists */}
                                            {(() => {
                                                const photo = deliveryPhotos?.find(p => p.target_id === d.id)
                                                return photo ? (
                                                    <button
                                                        onClick={() => setPhotoLightbox(getPhotoUrl(photo.photo_url))}
                                                        style={{ background: '#f0fdf4', border: '1px solid #86efac', padding: '0.3rem 0.6rem', borderRadius: 6, color: '#059669', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                                        title="View proof of delivery photo"
                                                    >
                                                        <Camera size={12} /> View Photo
                                                    </button>
                                                ) : null
                                            })()}
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
                            </div>
                        ))}
                    </div>

                    {/* Summary */}
                    {deliveries.length > 0 && (
                        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '1rem 1.5rem', marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#166534', fontWeight: 600 }}>
                                <CheckCircle size={18} /> {delivered} of {activeDeliveries.length} deliveries completed
                            </div>
                            <div style={{ fontWeight: 700, color: '#166534' }}>
                                Collection: {formatCurrency(deliveries.filter(d => d.status === 'delivered').reduce((s, d) => s + d.amount, 0))} / {formatCurrency(totalAmt)}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Photo Lightbox */}
            {photoLightbox && (
                <div
                    onClick={() => setPhotoLightbox(null)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
                >
                    <button
                        onClick={() => setPhotoLightbox(null)}
                        style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
                    >
                        <X size={20} />
                    </button>
                    <div style={{ fontWeight: 700, color: 'white', marginBottom: '0.75rem', fontSize: '0.9rem', opacity: 0.8 }}>📷 Proof of Delivery</div>
                    <img
                        src={photoLightbox}
                        alt="Proof of delivery"
                        onClick={e => e.stopPropagation()}
                        style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 12, objectFit: 'contain', boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}
                    />
                </div>
            )}
        </>
    )
}
