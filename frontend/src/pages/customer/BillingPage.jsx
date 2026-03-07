import { IndianRupee, CheckCircle, Clock } from 'lucide-react'
import { useOrders } from '../../lib/useData'
import { useUser } from '@clerk/clerk-react'
import { formatCurrency, formatDate } from '../../lib/utils'
import Navbar from '../../components/Navbar'
import toast from 'react-hot-toast'

export default function BillingPage() {
    const { user } = useUser()
    const { data: orders, loading } = useOrders(user?.id)

    // Using orders data to construct a demo billing history since we don't have a specific invoices table
    const pastOrders = (orders || []).filter(o => o.status === 'delivered')
    const pendingOrders = (orders || []).filter(o => o.status !== 'delivered' && o.status !== 'cancelled')

    const totalPaid = pastOrders.reduce((s, b) => s + b.total_amount, 0)
    const totalDue = pendingOrders.reduce((s, b) => s + b.total_amount, 0)

    function handlePayNow() {
        toast.success('Redirecting to UPI payment... (demo)')
    }

    if (loading) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', color: '#64748b' }}>Loading billing...</div>

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
            <Navbar />
            <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>
                <div className="page-header">
                    <h1 className="page-title">Billing & History</h1>
                    <p className="page-subtitle">View your bills and payment history.</p>
                </div>

                {/* Summary cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Pending Dues Phase', value: formatCurrency(totalDue), color: '#dc2626', bg: '#fee2e2', icon: Clock },
                        { label: 'Total Paid (YTD)', value: formatCurrency(totalPaid), color: '#059669', bg: '#d1fae5', icon: CheckCircle },
                        { label: 'Total Orders', value: (orders || []).length, color: '#2563eb', bg: '#dbeafe', icon: IndianRupee },
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

                {/* Order History */}
                <div className="card">
                    <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#0f172a', margin: '0 0 1.25rem' }}>Order History</h2>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Items</th>
                                    <th>Date</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {(orders || []).length === 0 ? (
                                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No order history</td></tr>
                                ) : (
                                    (orders || []).map((o) => (
                                        <tr key={o.id}>
                                            <td style={{ fontWeight: 600, color: '#2563eb' }}>{o.id.split('-')[0]}</td>
                                            <td style={{ color: '#64748b', maxWidth: 200 }}>{o.items?.length || 0} items</td>
                                            <td style={{ color: '#64748b' }}>{formatDate(o.created_at)}</td>
                                            <td style={{ fontWeight: 700 }}>{formatCurrency(o.total_amount)}</td>
                                            <td><span className={o.status === 'delivered' ? 'badge-success' : o.status === 'confirmed' ? 'badge-blue' : o.status === 'cancelled' ? 'badge-danger' : 'badge-warning'}>{o.status}</span></td>
                                            <td>
                                                {o.status === 'confirmed' && (
                                                    <button className="btn-primary" onClick={handlePayNow} style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>Pay</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
