import { useState } from 'react'
import { Search, Filter } from 'lucide-react'
import { MOCK_ORDERS } from '../../lib/mockData'
import { formatCurrency, formatDate } from '../../lib/utils'
import Navbar from '../../components/Navbar'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = ['All', 'pending', 'confirmed', 'delivered', 'cancelled']

export default function AdminOrders() {
    const [orders, setOrders] = useState(MOCK_ORDERS)
    const [filter, setFilter] = useState('All')
    const [search, setSearch] = useState('')

    const filtered = orders.filter((o) => {
        const matchStatus = filter === 'All' || o.status === filter
        const matchSearch = o.customer_name.toLowerCase().includes(search.toLowerCase()) || o.id.toLowerCase().includes(search.toLowerCase())
        return matchStatus && matchSearch
    })

    function updateStatus(id, status) {
        setOrders(orders.map(o => o.id === id ? { ...o, status } : o))
        toast.success(`Order ${id} marked as ${status}`)
    }

    const statusBadge = (s) => s === 'delivered' ? 'badge-success' : s === 'confirmed' ? 'badge-blue' : s === 'cancelled' ? 'badge-danger' : 'badge-warning'

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
            <Navbar />
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem' }}>
                <div className="page-header">
                    <h1 className="page-title">Orders Management</h1>
                    <p className="page-subtitle">View and manage all customer orders.</p>
                </div>

                {/* Summary Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                    {[
                        { label: 'Total', value: orders.length, color: '#2563eb' },
                        { label: 'Pending', value: orders.filter(o => o.status === 'pending').length, color: '#f59e0b' },
                        { label: 'Confirmed', value: orders.filter(o => o.status === 'confirmed').length, color: '#2563eb' },
                        { label: 'Delivered', value: orders.filter(o => o.status === 'delivered').length, color: '#059669' },
                    ].map((s) => (
                        <div key={s.label} className="card" style={{ textAlign: 'center', padding: '1rem' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                            <div style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 500 }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: '1 1 260px' }}>
                        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input className="input" placeholder="Search by customer or order ID..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '2.25rem' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {STATUS_OPTIONS.map(s => (
                            <button key={s} onClick={() => setFilter(s)} style={{
                                padding: '0.5rem 0.875rem', borderRadius: 8, border: '1px solid',
                                borderColor: filter === s ? '#2563eb' : '#e2e8f0',
                                background: filter === s ? '#2563eb' : 'white',
                                color: filter === s ? 'white' : '#64748b',
                                fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer',
                                textTransform: 'capitalize',
                            }}>{s}</button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="card" style={{ padding: 0 }}>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Customer</th>
                                    <th>Products</th>
                                    <th>Delivery Date</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>No orders found</td></tr>
                                ) : filtered.map((o) => (
                                    <tr key={o.id}>
                                        <td style={{ fontWeight: 700, color: '#2563eb' }}>{o.id}</td>
                                        <td style={{ fontWeight: 600 }}>{o.customer_name}</td>
                                        <td style={{ color: '#64748b', maxWidth: 200, fontSize: '0.8125rem' }}>{o.products}</td>
                                        <td style={{ color: '#64748b' }}>{formatDate(o.delivery_date)}</td>
                                        <td style={{ fontWeight: 700 }}>{formatCurrency(o.total_amount)}</td>
                                        <td><span className={statusBadge(o.status)} style={{ textTransform: 'capitalize' }}>{o.status}</span></td>
                                        <td>
                                            <select
                                                value={o.status}
                                                onChange={e => updateStatus(o.id, e.target.value)}
                                                style={{
                                                    padding: '0.375rem 0.625rem', borderRadius: 6, border: '1px solid #e2e8f0',
                                                    fontSize: '0.8125rem', cursor: 'pointer', background: 'white', color: '#374151',
                                                }}
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="confirmed">Confirmed</option>
                                                <option value="delivered">Delivered</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
