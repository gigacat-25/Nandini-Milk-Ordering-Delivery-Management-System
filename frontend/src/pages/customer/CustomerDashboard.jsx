import { Link } from 'react-router-dom'
import { ShoppingBag, RefreshCw, Truck, IndianRupee, ChevronRight, Package } from 'lucide-react'
import { useUser } from '@clerk/clerk-react'
import { useOrders, useSubscriptions, usePartialSkips } from '../../lib/useData'
import { formatCurrency, formatDate } from '../../lib/utils'
import Navbar from '../../components/Navbar'

export default function CustomerDashboard() {
    const { user, isLoaded } = useUser()
    const { data: ordersData, loading: ordersLoading } = useOrders(user?.id)
    const { data: subsData, loading: subsLoading } = useSubscriptions(user?.id)
    const todayDateStr = new Date().toISOString().split('T')[0]
    const { data: partialSkips, loading: skipsLoading } = usePartialSkips(todayDateStr)

    const todayDeliveries = (subsData || []).filter(s => s.status === 'active').map(s => {
        const activeItems = s.items?.filter(i => !partialSkips?.some(ps => ps.target_id === s.id && ps.product_id === i.product_id)) || []
        return { ...s, activeItems }
    }).filter(s => s.activeItems.length > 0)

    const recentOrders = (ordersData || []).slice(0, 3)

    const monthlyTotal = todayDeliveries.reduce((sum, s) => {
        const subTotal = s.activeItems?.reduce((itemSum, i) => itemSum + (i.price_at_time * i.quantity), 0) || 0
        return sum + subTotal * 30
    }, 0)

    if (!isLoaded || ordersLoading || subsLoading || skipsLoading) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', color: '#64748b' }}>Loading dashboard...</div>

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
            <Navbar />
            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem' }}>
                {/* Welcome */}
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem' }}>
                        Good morning, {user?.firstName || 'there'}! 👋
                    </h1>
                    <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>
                        Here's your delivery summary for today.
                    </p>
                </div>

                {/* Quick Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { icon: Truck, label: "Today's Deliveries", value: todayDeliveries.length, color: '#2563eb', bg: '#dbeafe' },
                        { icon: RefreshCw, label: 'Active Subscriptions', value: todayDeliveries.length, color: '#059669', bg: '#d1fae5' },
                        { icon: IndianRupee, label: 'Est. Monthly Bill', value: formatCurrency(monthlyTotal), color: '#7c3aed', bg: '#ede9fe' },
                        { icon: ShoppingBag, label: 'Total Orders', value: ordersData?.length || 0, color: '#dc2626', bg: '#fee2e2' },
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

                <div className="flex flex-col md:grid md:grid-cols-2 gap-6">
                    {/* Today's Deliveries */}
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 700, color: '#0f172a' }}>Today's Deliveries</h2>
                            <Link to="/subscriptions" style={{ color: '#2563eb', fontSize: '0.8125rem', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                Manage <ChevronRight size={14} />
                            </Link>
                        </div>
                        {todayDeliveries.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                                <Package size={36} style={{ marginBottom: '0.75rem' }} />
                                <div style={{ fontWeight: 600 }}>No deliveries today</div>
                                <Link to="/subscriptions" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', marginTop: '1rem', fontSize: '0.8125rem', padding: '0.5rem 1rem' }}>
                                    Add Subscription
                                </Link>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {todayDeliveries.map((s) => {
                                    const itemsStr = s.activeItems?.map(i => `${i.quantity}x ${i.products?.name}`).join(', ') || 'No Items'
                                    const subTotal = s.activeItems?.reduce((sum, i) => sum + (i.price_at_time * i.quantity), 0) || 0

                                    return (
                                        <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: 8, alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>Subscription</div>
                                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{itemsStr}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 700, color: '#2563eb', fontSize: '0.9rem' }}>{formatCurrency(subTotal)}/delivery</div>
                                                <span className="badge-success" style={{ fontSize: '0.7rem' }}>Active</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Recent Orders */}
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 700, color: '#0f172a' }}>Recent Orders</h2>
                            <Link to="/billing" style={{ color: '#2563eb', fontSize: '0.8125rem', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                View All <ChevronRight size={14} />
                            </Link>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {recentOrders.map((o) => {
                                const badgeClass = o.status === 'delivered' ? 'badge-success' : o.status === 'cancelled' ? 'badge-danger' : o.status === 'confirmed' ? 'badge-blue' : 'badge-warning'
                                return (
                                    <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: 8, alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f172a' }}>Order #{o.id.slice(0, 8).toUpperCase()}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{formatDate(o.delivery_date)}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', marginBottom: '0.25rem' }}>{formatCurrency(o.total_amount)}</div>
                                            <span className={badgeClass} style={{ fontSize: '0.7rem', textTransform: 'capitalize' }}>{o.status}</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
                    {[
                        { to: '/products', icon: ShoppingBag, label: 'Order Now', desc: 'One-time order', color: '#2563eb', bg: '#dbeafe' },
                        { to: '/subscriptions', icon: RefreshCw, label: 'Subscriptions', desc: 'Manage daily orders', color: '#059669', bg: '#d1fae5' },
                        { to: '/billing', icon: IndianRupee, label: 'Billing', desc: 'View payment history', color: '#7c3aed', bg: '#ede9fe' },
                    ].map((action) => (
                        <Link key={action.to} to={action.to} style={{ textDecoration: 'none' }}>
                            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', transition: 'all 0.15s' }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = '#bfdbfe'; e.currentTarget.style.boxShadow = '0 4px 12px rgb(0 0 0 / 0.08)' }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}
                            >
                                <div style={{ width: 44, height: 44, background: action.bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: action.color, flexShrink: 0 }}>
                                    <action.icon size={20} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#0f172a' }}>{action.label}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{action.desc}</div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}
