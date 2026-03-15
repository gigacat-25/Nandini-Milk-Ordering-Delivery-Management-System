import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { TrendingUp, IndianRupee, Users, ShoppingBag } from 'lucide-react'
import { useOrders, useCustomers, useSubscriptions, useProducts } from '../../lib/useData'
import { formatCurrency } from '../../lib/utils'
import Navbar from '../../components/Navbar'

const PIE_COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe']

export default function AdminAnalytics() {
    const { data: orders, loading: ordersLoading } = useOrders()
    const { data: customers, loading: custLoading } = useCustomers()
    const { data: subscriptions, loading: subsLoading } = useSubscriptions()
    const { data: products, loading: productsLoading } = useProducts()

    // Compute live metrics
    const totalRevenue = (orders || []).reduce((s, d) => s + d.total_amount, 0)
    const totalOrders = (orders || []).length
    const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0
    const activeCustomers = new Set((subscriptions || []).filter(s => s.status === 'active').map(s => s.customer_id)).size

    // Dynamic Sales Data by month
    const salesDataMap = {}
        ; (orders || []).forEach(o => {
            const month = new Date(o.created_at).toLocaleString('default', { month: 'short' })
            if (!salesDataMap[month]) {
                salesDataMap[month] = { month, revenue: 0, orders: 0 }
            }
            salesDataMap[month].revenue += o.total_amount
            salesDataMap[month].orders += 1
        })
    const monthsOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const SALES_DATA = Object.values(salesDataMap).sort((a, b) => {
        return monthsOrder.indexOf(a.month) - monthsOrder.indexOf(b.month)
    })

    // Dynamic Product Sales Pie Chart
    const productSalesMap = {}
    let totalItemsSold = 0
        ; (orders || []).forEach(o => {
            (o.items || []).forEach(item => {
                productSalesMap[item.product_id] = (productSalesMap[item.product_id] || 0) + item.quantity
                totalItemsSold += item.quantity
            })
        })

    const PRODUCT_SALES_RAW = Object.entries(productSalesMap).map(([id, qty]) => {
        const product = (products || []).find(p => p.id === id)
        return {
            name: product ? product.name : `Prod-${id.substring(0, 4)}`,
            value: totalItemsSold > 0 ? Math.round((qty / totalItemsSold) * 100) : 0
        }
    }).sort((a, b) => b.value - a.value)

    // Fallback if no real data
    const PRODUCT_SALES = PRODUCT_SALES_RAW.length > 0 ? PRODUCT_SALES_RAW : [{ name: 'No Data', value: 100 }]
    const CHART_DATA = SALES_DATA.length > 0 ? SALES_DATA : [{ month: 'Current', revenue: 0, orders: 0 }]

    if (ordersLoading || custLoading || subsLoading || productsLoading) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', color: '#64748b' }}>Loading analytics...</div>

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
            <Navbar />
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem' }}>
                <div className="page-header">
                    <h1 className="page-title">Sales Analytics</h1>
                    <p className="page-subtitle">Live revenue and order trends from Supabase database.</p>
                </div>

                {/* KPI Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { icon: IndianRupee, label: 'Historical Revenue', value: formatCurrency(totalRevenue), sub: 'All-time volume', color: '#2563eb', bg: '#dbeafe' },
                        { icon: ShoppingBag, label: 'Total Orders', value: totalOrders.toLocaleString(), sub: 'All-time volume', color: '#059669', bg: '#d1fae5' },
                        { icon: TrendingUp, label: 'Avg. Order Value', value: formatCurrency(Math.round(avgOrder)), sub: 'Per transaction', color: '#7c3aed', bg: '#ede9fe' },
                        { icon: Users, label: 'Active Subscribers', value: activeCustomers, sub: 'Currently active', color: '#f59e0b', bg: '#fef3c7' },
                    ].map((s) => (
                        <div key={s.label} className="stat-card">
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
                                <div style={{ width: 44, height: 44, background: s.bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
                                    <s.icon size={20} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.2rem' }}>{s.label}</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{s.value}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '0.2rem' }}>{s.sub}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Charts Row */}
                <div className="flex flex-col lg:grid lg:grid-cols-[2fr_1fr] gap-6 mb-6">
                    {/* Revenue Trend */}
                    <div className="card">
                        <h3 style={{ margin: '0 0 1.5rem', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Monthly Revenue Trend</h3>
                        <ResponsiveContainer width="100%" height={240}>
                            <AreaChart data={CHART_DATA}>
                                <defs>
                                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="month" fontSize={12} tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis fontSize={12} tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                                <Tooltip formatter={(v) => [formatCurrency(v), 'Revenue']} contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13 }} />
                                <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2.5} fill="url(#revGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Product Sales Pie */}
                    <div className="card">
                        <h3 style={{ margin: '0 0 1.5rem', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Product Mix</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={PRODUCT_SALES} dataKey="value" outerRadius={80} innerRadius={50} paddingAngle={3}>
                                    {PRODUCT_SALES.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(v) => [`${v}%`, 'Share']} contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13 }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.75rem' }}>
                            {PRODUCT_SALES.map((p, i) => (
                                <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ width: 10, height: 10, borderRadius: 2, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                                        <span style={{ color: '#64748b' }}>{p.name}</span>
                                    </div>
                                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{p.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Orders Bar Chart */}
                <div className="card">
                    <h3 style={{ margin: '0 0 1.5rem', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Monthly Orders Volume</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={CHART_DATA} barSize={36}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="month" fontSize={12} tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <YAxis fontSize={12} tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13 }} />
                            <Bar dataKey="orders" fill="#2563eb" radius={[6, 6, 0, 0]} name="Orders" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}
