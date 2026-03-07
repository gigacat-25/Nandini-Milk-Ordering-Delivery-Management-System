import { IndianRupee, CheckCircle, Clock, Download } from 'lucide-react'
import { MOCK_BILLING, MOCK_ORDERS } from '../../lib/mockData'
import { formatCurrency, formatDate } from '../../lib/utils'
import Navbar from '../../components/Navbar'
import toast from 'react-hot-toast'

export default function BillingPage() {
    const totalPaid = MOCK_BILLING.filter(b => b.status === 'paid').reduce((s, b) => s + b.amount, 0)
    const totalDue = MOCK_BILLING.filter(b => b.status === 'pending').reduce((s, b) => s + b.amount, 0)

    function handlePayNow() {
        toast.success('Redirecting to UPI payment... (demo)')
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
            <Navbar />
            <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>
                <div className="page-header">
                    <h1 className="page-title">Billing & History</h1>
                    <p className="page-subtitle">View your monthly bills and payment history.</p>
                </div>

                {/* Summary cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Total Due', value: formatCurrency(totalDue), color: '#dc2626', bg: '#fee2e2', icon: Clock },
                        { label: 'Total Paid (YTD)', value: formatCurrency(totalPaid), color: '#059669', bg: '#d1fae5', icon: CheckCircle },
                        { label: 'Total Orders', value: MOCK_ORDERS.length, color: '#2563eb', bg: '#dbeafe', icon: IndianRupee },
                    ].map((s) => (
                        <div key={s.label} className="stat-card">
                            <div style={{ width: 40, height: 40, background: s.bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, marginBottom: '0.75rem' }}>
                                <s.icon size={20} />
                            </div>
                            <div style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '0.25rem' }}>{s.label}</div>
                            <div style={{ fontSize: '1.375rem', fontWeight: 700, color: '#0f172a' }}>{s.value}</div>
                        </div>
                    ))}
                </div>

                {/* Monthly Bills */}
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#0f172a', margin: '0 0 1.25rem' }}>Monthly Bills</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {MOCK_BILLING.map((bill) => (
                            <div key={bill.month} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: 10, flexWrap: 'wrap' }}>
                                <div style={{ width: 40, height: 40, background: bill.status === 'paid' ? '#d1fae5' : '#fee2e2', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: bill.status === 'paid' ? '#059669' : '#dc2626', flexShrink: 0 }}>
                                    {bill.status === 'paid' ? <CheckCircle size={18} /> : <Clock size={18} />}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#0f172a' }}>{bill.month}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{bill.deliveries} deliveries · Due by {formatDate(bill.due_date)}</div>
                                </div>
                                <div style={{ fontWeight: 800, fontSize: '1.0625rem', color: '#0f172a' }}>{formatCurrency(bill.amount)}</div>
                                <span className={bill.status === 'paid' ? 'badge-success' : 'badge-danger'}>{bill.status === 'paid' ? 'Paid' : 'Due'}</span>
                                {bill.status === 'pending' && (
                                    <button className="btn-primary" onClick={handlePayNow} style={{ fontSize: '0.8125rem', padding: '0.5rem 0.875rem' }}>
                                        Pay Now
                                    </button>
                                )}
                                {bill.status === 'paid' && (
                                    <button className="btn-secondary" style={{ fontSize: '0.8125rem', padding: '0.5rem 0.75rem' }} onClick={() => toast.success('Invoice downloaded (demo)')}>
                                        <Download size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Order History */}
                <div className="card">
                    <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#0f172a', margin: '0 0 1.25rem' }}>Order History</h2>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Items</th>
                                    <th>Delivery Date</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {MOCK_ORDERS.map((o) => (
                                    <tr key={o.id}>
                                        <td style={{ fontWeight: 600, color: '#2563eb' }}>{o.id}</td>
                                        <td style={{ color: '#64748b', maxWidth: 200 }}>{o.products}</td>
                                        <td style={{ color: '#64748b' }}>{formatDate(o.delivery_date)}</td>
                                        <td style={{ fontWeight: 700 }}>{formatCurrency(o.total_amount)}</td>
                                        <td><span className={o.status === 'delivered' ? 'badge-success' : o.status === 'confirmed' ? 'badge-blue' : o.status === 'cancelled' ? 'badge-danger' : 'badge-warning'}>{o.status}</span></td>
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
