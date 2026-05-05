import { useState, useMemo, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle, MapPin, Phone, MessageSquare, ExternalLink, Loader2, Lock, Camera, X, Image, ArrowLeft, AlertCircle, Zap, ShieldCheck, CreditCard, ChevronRight } from 'lucide-react'
import { useDeliverySummary, markOrderDelivered, markSubscriptionDelivered, useDeliverySession, uploadDeliveryPhoto } from '../../lib/useData'
import DeliveryNavbar from '../../components/DeliveryNavbar'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

const playSuccessSound = () => {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
        const playNote = (freq, startTime, duration) => {
            const osc = audioCtx.createOscillator()
            const gainNode = audioCtx.createGain()
            osc.type = 'sine'
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime + startTime)
            gainNode.gain.setValueAtTime(0, audioCtx.currentTime + startTime)
            gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + startTime + 0.05)
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + startTime + duration)
            osc.connect(gainNode)
            gainNode.connect(audioCtx.destination)
            osc.start(audioCtx.currentTime + startTime)
            osc.stop(audioCtx.currentTime + startTime + duration)
        }
        playNote(523.25, 0, 0.2) 
        playNote(659.25, 0.1, 0.2) 
        playNote(783.99, 0.2, 0.2) 
        playNote(1046.50, 0.3, 0.4) 
    } catch(e) { console.error('Audio not supported', e) }
}

export default function DeliveryScanPage() {
    const { userId } = useParams()
    const navigate = useNavigate()
    const [date] = useState(() => new Date().toISOString().split('T')[0])
    const [slot] = useState(() => new Date().getHours() < 12 ? 'morning' : 'evening')
    
    const { data: summary, loading, refetch } = useDeliverySummary(userId, date, slot)
    const { data: deliverySession } = useDeliverySession(date, slot)
    
    const [photoModal, setPhotoModal] = useState(null)
    const [photoFile, setPhotoFile] = useState(null)
    const [photoPreview, setPhotoPreview] = useState(null)
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef(null)

    const isSessionActive = !!deliverySession

    const deliveryItems = useMemo(() => {
        if (!summary) return []
        const items = []

        // Process Subscriptions
        summary.subscriptions.forEach(sub => {
            const isPaused = summary.pauses?.some(p => p.subscription_id === sub.id)
            if (isPaused) return

            const isDelivered = summary.completed.some(d => d.subscription_id === sub.id)
            const activeItems = sub.items?.filter(i => !summary.skips?.some(ps => ps.target_id === sub.id && ps.product_id === i.product_id)) || []
            
            if (activeItems.length === 0) return

            const grouped = activeItems.reduce((acc, item) => {
                const pid = item.product_id
                if (!acc[pid]) acc[pid] = { ...item }
                else acc[pid].quantity += item.quantity
                return acc
            }, {})

            const amount = activeItems.reduce((sum, i) => sum + ((i.price_at_time ?? i.products?.price ?? 0) * i.quantity), 0)

            items.push({
                id: sub.id,
                type: 'subscription',
                itemArray: Object.values(grouped),
                status: isDelivered ? 'delivered' : (summary.user.wallet_balance < amount ? 'insufficient_funds' : 'pending'),
                amount
            })
        })

        // Process Orders
        summary.orders.forEach(order => {
            const isDelivered = summary.completed.some(d => d.order_id === order.id) || order.status === 'delivered'
            const activeItems = order.items?.filter(i => !summary.skips?.some(ps => ps.target_id === order.id && ps.product_id === i.product_id)) || []
            
            if (activeItems.length === 0) return

            const grouped = activeItems.reduce((acc, item) => {
                const pid = item.product_id
                if (!acc[pid]) acc[pid] = { ...item }
                else acc[pid].quantity += item.quantity
                return acc
            }, {})

            const amount = activeItems.reduce((sum, i) => sum + ((i.price_at_time ?? i.products?.price ?? 0) * i.quantity), 0)

            items.push({
                id: order.id,
                type: 'order',
                itemArray: Object.values(grouped),
                status: isDelivered ? 'delivered' : 'pending',
                amount
            })
        })

        return items
    }, [summary])

    const handlePhotoSelect = (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        setPhotoFile(file)
        setPhotoPreview(URL.createObjectURL(file))
    }

    const handleConfirmDelivery = async () => {
        if (!photoFile || !photoModal) return
        const d = photoModal
        setUploading(true)
        try {
            await uploadDeliveryPhoto(photoFile, d.type, d.id, date)
            if (d.type === 'order') {
                await markOrderDelivered(d.id, summary.user.id, d.amount, date)
            } else {
                await markSubscriptionDelivered(summary.user.id, d.id, date, d.amount)
            }
            toast.success('✅ Delivery confirmed!')
            playSuccessSound()
            setPhotoModal(null)
            refetch()
        } catch (err) {
            toast.error('Failed: ' + err.message)
        } finally {
            setUploading(false)
        }
    }

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    }

    if (loading) return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-blue-400 font-black tracking-widest text-[10px] uppercase">Retrieving Manifest...</p>
            </div>
        </div>
    )

    if (!summary?.user) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="bg-white p-8 rounded-[32px] shadow-2xl border border-slate-100 max-w-sm w-full text-center">
                <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-red-500">
                    <AlertCircle size={40} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">Manifest Lost</h2>
                <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8">This QR code doesn't match any active digital doorstep in our system.</p>
                <button className="btn-primary w-full py-4" onClick={() => navigate('/delivery')}>Return to Base</button>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-32">
            <DeliveryNavbar />
            
            <motion.div 
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="max-w-2xl mx-auto px-4 pt-6"
            >
                <button 
                    onClick={() => navigate('/delivery')} 
                    className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest mb-6 hover:text-slate-600 transition-colors"
                >
                    <ArrowLeft size={14} /> Close Manifest
                </button>

                {/* Customer Hero Card */}
                <motion.div variants={itemVariants} className="relative mb-8 group">
                    <div className="absolute inset-0 bg-blue-600 blur-3xl opacity-5 group-hover:opacity-10 transition-opacity"></div>
                    <div className="bg-white rounded-[32px] p-6 md:p-8 border border-slate-100 shadow-2xl shadow-blue-900/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                        
                        <div className="flex items-start justify-between mb-8">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-200">
                                    {summary.user.full_name?.charAt(0)}
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">{summary.user.full_name}</h1>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital ID: {summary.user.id.slice(-8)}</span>
                                    </div>
                                </div>
                            </div>
                            <a 
                                href={`tel:${summary.user.phone}`}
                                className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all active:scale-90"
                            >
                                <Phone size={20} />
                            </a>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex gap-4">
                                <MapPin size={20} className="text-blue-500 shrink-0" />
                                <div className="text-sm font-bold text-slate-700 leading-snug">
                                    {summary.user.address || 'Coordinate pending...'}
                                </div>
                            </div>
                            
                            <div className="bg-slate-900 p-4 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-slate-800 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white">
                                        <CreditCard size={16} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Wallet Balance</p>
                                        <p className="text-white font-black text-sm">₹{summary.user.wallet_balance || 0}</p>
                                    </div>
                                </div>
                                <ChevronRight size={16} className="text-slate-600 group-hover:text-white transition-colors" />
                            </div>
                        </div>

                        {summary.user.delivery_instructions && (
                            <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 italic">
                                <MessageSquare size={18} className="text-amber-600 shrink-0 mt-0.5" />
                                <p className="text-amber-800 text-sm font-medium leading-relaxed">"{summary.user.delivery_instructions}"</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Delivery Items Section */}
                <motion.div variants={itemVariants} className="space-y-4">
                    <div className="flex items-center justify-between px-2 mb-4">
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Deployment Manifest</h2>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${slot === 'morning' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                            {slot} Shift
                        </div>
                    </div>

                    {deliveryItems.length === 0 ? (
                        <div className="bg-white rounded-[40px] p-16 text-center border border-slate-100 shadow-2xl shadow-slate-200/20 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <motion.div 
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-500 shadow-inner"
                            >
                                <ShieldCheck size={48} />
                            </motion.div>
                            <h3 className="text-xl font-black text-slate-900 mb-2">Doorstep Clear!</h3>
                            <p className="text-slate-400 font-bold text-sm tracking-tight">All items for this manifest have been deployed.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {deliveryItems.map(item => (
                                <motion.div 
                                    key={item.id}
                                    variants={itemVariants}
                                    whileHover={{ y: -2 }}
                                    className={`bg-white rounded-[32px] p-6 border-2 transition-all overflow-hidden relative ${
                                        item.status === 'delivered' ? 'border-emerald-100 bg-emerald-50/10' : 
                                        item.status === 'insufficient_funds' ? 'border-red-100' : 'border-slate-100 shadow-xl shadow-slate-200/20'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.type === 'subscription' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                                {item.type === 'subscription' ? <Zap size={14} /> : <ShieldCheck size={14} />}
                                            </div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                {item.type} • ID: {item.id.slice(0, 4)}
                                            </span>
                                        </div>
                                        <div className="text-sm font-black text-slate-900">₹{item.amount}</div>
                                    </div>

                                    <div className="space-y-3 mb-8">
                                        {item.itemArray.map((prod, pi) => (
                                            <div key={pi} className="flex items-center gap-4 bg-slate-50/50 p-3 rounded-2xl">
                                                <div className="text-xl font-black text-blue-600 min-w-[2.5rem]">
                                                    {prod.quantity}<span className="text-[10px] ml-0.5">x</span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-sm font-black text-slate-800 leading-none mb-1">{prod.products?.name}</div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{prod.products?.size_label}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <AnimatePresence mode="wait">
                                        {item.status === 'delivered' ? (
                                            <motion.div 
                                                initial={{ scale: 0.9, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs shadow-lg shadow-emerald-200"
                                            >
                                                <CheckCircle size={16} /> DELIVERED
                                            </motion.div>
                                        ) : item.status === 'insufficient_funds' ? (
                                            <motion.div 
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-black text-[10px] text-center border border-red-100 uppercase tracking-widest"
                                            >
                                                HOLD • INSUFFICIENT FUNDS
                                            </motion.div>
                                        ) : !isSessionActive ? (
                                            <div className="w-full py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-xs text-center flex items-center justify-center gap-2">
                                                <Lock size={14} /> SESSION INACTIVE
                                            </div>
                                        ) : (
                                            <button 
                                                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                                onClick={() => setPhotoModal(item)}
                                            >
                                                <Camera size={16} /> COMPLETE DELIVERY
                                            </button>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </motion.div>

            {/* Premium Photo Modal */}
            <AnimatePresence>
                {photoModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[2000] flex items-center justify-center p-4"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-sm rounded-[40px] p-8 relative shadow-2xl"
                        >
                            <button 
                                onClick={() => setPhotoModal(null)} 
                                className="absolute right-6 top-6 w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center hover:text-slate-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                            
                            <div className="text-center mb-8">
                                <h3 className="text-xl font-black text-slate-900 mb-1">Visual Proof</h3>
                                <p className="text-slate-400 font-medium text-xs tracking-tight">Capture the items at the doorstep</p>
                            </div>
                            
                            <div 
                                onClick={() => !uploading && fileInputRef.current.click()}
                                className={`w-full aspect-[4/3] rounded-[32px] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden mb-8 ${
                                    photoPreview ? 'border-transparent' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                                }`}
                            >
                                {photoPreview ? (
                                    <div className="relative w-full h-full">
                                        <img src={photoPreview} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 ring-1 ring-inset ring-white/20"></div>
                                        <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-white/80 rounded-tl-lg"></div>
                                        <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-white/80 rounded-tr-lg"></div>
                                        <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-white/80 rounded-bl-lg"></div>
                                        <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-white/80 rounded-br-lg"></div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-blue-600 relative overflow-hidden group">
                                            <div className="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            <Camera size={32} className="relative z-10" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-1">Open Lens</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Ensure labels are visible</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <input 
                                type="file" 
                                accept="image/*" 
                                capture="environment" 
                                className="hidden" 
                                ref={fileInputRef} 
                                onChange={handlePhotoSelect} 
                            />
                            
                            <button 
                                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-2xl shadow-slate-900/20 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                                disabled={!photoFile || uploading} 
                                onClick={handleConfirmDelivery}
                            >
                                {uploading ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        UPLOADING...
                                    </div>
                                ) : (
                                    <>CONFIRM & CLOSE MANIFEST</>
                                )}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
