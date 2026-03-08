import { Link } from 'react-router-dom'
import { Users, ShoppingBag, Truck, IndianRupee, RefreshCw, TrendingUp, Package, AlertTriangle, ChevronRight } from 'lucide-react'
import { useOrders, useCustomers, useSubscriptions } from '../../lib/useData'
import { formatCurrency } from '../../lib/utils'
import Navbar from '../../components/Navbar'
import StatsCard from '../../components/StatsCard'

export default function AdminDashboard() {
    const { data: orders } = useOrders()
    const { data: customers } = useCustomers()
    const { data: subscriptions } = useSubscriptions()

    const activeSubs = (subscriptions || []).filter(s => s.status === 'active')
    const activeSubCount = activeSubs.length

    // Calculate tomorrow's generic requirement based on active subscriptions
    // Data shape: sub.items[] → each item has item.products.name, item.products.size_label, item.quantity
    const tomorrowMilkReq = {}
    activeSubs.forEach(sub => {
        ; (sub.items || []).forEach(item => {
            const label = `${item.products?.name || 'Unknown'} ${item.products?.size_label || ''}`.trim()
            tomorrowMilkReq[label] = (tomorrowMilkReq[label] || 0) + (item.quantity || 0)
        })
    })

    const totalPackets = Object.values(tomorrowMilkReq).reduce((s, v) => s + v, 0)


    // Revenue from confirmed/delivered orders today
    const todayRevenue = (orders || []).reduce((s, o) => s + o.total_amount, 0)
    const pendingOrders = (orders || []).filter(o => o.status === 'confirmed').length

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
            <Navbar />
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem' }}>
                {/* Header */}
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem' }}>Admin Dashboard</h1>
                    <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>Nandini Milk Store · Vaderhalli, Bengaluru</p>
                </div>

                {/* Stat Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    <StatsCard icon={Package} label="Tomorrow's Packets" value={totalPackets} sub="Total required" color="#2563eb" bg="#dbeafe" />
                    <StatsCard icon={Users} label="Registered Users" value={(customers || []).length} sub={`${activeSubCount} active subscriptions`} color="#059669" bg="#d1fae5" />
                    <StatsCard icon={IndianRupee} label="Total Order Revenue" value={formatCurrency(todayRevenue)} sub="Historical" color="#7c3aed" bg="#ede9fe" />
                    <StatsCard icon={AlertTriangle} label="Actionable Orders" value={pendingOrders} sub="Need delivery" color="#dc2626" bg="#fee2e2" />
                </div>

                <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 mb-6">
                    {/* Tomorrow's Stock Requirement */}
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 700, color: '#0f172a' }}>🥛 Tomorrow's Requirement</h2>
                            <Link to="/admin/delivery" style={{ color: '#2563eb', fontSize: '0.8125rem', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                Full Report <ChevronRight size={14} />
                            </Link>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                            {Object.entries(tomorrowMilkReq).length === 0 ? (
                                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '1rem' }}>No active subscriptions found.</div>
                            ) : (
                                Object.entries(tomorrowMilkReq).map(([item, qty]) => (
                                    <div key={item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0.875rem', background: '#f8fafc', borderRadius: 8 }}>
                                        <span style={{ fontSize: '0.875rem', color: '#374151', fontWeight: 500 }}>{item}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ width: 80, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                                                <div style={{ width: `${(qty / totalPackets) * 100}%`, height: '100%', background: '#2563eb', borderRadius: 3 }} />
                                            </div>
                                            <span style={{ fontWeight: 700, color: '#2563eb', minWidth: 28, textAlign: 'right' }}>{qty}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 700, color: '#0f172a' }}>Total Packets</span>
                                <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#2563eb' }}>{totalPackets}</span>
                            </div>
                        </div>
                    </div>

                    {/* Recent Orders */}
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 700, color: '#0f172a' }}>Recent Orders</h2>
                            <Link to="/admin/delivery" style={{ color: '#2563eb', fontSize: '0.8125rem', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                Manage Delivery <ChevronRight size={14} />
                            </Link>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                            {(orders || []).slice(0, 5).map((o) => (
                                <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0.875rem', background: '#f8fafc', borderRadius: 8 }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f172a' }}>{o.id.split('-')[0]}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Order created today</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{formatCurrency(o.total_amount)}</div>
                                        <span className={o.status === 'delivered' ? 'badge-success' : o.status === 'confirmed' ? 'badge-blue' : 'badge-warning'} style={{ fontSize: '0.7rem' }}>{o.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                    {[
                        { to: '/admin/delivery', icon: Truck, label: 'Delivery Report', color: '#7c3aed', bg: '#ede9fe' },
                        { to: '/admin/customers', icon: Users, label: 'Customers', color: '#059669', bg: '#d1fae5' },
                        { to: '/admin/products', icon: Package, label: 'Products', color: '#f59e0b', bg: '#fef3c7' },
                        { to: '/admin/analytics', icon: TrendingUp, label: 'Analytics', color: '#dc2626', bg: '#fee2e2' },
                    ].map((a) => (
                        <Link key={a.to} to={a.to} style={{ textDecoration: 'none' }}>
                            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', cursor: 'pointer' }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = '#bfdbfe'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)' }}
                            >
                                <div style={{ width: 40, height: 40, background: a.bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: a.color, flexShrink: 0 }}>
                                    <a.icon size={18} />
                                </div>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>{a.label}</div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}
