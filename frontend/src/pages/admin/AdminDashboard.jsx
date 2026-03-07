import { Link } from 'react-router-dom'
import { Users, ShoppingBag, Truck, IndianRupee, RefreshCw, TrendingUp, Package, AlertTriangle, ChevronRight } from 'lucide-react'
import { MOCK_ORDERS, MOCK_CUSTOMERS, MOCK_SUBSCRIPTIONS, PRODUCTS } from '../../lib/mockData'
import { formatCurrency, formatDate } from '../../lib/utils'
import Navbar from '../../components/Navbar'
import StatsCard from '../../components/StatsCard'

export default function AdminDashboard() {
    const activeSubscriptions = MOCK_CUSTOMERS.reduce((sum, c) => sum + c.subscriptions, 0)
    const tomorrowMilkReq = {
        'Toned Milk 1L': 68,
        'Toned Milk 500ml': 42,
        'Full Cream 500ml': 22,
        'Curd 500g': 18,
        'Curd 1kg': 8,
        'Ghee 200ml': 5,
    }
    const totalPackets = Object.values(tomorrowMilkReq).reduce((s, v) => s + v, 0)
    const todayRevenue = MOCK_ORDERS.reduce((s, o) => s + o.total_amount, 0)
    const pendingOrders = MOCK_ORDERS.filter(o => o.status === 'pending').length

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
                    <StatsCard icon={Users} label="Active Customers" value={MOCK_CUSTOMERS.length} sub={`${activeSubscriptions} subscriptions`} color="#059669" bg="#d1fae5" />
                    <StatsCard icon={IndianRupee} label="Today's Revenue" value={formatCurrency(todayRevenue)} sub="From all orders" color="#7c3aed" bg="#ede9fe" />
                    <StatsCard icon={AlertTriangle} label="Pending Orders" value={pendingOrders} sub="Need confirmation" color="#dc2626" bg="#fee2e2" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    {/* Tomorrow's Stock Requirement */}
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 700, color: '#0f172a' }}>🥛 Tomorrow's Requirement</h2>
                            <Link to="/admin/delivery" style={{ color: '#2563eb', fontSize: '0.8125rem', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                Full Report <ChevronRight size={14} />
                            </Link>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                            {Object.entries(tomorrowMilkReq).map(([item, qty]) => (
                                <div key={item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0.875rem', background: '#f8fafc', borderRadius: 8 }}>
                                    <span style={{ fontSize: '0.875rem', color: '#374151', fontWeight: 500 }}>{item}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: 80, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                                            <div style={{ width: `${(qty / totalPackets) * 100}%`, height: '100%', background: '#2563eb', borderRadius: 3 }} />
                                        </div>
                                        <span style={{ fontWeight: 700, color: '#2563eb', minWidth: 28, textAlign: 'right' }}>{qty}</span>
                                    </div>
                                </div>
                            ))}
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
                            <Link to="/admin/orders" style={{ color: '#2563eb', fontSize: '0.8125rem', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                View All <ChevronRight size={14} />
                            </Link>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                            {MOCK_ORDERS.slice(0, 5).map((o) => (
                                <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0.875rem', background: '#f8fafc', borderRadius: 8 }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f172a' }}>{o.customer_name}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{o.id}</div>
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
                        { to: '/admin/orders', icon: ShoppingBag, label: 'Manage Orders', color: '#2563eb', bg: '#dbeafe' },
                        { to: '/admin/customers', icon: Users, label: 'Customers', color: '#059669', bg: '#d1fae5' },
                        { to: '/admin/delivery', icon: Truck, label: 'Delivery Report', color: '#7c3aed', bg: '#ede9fe' },
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
