import { Link } from 'react-router-dom'
import { ShoppingBag, RefreshCw, Truck, IndianRupee, ChevronRight, Package } from 'lucide-react'
import { useUser } from '@clerk/clerk-react'
import { useOrders, useSubscriptions, usePartialSkips, useUserProfile } from '../../lib/useData'
import { formatCurrency, formatDate } from '../../lib/utils'
import Navbar from '../../components/Navbar'

export default function CustomerDashboard() {
    const { user, isLoaded } = useUser()
    const { data: ordersData, loading: ordersLoading } = useOrders(user?.id)
    const { data: subsData, loading: subsLoading } = useSubscriptions(user?.id)
    const todayDateStr = new Date().toISOString().split('T')[0]
    const { data: partialSkips, loading: skipsLoading } = usePartialSkips(todayDateStr)
    const { data: profile, loading: profileLoading } = useUserProfile(user?.id)

    const todayDeliveries = (subsData || []).filter(s => s.status === 'active').map(s => {
        const activeItems = s.items?.filter(i => !partialSkips?.some(ps => ps.target_id === s.id && ps.product_id === i.product_id)) || []
        return { ...s, activeItems }
    }).filter(s => s.activeItems.length > 0)

    const recentOrders = (ordersData || []).slice(0, 3)

    const monthlyTotal = todayDeliveries.reduce((sum, s) => {
        const subTotal = s.activeItems?.reduce((itemSum, i) => itemSum + (i.price_at_time * i.quantity), 0) || 0
        return sum + subTotal * 30
    }, 0)

    if (!isLoaded || ordersLoading || subsLoading || skipsLoading || profileLoading) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', color: '#64748b' }}>Loading your dashboard...</div>

    const walletBalance = profile?.wallet_balance || 0

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

                {/* Top Action Banners */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    
                    {/* Primary Order Button */}
                    <Link to="/products?type=one-time" style={{ textDecoration: 'none' }}>
                        <div className="card" style={{ background: '#2563eb', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem', cursor: 'pointer', transition: 'transform 0.15s' }}>
                            <div style={{ width: 64, height: 64, background: 'rgba(255,255,255,0.2)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyItems: 'center', flexShrink: 0 }}>
                                <ShoppingBag size={32} style={{ margin: 'auto' }} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.25rem', lineHeight: 1.1 }}>Order for Tomorrow</div>
                                <div style={{ fontSize: '1rem', opacity: 0.9 }}>One-time milk delivery</div>
                            </div>
                        </div>
                    </Link>

                    {/* Subscription Button */}
                    <Link to="/products?type=subscription" style={{ textDecoration: 'none' }}>
                        <div className="card" style={{ background: '#059669', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem', cursor: 'pointer', transition: 'transform 0.15s' }}>
                            <div style={{ width: 64, height: 64, background: 'rgba(255,255,255,0.2)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyItems: 'center', flexShrink: 0 }}>
                                <RefreshCw size={32} style={{ margin: 'auto' }} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.25rem', lineHeight: 1.1 }}>Start Daily Milk</div>
                                <div style={{ fontSize: '1rem', opacity: 0.9 }}>Set up recurring deliveries</div>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Balance & Status */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                    <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: '#22c55e', color: 'white', width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <IndianRupee size={24} />
                            </div>
                            <div>
                                <div style={{ fontSize: '1rem', color: '#166534', fontWeight: 700 }}>My Balance</div>
                                <div style={{ fontSize: '0.875rem', color: '#15803d' }}>Prepaid Account</div>
                            </div>
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#166534' }}>
                            {formatCurrency(walletBalance)}
                        </div>
                    </div>
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

                <Link to="/wallet" className="btn-secondary" style={{ width: '100%', justifyContent: 'center', padding: '1rem', fontSize: '1.125rem', marginTop: '1rem' }}>
                    <IndianRupee size={20} /> Add Funds to Balance
                </Link>
            </div>
        </div>
    )
}
