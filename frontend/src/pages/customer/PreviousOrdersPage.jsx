import { useMemo } from 'react'
import { useOrders, usePartialSkipsForTargets } from '../../lib/useData'
import { useUser } from '@clerk/clerk-react'
import { formatCurrency, formatDate } from '../../lib/utils'
import Navbar from '../../components/Navbar'
import { Package, Clock, CheckCircle, XCircle } from 'lucide-react'

export default function PreviousOrdersPage() {
    const { user } = useUser()
    const { data: orders, loading: ordersLoading } = useOrders(user?.id)

    const orderIds = useMemo(() => orders?.map(o => o.id) || [], [orders])
    const { data: skips, loading: skipsLoading } = usePartialSkipsForTargets(orderIds)

    if (ordersLoading || skipsLoading) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', color: '#64748b' }}>Loading orders...</div>

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
            <Navbar />
            <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>
                <div className="page-header">
                    <h1 className="page-title">Previous Orders</h1>
                    <p className="page-subtitle">View your past one-time deliveries.</p>
                </div>

                <div className="card fade-in">
                    {(!orders || orders.length === 0) ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📦</div>
                            <div style={{ fontWeight: 600 }}>No previous orders found</div>
                            <div style={{ fontSize: '0.875rem' }}>Your one-time orders will appear here.</div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {orders.map(order => {
                                const activeItems = (order.items || []).filter(item => !skips?.some(s => s.target_id === order.id && s.product_id === item.product_id))
                                const effectiveTotal = activeItems.reduce((sum, item) => sum + (item.price_at_time * item.quantity), 0)
                                let effectiveStatus = order.status
                                if (activeItems.length === 0 && (order.items || []).length > 0) effectiveStatus = 'cancelled'

                                return (
                                    <div key={order.id} style={{
                                        border: '1px solid #e2e8f0',
                                        borderRadius: 12,
                                        padding: '1.25rem',
                                        background: 'white',
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{
                                                    width: 40, height: 40, borderRadius: 8,
                                                    background: effectiveStatus === 'delivered' ? '#ecfdf5' : effectiveStatus === 'cancelled' ? '#fef2f2' : '#eff6ff',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: effectiveStatus === 'delivered' ? '#10b981' : effectiveStatus === 'cancelled' ? '#ef4444' : '#3b82f6'
                                                }}>
                                                    <Package size={20} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>Order #{order.id.slice(0, 8).toUpperCase()}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{formatDate(order.created_at)}</div>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.1rem' }}>
                                                    {formatCurrency(effectiveTotal)}
                                                    {effectiveTotal !== order.total_amount && (
                                                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', textDecoration: 'line-through', marginLeft: '0.4rem', fontWeight: 500 }}>
                                                            {formatCurrency(order.total_amount)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{
                                                    fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                    color: effectiveStatus === 'delivered' ? '#10b981' : effectiveStatus === 'cancelled' ? '#ef4444' : '#f59e0b'
                                                }}>
                                                    {effectiveStatus === 'delivered' && <CheckCircle size={12} />}
                                                    {effectiveStatus === 'pending' && <Clock size={12} />}
                                                    {effectiveStatus === 'cancelled' && <XCircle size={12} />}
                                                    {effectiveStatus.charAt(0).toUpperCase() + effectiveStatus.slice(1)}
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Items:</div>
                                            {(order.items || []).map((item, idx) => {
                                                const isSkipped = skips?.some(s => s.target_id === order.id && s.product_id === item.product_id)
                                                return (
                                                    <div key={idx} style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        fontSize: '0.875rem',
                                                        color: isSkipped ? '#94a3b8' : '#334155',
                                                        textDecoration: isSkipped ? 'line-through' : 'none'
                                                    }}>
                                                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                                            <span>{item.quantity}x {item.products?.name || 'Product'}</span>
                                                            {isSkipped && <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem', background: '#fef2f2', color: '#ef4444', borderRadius: 4, textDecoration: 'none', display: 'inline-block' }}>Cancelled</span>}
                                                        </div>
                                                        <span style={{ fontWeight: 500 }}>{formatCurrency(item.price_at_time * item.quantity)}</span>
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed #e2e8f0', fontSize: '0.85rem', color: '#64748b' }}>
                                            Delivery scheduled for: <strong style={{ color: '#0f172a' }}>{formatDate(order.delivery_date)} ({order.delivery_slot})</strong>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
