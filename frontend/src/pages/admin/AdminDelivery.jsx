import { useState } from 'react'
import { Download, CheckCircle, Clock, MapPin, Phone } from 'lucide-react'
import { MOCK_DELIVERY_LIST } from '../../lib/mockData'
import Navbar from '../../components/Navbar'
import toast from 'react-hot-toast'
import { formatCurrency } from '../../lib/utils'

export default function AdminDelivery() {
    const [deliveries, setDeliveries] = useState(MOCK_DELIVERY_LIST)
    const [date, setDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0])

    function markDelivered(id) {
        setDeliveries(d => d.map(i => i.id === id ? { ...i, status: 'delivered' } : i))
        toast.success('Marked as delivered')
    }

    function exportCSV() {
        const rows = [
            ['#', 'Customer', 'Address', 'Phone', 'Items', 'Amount', 'Status'],
            ...deliveries.map((d, i) => [i + 1, d.customer, d.address, d.phone, d.items, d.amount, d.status])
        ]
        const csv = rows.map(r => r.join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = `delivery-${date}.csv`; a.click()
        toast.success('Delivery sheet exported!')
    }

    const pending = deliveries.filter(d => d.status === 'pending').length
    const delivered = deliveries.filter(d => d.status === 'delivered').length
    const totalAmt = deliveries.reduce((s, d) => s + d.amount, 0)

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
            <Navbar />
            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 className="page-title">Daily Delivery Report</h1>
                        <p className="page-subtitle">Delivery schedule and route for your delivery staff.</p>
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
                    {deliveries.map((d, idx) => (
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
                                </div>
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
                <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '1rem 1.5rem', marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#166534', fontWeight: 600 }}>
                        <CheckCircle size={18} /> {delivered} of {deliveries.length} deliveries completed
                    </div>
                    <div style={{ fontWeight: 700, color: '#166534' }}>
                        Collection: {formatCurrency(deliveries.filter(d => d.status === 'delivered').reduce((s, d) => s + d.amount, 0))} / {formatCurrency(totalAmt)}
                    </div>
                </div>
            </div>
        </div>
    )
}
