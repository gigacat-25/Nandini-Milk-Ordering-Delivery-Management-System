import { useMemo } from 'react'
import { useOrders, usePartialSkipsForTargets } from '../../lib/useData'
import { useUser } from '@clerk/clerk-react'
import { formatCurrency, formatDate } from '../../lib/utils'
import Navbar from '../../components/Navbar'
import { Package, Clock, CheckCircle, XCircle, ChevronRight, Hash, CalendarDays, ShoppingBag } from 'lucide-react'
import { motion } from 'framer-motion'

export default function PreviousOrdersPage() {
    const { user } = useUser()
    const { data: orders, loading: ordersLoading } = useOrders(user?.id)

    const orderIds = useMemo(() => orders?.map(o => o.id) || [], [orders])
    const { data: skips, loading: skipsLoading } = usePartialSkipsForTargets(orderIds)

    if (ordersLoading || skipsLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Retrieving Orders...</p>
                </div>
            </div>
        )
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
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
                className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 pb-32 md:pb-12"
            >
                {/* Header */}
                <motion.div variants={itemVariants} className="mb-8 md:mb-12 text-center md:text-left">
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Order Archives</h1>
                    <p className="text-slate-500 font-medium text-sm md:text-base">History of your one-time dispatches and special orders.</p>
                </motion.div>

                <div className="space-y-6">
                    {(!orders || orders.length === 0) ? (
                        <motion.div variants={itemVariants} className="card p-12 md:p-20 text-center flex flex-col items-center gap-4">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                                <ShoppingBag size={40} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-800">No Orders Recorded</h3>
                                <p className="text-slate-400 text-sm max-w-[240px] mx-auto">Your one-time dairy deliveries will be archived here.</p>
                            </div>
                        </motion.div>
                    ) : (
                        orders.map((order, idx) => {
                            const activeItems = (order.items || []).filter(item => !skips?.some(s => s.target_id === order.id && s.product_id === item.product_id))
                            const effectiveTotal = activeItems.reduce((sum, item) => sum + (item.price_at_time * item.quantity), 0)
                            let effectiveStatus = order.status
                            if (activeItems.length === 0 && (order.items || []).length > 0) effectiveStatus = 'cancelled'

                            const isDelivered = effectiveStatus === 'delivered'
                            const isCancelled = effectiveStatus === 'cancelled'

                            return (
                                <motion.div 
                                    key={order.id} 
                                    variants={itemVariants}
                                    className="card p-0 md:p-0 overflow-hidden border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-slate-200/60 transition-all group"
                                >
                                    {/* Order Status Bar */}
                                    <div className={`h-1.5 w-full ${
                                        isDelivered ? 'bg-emerald-500' : isCancelled ? 'bg-red-500' : 'bg-blue-500'
                                    }`} />
                                    
                                    <div className="p-5 md:p-8">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                                                    isDelivered ? 'bg-emerald-50 text-emerald-600' : isCancelled ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                                                }`}>
                                                    <Package size={28} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                            <Hash size={12} /> ID #{order.id.slice(0, 8)}
                                                        </span>
                                                        <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter flex items-center gap-1 ${
                                                            isDelivered ? 'bg-emerald-100 text-emerald-700' : isCancelled ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                                        }`}>
                                                            {isDelivered && <CheckCircle size={10} />}
                                                            {isCancelled && <XCircle size={10} />}
                                                            {effectiveStatus}
                                                        </div>
                                                    </div>
                                                    <div className="text-lg font-black text-slate-900 leading-tight">Delivered {formatDate(order.created_at)}</div>
                                                </div>
                                            </div>
                                            <div className="text-left md:text-right w-full md:w-auto p-4 md:p-0 bg-slate-50 md:bg-transparent rounded-2xl">
                                                <div className="text-2xl font-black text-slate-900 tracking-tight">
                                                    {formatCurrency(effectiveTotal)}
                                                </div>
                                                {effectiveTotal !== order.total_amount && (
                                                    <div className="text-xs font-bold text-slate-400 line-through">
                                                        {formatCurrency(order.total_amount)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Order Contents</div>
                                                <div className="h-px bg-slate-100 flex-grow mx-4"></div>
                                            </div>
                                            
                                            <div className="space-y-3">
                                                {(order.items || []).map((item, idx) => {
                                                    const isSkipped = skips?.some(s => s.target_id === order.id && s.product_id === item.product_id)
                                                    return (
                                                        <div key={idx} className="flex justify-between items-center group/item">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${isSkipped ? 'bg-slate-50 text-slate-300' : 'bg-blue-50 text-blue-600'}`}>
                                                                    {item.quantity}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className={`text-sm font-bold ${isSkipped ? 'text-slate-300 line-through' : 'text-slate-700'}`}>
                                                                        {item.products?.name || 'Product'}
                                                                    </span>
                                                                    {isSkipped && <span className="text-[9px] font-black uppercase text-red-400 tracking-tighter">Cancelled Item</span>}
                                                                </div>
                                                            </div>
                                                            <span className={`text-sm font-black ${isSkipped ? 'text-slate-300' : 'text-slate-900'}`}>
                                                                {formatCurrency(item.price_at_time * item.quantity)}
                                                            </span>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>

                                        <div className="mt-8 pt-6 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-4">
                                            <div className="flex items-center gap-3 text-slate-500">
                                                <CalendarDays size={16} className="text-slate-400" />
                                                <div className="text-[11px] font-bold">
                                                    Scheduled for <span className="text-slate-900 font-black">{formatDate(order.delivery_date)}</span> during <span className="text-blue-600 font-black uppercase">{order.delivery_slot}</span>
                                                </div>
                                            </div>
                                            <button className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest hover:translate-x-1 transition-transform group-hover:text-blue-700">
                                                Invoice Details <ChevronRight size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })
                    )}
                </div>
            </motion.main>
        </div>
    )
}
