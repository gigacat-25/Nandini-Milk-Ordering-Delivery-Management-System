import { Link } from 'react-router-dom'
import { ShoppingBag, RefreshCw, IndianRupee, ChevronRight, Package, ArrowUpRight, TrendingUp } from 'lucide-react'
import { useUser } from '@clerk/clerk-react'
import { motion } from 'framer-motion'
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
    const walletBalance = profile?.wallet_balance || 0

    if (!isLoaded || ordersLoading || subsLoading || skipsLoading || profileLoading) {
        return (
            <div className="min-h-screen grid place-items-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium">Loading your dashboard...</p>
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

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            <Navbar />
            
            <motion.main 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
            >
                {/* Header Section */}
                <motion.div variants={itemVariants} className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                            Namaste, {user?.firstName || 'there'}! 👋
                        </h1>
                        <p className="text-slate-500 mt-1 font-medium italic">
                            Everything looks great for your deliveries today.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
                        <TrendingUp size={16} />
                        Next delivery tomorrow morning
                    </div>
                </motion.div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Left Column: Quick Actions & Balance */}
                    <div className="lg:col-span-8 space-y-6">
                        
                        {/* Stats Banner */}
                        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Link to="/products?type=one-time" className="group relative overflow-hidden card bg-gradient-blue border-none p-0">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                                <div className="p-6 flex items-center gap-5 text-white">
                                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-inner overflow-hidden">
                                        <ShoppingBag size={28} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">On-Demand</div>
                                        <div className="text-xl font-extrabold flex items-center gap-2">
                                            Order for Tomorrow <ArrowUpRight size={18} />
                                        </div>
                                    </div>
                                </div>
                            </Link>

                            <Link to="/products?type=subscription" className="group relative overflow-hidden card bg-gradient-emerald border-none p-0">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                                <div className="p-6 flex items-center gap-5 text-white">
                                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-inner">
                                        <RefreshCw size={28} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Subscription</div>
                                        <div className="text-xl font-extrabold flex items-center gap-2">
                                            Manage Daily Milk <ArrowUpRight size={18} />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>

                        {/* Recent Activity Card */}
                        <motion.div variants={itemVariants} className="card p-0 overflow-hidden">
                            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-slate-800">Today's Schedule</h3>
                                <div className="badge badge-success lowercase font-semibold">Live status</div>
                            </div>
                            <div className="p-6">
                                {todayDeliveries.length === 0 ? (
                                    <div className="text-center py-10">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                            <Package size={24} className="text-slate-400" />
                                        </div>
                                        <p className="text-slate-600 font-semibold mb-2">No active deliveries for today</p>
                                        <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">Start a subscription or place a one-time order to see it here.</p>
                                        <Link to="/products" className="btn-primary">Browse Products</Link>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {todayDeliveries.map((s) => {
                                            const itemsStr = s.activeItems?.map(i => `${i.quantity}x ${i.products?.name}`).join(', ') || 'No Items'
                                            const subTotal = s.activeItems?.reduce((sum, i) => sum + (i.price_at_time * i.quantity), 0) || 0
                                            return (
                                                <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 hover:bg-slate-50 transition-colors group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                                            <Package size={20} />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-900">{itemsStr}</div>
                                                            <div className="text-xs text-slate-500 font-medium">Daily Subscription • Morning Slot</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-extrabold text-slate-900">{formatCurrency(subTotal)}</div>
                                                        <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">Confirmed</div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column: Wallet & Recent Orders */}
                    <div className="lg:col-span-4 space-y-6">
                        
                        {/* Wallet Card */}
                        <motion.div variants={itemVariants} className="card bg-slate-900 border-none relative overflow-hidden group">
                            <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-colors"></div>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white backdrop-blur-md">
                                        <IndianRupee size={22} />
                                    </div>
                                    <Link to="/wallet" className="text-blue-400 hover:text-white transition-colors">
                                        <ArrowUpRight size={24} />
                                    </Link>
                                </div>
                                <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Available Funds</div>
                                <div className="text-4xl font-black text-white mb-6">
                                    {formatCurrency(walletBalance)}
                                </div>
                                <Link to="/wallet" className="flex items-center justify-center w-full py-4 bg-white text-slate-900 rounded-2xl font-bold text-sm hover:bg-blue-50 transition-colors">
                                    Recharge Wallet
                                </Link>
                            </div>
                        </motion.div>

                        {/* Recent Orders List */}
                        <motion.div variants={itemVariants} className="card p-0">
                            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Recent Orders</h3>
                                <Link to="/reports" className="text-blue-600 font-bold text-xs flex items-center hover:translate-x-1 transition-transform">
                                    Full History <ChevronRight size={14} />
                                </Link>
                            </div>
                            <div className="p-4 space-y-2">
                                {recentOrders.map((o) => {
                                    const isDelivered = o.status === 'delivered'
                                    return (
                                        <div key={o.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDelivered ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                                    <Package size={18} />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-slate-900">Order #{o.id.slice(0, 6).toUpperCase()}</div>
                                                    <div className="text-[10px] text-slate-500 font-semibold">{formatDate(o.delivery_date)}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs font-black text-slate-900">{formatCurrency(o.total_amount)}</div>
                                                <div className={`text-[9px] font-bold uppercase ${isDelivered ? 'text-emerald-500' : 'text-blue-500'}`}>{o.status}</div>
                                            </div>
                                        </div>
                                    )
                                })}
                                {recentOrders.length === 0 && <p className="text-center py-4 text-xs font-medium text-slate-400">No recent orders</p>}
                            </div>
                        </motion.div>

                    </div>
                </div>
            </motion.main>
        </div>
    )
}

