import { useState } from 'react'
import { Search, Eye, Mail, Phone } from 'lucide-react'
import { MOCK_CUSTOMERS } from '../../lib/mockData'
import { formatCurrency, formatDate } from '../../lib/utils'
import Navbar from '../../components/Navbar'
import Modal from '../../components/Modal'

export default function AdminCustomers() {
    const [search, setSearch] = useState('')
    const [selected, setSelected] = useState(null)

    const filtered = MOCK_CUSTOMERS.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search) ||
        c.email.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
            <Navbar />
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem' }}>
                <div className="page-header">
                    <h1 className="page-title">Customer Management</h1>
                    <p className="page-subtitle">View all registered customers and their subscriptions.</p>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                    {[
                        { label: 'Total Customers', value: MOCK_CUSTOMERS.length },
                        { label: 'Active Subscriptions', value: MOCK_CUSTOMERS.reduce((s, c) => s + c.subscriptions, 0) },
                        { label: 'Total Orders', value: MOCK_CUSTOMERS.reduce((s, c) => s + c.total_orders, 0) },
                        { label: 'Total Revenue', value: formatCurrency(MOCK_CUSTOMERS.reduce((s, c) => s + c.total_spent, 0)) },
                    ].map((s) => (
                        <div key={s.label} className="card" style={{ textAlign: 'center', padding: '1rem' }}>
                            <div style={{ fontSize: '1.375rem', fontWeight: 800, color: '#0f172a' }}>{s.value}</div>
                            <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Search */}
                <div style={{ position: 'relative', marginBottom: '1.5rem', maxWidth: 400 }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input className="input" placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '2.25rem' }} />
                </div>

                {/* Table */}
                <div className="card" style={{ padding: 0 }}>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Customer</th>
                                    <th>Contact</th>
                                    <th>Address</th>
                                    <th>Subscriptions</th>
                                    <th>Total Orders</th>
                                    <th>Total Spent</th>
                                    <th>Joined</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((c) => (
                                    <tr key={c.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{
                                                    width: 36, height: 36, borderRadius: '50%', background: '#dbeafe',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: '#2563eb', fontWeight: 700, fontSize: '0.875rem', flexShrink: 0,
                                                }}>
                                                    {c.name[0]}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.875rem' }}>{c.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{c.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '0.8125rem', color: '#374151' }}>{c.phone}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{c.email}</div>
                                        </td>
                                        <td style={{ fontSize: '0.8125rem', color: '#64748b', maxWidth: 160 }}>{c.address}</td>
                                        <td>
                                            <span className={c.subscriptions > 0 ? 'badge-success' : 'badge-gray'}>{c.subscriptions} active</span>
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{c.total_orders}</td>
                                        <td style={{ fontWeight: 700, color: '#2563eb' }}>{formatCurrency(c.total_spent)}</td>
                                        <td style={{ color: '#64748b', fontSize: '0.8125rem' }}>{formatDate(c.joined)}</td>
                                        <td>
                                            <button className="btn-secondary" style={{ padding: '0.375rem 0.625rem', fontSize: '0.8125rem' }} onClick={() => setSelected(c)}>
                                                <Eye size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Customer Detail Modal */}
            {selected && (
                <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Customer Details">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', fontWeight: 800, fontSize: '1.25rem' }}>
                                {selected.name[0]}
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '1.125rem', color: '#0f172a' }}>{selected.name}</div>
                                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Customer since {formatDate(selected.joined)}</div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            {[
                                { icon: Phone, label: 'Phone', value: selected.phone },
                                { icon: Mail, label: 'Email', value: selected.email },
                            ].map(f => (
                                <div key={f.label} style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: 8 }}>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>{f.label}</div>
                                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.875rem' }}>{f.value}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: 8 }}>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Address</div>
                            <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.875rem' }}>{selected.address}</div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                            {[
                                { label: 'Subscriptions', value: selected.subscriptions },
                                { label: 'Total Orders', value: selected.total_orders },
                                { label: 'Total Spent', value: formatCurrency(selected.total_spent) },
                            ].map(s => (
                                <div key={s.label} style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: 8, textAlign: 'center' }}>
                                    <div style={{ fontWeight: 800, fontSize: '1.125rem', color: '#2563eb' }}>{s.value}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <a href={`tel:${selected.phone}`} className="btn-secondary" style={{ textDecoration: 'none' }}>
                                <Phone size={14} /> Call
                            </a>
                            <a href={`mailto:${selected.email}`} className="btn-primary" style={{ textDecoration: 'none' }}>
                                <Mail size={14} /> Email
                            </a>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    )
}
