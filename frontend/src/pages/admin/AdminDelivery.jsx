import { useState, useMemo } from 'react'
import { Download, CheckCircle, Clock, MapPin, Phone, MessageSquare, ExternalLink } from 'lucide-react'
import { useSubscriptions, useCustomers, useSubscriptionPauses } from '../../lib/useData'
import Navbar from '../../components/Navbar'
import toast from 'react-hot-toast'
import { formatCurrency } from '../../lib/utils'

export default function AdminDelivery() {
    const { data: subscriptions, loading: subsLoading } = useSubscriptions()
    const { data: customers, loading: custLoading } = useCustomers()
    const [date, setDate] = useState(newtoISOStringDate())
    const { data: pauses, loading: pausesLoading } = useSubscriptionPauses(date)
    const [deliveredIds, setDeliveredIds] = useState(new Set()) // Local state for demo purposes

    function newtoISOStringDate() {
        return new Date(Date.now() + 86400000).toISOString().split('T')[0];
    }

    // Generate daily delivery sheet on the fly from active subscriptions
    const deliveries = useMemo(() => {
        if (!subscriptions || !customers) return []

        const activeSubs = subscriptions.filter(s => {
            if (s.status !== 'active') return false
            // Check if this sub is paused for the current date
            const isPaused = pauses?.some(p => p.subscription_id === s.id && p.pause_date === date)
            return !isPaused
        })

        return activeSubs.map(sub => {
            const customer = customers.find(c => c.id === sub.customer_id)
            return {
                id: sub.id, // Using sub ID as delivery ID for demo
                customer: customer?.full_name || 'Unknown',
                address: customer?.address || 'Address not provided',
                phone: customer?.phone || 'N/A',
                google_maps: customer?.google_maps_url,
                instructions: customer?.delivery_instructions,
                items: `${sub.quantity}x ${sub.products?.name} (${sub.products?.size_label}) [${sub.delivery_slot}]`,
                amount: (sub.products?.price || 0) * sub.quantity,
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

    if (subsLoading || custLoading || pausesLoading) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', color: '#64748b' }}>Loading deliveries...</div>

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
                                width: 36, height: 36, borderRadius: '50%', background: d.status === 'delivered' ? '#d1fae5' : '#dbeafe',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 700, color: d.status === 'delivered' ? '#059669' : '#2563eb', flexShrink: 0, fontSize: '0.875rem',
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

                            {/* Status / Action */}
                            {d.status === 'delivered' ? (
                                <span className="badge-success" style={{ flexShrink: 0 }}>✓ Delivered</span>
                            ) : (
                                <button
                                    className="btn-primary"
                                    onClick={() => markDelivered(d.id)}
                                    style={{ fontSize: '0.8125rem', padding: '0.5rem 0.875rem', flexShrink: 0 }}
                                >
                                    <CheckCircle size={14} /> Mark Delivered
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
