import { Link } from 'react-router-dom'
import { Users, ShoppingBag, Truck, IndianRupee, RefreshCw, TrendingUp, Package, AlertTriangle, ChevronRight, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { useOrders, useCustomers, useSubscriptions } from '../../lib/useData'
import { formatCurrency } from '../../lib/utils'
import Navbar from '../../components/Navbar'

export default function AdminDashboard() {
    const { data: orders, loading: ordersLoading } = useOrders()
    const { data: customers, loading: customersLoading } = useCustomers()
    const { data: subscriptions, loading: subsLoading } = useSubscriptions()

    const activeSubs = (subscriptions || []).filter(s => s.status === 'active')
    const activeSubCount = activeSubs.length

    const tomorrowMilkReq = {}
    activeSubs.forEach(sub => {
        ; (sub.items || []).forEach(item => {
            const label = `${item.products?.name || 'Unknown'} ${item.products?.size_label || ''}`.trim()
            tomorrowMilkReq[label] = (tomorrowMilkReq[label] || 0) + (item.quantity || 0)
        })
    })

    const totalPackets = Object.values(tomorrowMilkReq).reduce((s, v) => s + v, 0)
    const todayRevenue = (orders || []).reduce((s, o) => s + o.total_amount, 0)
    const pendingOrders = (orders || []).filter(o => o.status === 'confirmed').length

    if (ordersLoading || customersLoading || subsLoading) {
        return (
            <div className="min-h-screen grid place-items-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium">Crunching your numbers...</p>
                </div>
            </div>
        )
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    }

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    }

    const stats = [
        { label: "Tomorrow's Packets", value: totalPackets, sub: "Total Requirement", icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Active Customers", value: (customers || []).length, sub: `${activeSubCount} Active Subscriptions`, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Revenue Forecast", value: formatCurrency(todayRevenue), sub: "Daily Historical", icon: IndianRupee, color: "text-purple-600", bg: "bg-purple-50" },
        { label: "Pending Actions", value: pendingOrders, sub: "Requires Delivery", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
    ]

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            <Navbar />
            
            <motion.main 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
            >
                {/* Header */}
                <motion.div variants={itemVariants} className="mb-8">
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">System Overview</h1>
                    <p className="text-slate-500 font-medium">Monitoring Nandini Milk • Vaderhalli Operations</p>
                </motion.div>

                {/* Stats Grid */}
                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {stats.map((stat, i) => (
                        <div key={i} className="card group hover:scale-[1.02]">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12`}>
                                    <stat.icon size={24} />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</div>
                                    <div className="text-2xl font-black text-slate-900">{stat.value}</div>
                                    <div className="text-[10px] font-semibold text-slate-500">{stat.sub}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Tomorrow's Requirement */}
                    <motion.div variants={itemVariants} className="card p-0 overflow-hidden">
                        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-800">Milk Distribution Forecast</h3>
                            <Link to="/admin/delivery" className="text-blue-600 font-bold text-xs flex items-center hover:translate-x-1 transition-transform">
                                Full Breakdown <ChevronRight size={14} />
                            </Link>
                        </div>
                        <div className="p-6 space-y-4">
                            {Object.entries(tomorrowMilkReq).length === 0 ? (
                                <div className="text-center py-10 text-slate-400 italic">No active subscriptions found.</div>
                            ) : (
                                Object.entries(tomorrowMilkReq).map(([item, qty]) => (
                                    <div key={item} className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-bold text-slate-700">{item}</span>
                                            <span className="font-black text-blue-600">{qty} pkts</span>
                                        </div>
                                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(qty / totalPackets) * 100}%` }}
                                                transition={{ duration: 1, ease: "easeOut" }}
                                                className="bg-blue-600 h-full rounded-full"
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                            <div className="mt-6 pt-6 border-t border-slate-100 flex justify-between items-center text-slate-900">
                                <span className="text-sm font-bold uppercase tracking-wider text-slate-500">Gross Requirement</span>
                                <span className="text-3xl font-black text-blue-600">{totalPackets} <span className="text-sm font-bold text-slate-400">total units</span></span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Recent Orders */}
                    <motion.div variants={itemVariants} className="card p-0 overflow-hidden">
                        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-800">Fresh Incoming Orders</h3>
                            <Link to="/admin/delivery" className="text-blue-600 font-bold text-xs flex items-center hover:translate-x-1 transition-transform">
                                Manager Deliveries <ChevronRight size={14} />
                            </Link>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {(orders || []).slice(0, 5).map((o) => (
                                <div key={o.id} className="p-4 hover:bg-slate-50/50 transition-colors flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-400">
                                            <Package size={20} />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-slate-900 uppercase">ID: {o.id.split('-')[0]}</div>
                                            <div className="text-[10px] text-slate-500 font-bold">{o.customer_name || 'Generic Customer'}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-black text-slate-900">{formatCurrency(o.total_amount)}</div>
                                        <div className={`text-[9px] font-bold uppercase tracking-tighter px-2 py-0.5 rounded-full inline-block ${
                                            o.status === 'delivered' ? 'bg-emerald-50 text-emerald-600' : 
                                            o.status === 'confirmed' ? 'bg-blue-50 text-blue-600' : 
                                            'bg-amber-50 text-amber-600'
                                        }`}>{o.status}</div>
                                    </div>
                                </div>
                            ))}
                            {(orders || []).length === 0 && <p className="text-center py-10 text-slate-400">No orders placed yet today.</p>}
                        </div>
                    </motion.div>
                </div>

                {/* Control Panel */}
                <motion.div variants={itemVariants}>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Operations Console</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {[
                            { to: '/admin/delivery', icon: Truck, label: 'Dispatch', color: 'text-purple-600', bg: 'bg-purple-50' },
                            { to: '/admin/subscriptions', icon: RefreshCw, label: 'Recurring', color: 'text-pink-600', bg: 'bg-pink-50' },
                            { to: '/admin/customers', icon: Users, label: 'Clients', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                            { to: '/admin/products', icon: Package, label: 'Inventory', color: 'text-amber-600', bg: 'bg-amber-50' },
                            { to: '/admin/analytics', icon: TrendingUp, label: 'Growth', color: 'text-red-600', bg: 'bg-red-50' },
                        ].map((a) => (
                            <Link key={a.to} to={a.to} className="card group hover:bg-white hover:shadow-xl hover:shadow-blue-900/5 transition-all">
                                <div className="flex flex-col items-center gap-3 text-center">
                                    <div className={`w-12 h-12 ${a.bg} ${a.color} rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all`}>
                                        <a.icon size={24} />
                                    </div>
                                    <div className="text-xs font-black text-slate-900 uppercase tracking-tighter">{a.label}</div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </motion.div>
            </motion.main>
        </div>
    )
}

