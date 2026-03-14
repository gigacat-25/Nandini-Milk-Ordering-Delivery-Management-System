import { useState } from 'react'
import { Plus, Pause, Play, Trash2, RefreshCw, Calendar, Sparkles, ExternalLink, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSubscriptions, pauseSubscriptionDate, toggleSubscriptionStatus, deleteSubscription } from '../../lib/useData'
import { useUser } from '@clerk/clerk-react'
import { formatCurrency, formatDate } from '../../lib/utils'
import Navbar from '../../components/Navbar'
import Modal from '../../components/Modal'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

export default function SubscriptionsPage() {
    const { user } = useUser()
    const { data: subs, loading, refetch } = useSubscriptions(user?.id)
    const navigate = useNavigate()

    const [showPause, setShowPause] = useState(null)
    const [pauseDate, setPauseDate] = useState('')

    async function togglePause(sub) {
        const newStatus = sub.status === 'active' ? 'paused' : 'active'
        try {
            await toggleSubscriptionStatus(sub.id, user.id, newStatus)
            toast.success(newStatus === 'active' ? 'Subscription resumed' : 'Subscription paused')
            refetch()
        } catch (err) {
            toast.error('Failed to update: ' + err.message)
        }
    }

    async function deleteSub(id) {
        try {
            await deleteSubscription(id)
            toast.success('Subscription cancelled')
            refetch()
        } catch (err) {
            toast.error('Failed to cancel: ' + err.message)
        }
    }

    async function addPause() {
        if (!pauseDate) { toast.error('Select a date to pause'); return }
        try {
            await pauseSubscriptionDate(showPause, pauseDate)
            toast.success(`Delivery paused for ${formatDate(pauseDate)}`)
            setShowPause(null)
            setPauseDate('')
            refetch()
        } catch (err) {
            toast.error('Failed to pause: ' + err.message)
        }
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    }

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading Schedules...</p>
                </div>
            </div>
        )
    }

    const activeSubs = (subs || []).filter(s => s.status === 'active')
    const monthlyEst = activeSubs.reduce((sum, s) => {
        const subTotal = s.items?.reduce((sum, i) => sum + ((i.price_at_time ?? i.products?.price ?? 0) * i.quantity), 0) || 0
        return sum + subTotal * 30
    }, 0)

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            <Navbar />
            
            <motion.main 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
            >
                {/* Header */}
                <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Active Schedules</h1>
                        <p className="text-slate-500 font-medium">Auto-delivery of fresh milk every single morning.</p>
                    </div>
                    <button 
                        className="btn-primary !px-6 !py-3.5 shadow-xl shadow-blue-500/10 flex items-center gap-2"
                        onClick={() => navigate('/products?type=subscription')}
                    >
                        <Plus size={20} /> Create New Plan
                    </button>
                </motion.div>

                {/* Summary Grid */}
                <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                    {[
                        { label: 'Active Plans', value: activeSubs.length, icon: Play, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Paused', value: (subs || []).filter(s => s.status === 'paused').length, icon: Pause, color: 'text-amber-600', bg: 'bg-amber-50' },
                        { label: 'Monthly Forecast', value: formatCurrency(monthlyEst), icon: Sparkles, color: 'text-blue-600', bg: 'bg-blue-50' },
                    ].map((stat) => (
                        <div key={stat.label} className="card p-6 flex items-center gap-4 bg-white border-slate-100 shadow-sm">
                            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`}>
                                <stat.icon size={24} />
                            </div>
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</div>
                                <div className={`text-xl font-black ${stat.color}`}>{stat.value}</div>
                            </div>
                        </div>
                    ))}
                </motion.div>

                {/* List */}
                <div className="space-y-6">
                    {(subs || []).length === 0 ? (
                        <motion.div variants={itemVariants} className="card py-20 text-center flex flex-col items-center gap-6">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                <RefreshCw size={40} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-800">You have no active plans</h3>
                                <p className="text-slate-400 font-medium max-w-sm mx-auto mt-2">
                                    Subscribe once and we'll deliver fresh milk to your doorstep every morning without you lifting a finger.
                                </p>
                            </div>
                            <button className="btn-secondary !text-blue-600 border-blue-100" onClick={() => navigate('/products?type=subscription')}>
                                Create first subscription
                            </button>
                        </motion.div>
                    ) : (
                        subs.map((s) => {
                            const subTotal = s.items?.reduce((sum, i) => sum + ((i.price_at_time ?? i.products?.price ?? 0) * i.quantity), 0) || 0
                            const isActive = s.status === 'active'

                            return (
                                <motion.div 
                                    key={s.id} 
                                    variants={itemVariants}
                                    className={`card overflow-hidden transition-all border-l-8 ${isActive ? 'border-l-emerald-500' : 'border-l-slate-300'}`}
                                >
                                    <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-8">
                                        {/* Status & Icon */}
                                        <div className="flex flex-row md:flex-col items-center gap-4">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-slate-200/50 ${isActive ? 'bg-emerald-50' : 'bg-slate-100'}`}>
                                                🥛
                                            </div>
                                            <span className={`badge-${isActive ? 'success' : 'warning'} !rounded-full !px-4`}>{s.status}</span>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-2">
                                                Morning Delivery Plan
                                            </h3>
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {s.items?.map((item, idx) => (
                                                    <span key={idx} className="bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                                                        <span className="w-4 h-4 bg-slate-200 rounded-md flex items-center justify-center text-[10px]">{item.quantity}</span>
                                                        {item.products?.name}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                <div className="flex items-center gap-1.5"><Calendar size={14} /> Daily</div>
                                                <div className="flex items-center gap-1.5"><RefreshCw size={14} /> Created {formatDate(s.created_at)}</div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-row md:flex-col items-start md:items-end justify-between md:justify-center gap-6 border-t md:border-t-0 border-slate-50 pt-6 md:pt-0">
                                            <div className="text-right">
                                                <div className="text-2xl font-black text-slate-900 leading-none mb-1">{formatCurrency(subTotal)}</div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Per Delivery</div>
                                            </div>
                                            
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => togglePause(s)}
                                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                                        isActive 
                                                        ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' 
                                                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                                    }`}
                                                    title={isActive ? 'Pause' : 'Resume'}
                                                >
                                                    {isActive ? <Pause size={20} /> : <Play size={20} />}
                                                </button>
                                                <button
                                                    onClick={() => setShowPause(s.id)}
                                                    className="w-10 h-10 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-all"
                                                    title="Skip a morning"
                                                >
                                                    <Calendar size={20} />
                                                </button>
                                                <button
                                                    onClick={() => { if (confirm('Cancel this subscription?')) deleteSub(s.id) }}
                                                    className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-100 transition-all border border-red-100/50"
                                                    title="Cancel"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })
                    )}
                </div>
            </motion.main>

            {/* Skip Day Modal */}
            <Modal isOpen={!!showPause} onClose={() => setShowPause(null)} title="Skip Delivery" size="sm">
                <div className="space-y-6 pt-2">
                    <div className="bg-blue-50 rounded-2xl p-4 flex gap-4 border border-blue-100/50">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 flex-shrink-0">
                            <Clock size={20} />
                        </div>
                        <p className="text-[11px] font-semibold text-blue-900/60 leading-relaxed">
                            Skipping a day will pause your delivery only for that date. Regular deliveries will resume automatically from the next cycle.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Select skip date</label>
                        <input 
                            className="input !py-4 font-black" 
                            type="date" 
                            value={pauseDate} 
                            onChange={e => setPauseDate(e.target.value)} 
                            min={new Date().toISOString().split('T')[0]} 
                        />
                    </div>
                    
                    <div className="flex gap-4">
                        <button className="btn-secondary flex-1 !rounded-xl" onClick={() => setShowPause(null)}>Dismiss</button>
                        <button className="btn-primary flex-1 !rounded-xl" onClick={addPause}>Confirm Skip</button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

