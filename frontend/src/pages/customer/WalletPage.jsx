import { useState } from 'react'
import { IndianRupee, Plus, History, ArrowDownLeft, ArrowUpRight, ShieldCheck, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserProfile, useWalletTransactions, addWalletFunds } from '../../lib/useData'
import { useUser } from '@clerk/clerk-react'
import { formatCurrency, formatDate } from '../../lib/utils'
import Navbar from '../../components/Navbar'
import Modal from '../../components/Modal'
import toast from 'react-hot-toast'

export default function WalletPage() {
    const { user } = useUser()
    const { data: profile, loading: profileLoading, refetch: refetchProfile } = useUserProfile(user?.id)
    const { data: transactions, loading: txnsLoading, refetch: refetchTxns } = useWalletTransactions(user?.id)

    const [showTopUp, setShowTopUp] = useState(false)
    const [amount, setAmount] = useState(500)
    const [isProcessing, setIsProcessing] = useState(false)

    async function handleAddFunds() {
        if (amount < 100) { toast.error('Minimum top-up is ₹100'); return }
        setIsProcessing(true)

        setTimeout(async () => {
            try {
                await addWalletFunds(user.id, amount)
                toast.success(`Successfully added ${formatCurrency(amount)} to wallet!`)
                setShowTopUp(false)
                refetchProfile()
                refetchTxns()
            } catch (err) {
                toast.error('Failed to add funds: ' + err.message)
            } finally {
                setIsProcessing(false)
            }
        }, 1500)
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    }

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    }

    if (profileLoading || txnsLoading) {
        return (
            <div className="min-h-screen bg-slate-50 grid place-items-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Syncing Ledger...</p>
                </div>
            </div>
        )
    }

    const balance = profile?.wallet_balance || 0

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            <Navbar />
            
            <motion.main 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 pb-32 md:pb-12"
            >
                {/* Header */}
                <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 md:mb-12">
                    <div className="text-center md:text-left w-full md:w-auto">
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Wallet & Billing</h1>
                        <p className="text-slate-500 font-medium text-sm md:text-base">Manage your balance for uninterrupted morning milk.</p>
                    </div>
                    <button 
                        className="btn-primary w-full md:w-auto !px-8 !py-4 shadow-xl shadow-blue-500/20 active:scale-95 transition-transform flex items-center justify-center gap-2 text-sm"
                        onClick={() => setShowTopUp(true)}
                    >
                        <Plus size={20} /> Recharge Wallet
                    </button>
                </motion.div>

                {/* Visual Wallet Card */}
                <motion.div variants={itemVariants} className="relative mb-8 md:mb-12 group px-1">
                    <div className="absolute inset-0 bg-blue-600 blur-[80px] opacity-20 -z-10 transition-opacity group-hover:opacity-30"></div>
                    <div className="bg-gradient-to-br from-[#1e3a8a] via-[#1d4ed8] to-[#3b82f6] rounded-[28px] md:rounded-[32px] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
                        {/* Abstract patterns */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/20 rounded-full -ml-24 -mb-24 blur-2xl"></div>
                        
                        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                            <div className="w-full md:w-auto">
                                <div className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] opacity-60 mb-2">Available Credits</div>
                                <div className="text-4xl md:text-7xl font-black tracking-tighter flex items-baseline gap-2">
                                    <span className="text-xl md:text-4xl opacity-50">₹</span>
                                {(() => {
                                    const parts = (balance || 0).toFixed(2).split('.')
                                    return (
                                        <>
                                            {Number(parts[0]).toLocaleString('en-IN')}
                                            <span className="text-sm md:text-lg opacity-40">.{parts[1]}</span>
                                        </>
                                    )
                                })()}
                                </div>
                                <div className="mt-8 flex items-center gap-3 bg-white/10 w-fit px-4 py-2 rounded-full backdrop-blur-md border border-white/10 text-[10px] md:text-xs font-bold">
                                    <ShieldCheck size={14} className="text-blue-200" />
                                    Account Securely Linked
                                </div>
                            </div>
                            
                            <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-2">
                                <div className="w-14 h-10 md:w-16 md:h-12 bg-white/20 rounded-xl backdrop-blur-md border border-white/20 flex items-center justify-center">
                                    <IndianRupee size={20} md:size={24} />
                                </div>
                                <div className="text-[9px] md:text-[10px] font-bold opacity-50 uppercase tracking-widest text-right">
                                    Nandini Digital Card<br />{user?.id.split('_').pop().toUpperCase()}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Transactions */}
                <motion.div variants={itemVariants} className="card p-0 overflow-hidden border-slate-100 shadow-xl shadow-slate-200/40 mx-1">
                    <div className="p-5 md:p-6 border-b border-slate-50 flex items-center justify-between">
                        <h2 className="text-base md:text-lg font-black text-slate-800 flex items-center gap-2">
                            <History size={18} md:size={20} className="text-slate-400" />
                            Activity Stream
                        </h2>
                        <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last 30 Days</span>
                    </div>

                    <div className="divide-y divide-slate-50">
                        {(transactions || []).length === 0 ? (
                            <div className="py-16 md:py-20 text-center">
                                <div className="w-14 h-14 md:w-16 md:h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                    <Zap size={28} md:size={32} />
                                </div>
                                <h3 className="font-bold text-slate-800 text-sm md:text-base">No activity yet</h3>
                                <p className="text-slate-400 text-xs md:text-sm">Add funds to start your subscription.</p>
                            </div>
                        ) : (
                            transactions.map(t => {
                                const isAddition = t.amount > 0
                                return (
                                    <div key={t.id} className="p-4 md:p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                        <div className="flex items-center gap-3 md:gap-4">
                                            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0 ${
                                                isAddition ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-600'
                                            }`}>
                                                {isAddition ? <ArrowDownLeft size={20} md:size={24} /> : <ArrowUpRight size={20} md:size={24} />}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-xs md:text-sm font-black text-slate-900 leading-none mb-1 truncate">{t.description}</div>
                                                <div className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                    {formatDate(t.created_at)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`text-base md:text-lg font-black flex-shrink-0 ml-2 ${isAddition ? 'text-emerald-600' : 'text-slate-900'}`}>
                                            {isAddition ? '+' : ''}{formatCurrency(Math.abs(t.amount))}
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </motion.div>
            </motion.main>

            {/* Top Up Modal */}
            <Modal isOpen={showTopUp} onClose={() => !isProcessing && setShowTopUp(false)} title="Security Top-up">
                <div className="space-y-8 p-2">
                    <div className="grid grid-cols-3 gap-3">
                        {[500, 1000, 2000].map(val => (
                            <button
                                key={val}
                                onClick={() => setAmount(val)}
                                className={`py-4 rounded-2xl border-2 transition-all font-black text-sm flex flex-col items-center gap-1 ${
                                    amount === val 
                                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm' 
                                    : 'border-slate-100 text-slate-400 hover:border-slate-200'
                                }`}
                            >
                                <span className="opacity-50 text-[10px]">₹</span>
                                {val}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Or enters custom amount</label>
                        <div className="relative group">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-400 group-focus-within:text-blue-600 transition-colors">₹</span>
                            <input
                                type="number"
                                className="input !pl-10 !py-4 font-black text-xl shadow-inner bg-slate-50/50"
                                value={amount}
                                onChange={e => setAmount(Number(e.target.value))}
                                min={100}
                            />
                        </div>
                    </div>

                    <div className="bg-amber-50 rounded-2xl p-4 flex gap-4 border border-amber-100/50">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 flex-shrink-0">
                            <ShieldCheck size={20} />
                        </div>
                        <p className="text-[11px] font-semibold text-amber-900/60 leading-relaxed">
                            Your balance will be used for daily deductions. Deliveries stop automatically if funds are insufficient. Keep a minimum of ₹500 for a hassle-free experience.
                        </p>
                    </div>

                    <button
                        className="btn-primary w-full !py-5 !text-lg !rounded-2xl shadow-2xl shadow-blue-500/30 active:scale-95 transition-transform"
                        onClick={handleAddFunds}
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <div className="flex items-center justify-center gap-3">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Authenticating...
                            </div>
                        ) : (
                            `Complete Recharge - ${formatCurrency(amount)}`
                        )}
                    </button>
                </div>
            </Modal>
        </div>
    )
}

