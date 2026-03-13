import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Trash2, Minus, Plus, CreditCard, CheckCircle, MapPin, Calendar, Navigation, MessageSquare, Clock, ArrowRight, ArrowLeft, ShoppingBag } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCartStore } from '../../store'
import { formatCurrency, formatDate } from '../../lib/utils'
import { createOrder, createSubscription, useUserProfile, addWalletFunds, updateUserProfile } from '../../lib/useData'
import { useUser } from '@clerk/clerk-react'
import Navbar from '../../components/Navbar'
import toast from 'react-hot-toast'

export default function OrderPage() {
    const { items, updateQty, removeItem, clearCart } = useCartStore()
    const navigate = useNavigate()
    const { user } = useUser()
    const [step, setStep] = useState(1) // 1=cart, 2=address, 3=payment, 4=confirmed
    const [address, setAddress] = useState('')
    const [mapsUrl, setMapsUrl] = useState('')
    const location = useLocation()
    const queryParams = new URLSearchParams(location.search)
    const orderTypeUrl = queryParams.get('type') || 'one-time'
    
    const [instructions, setInstructions] = useState('')
    const [orderType, setOrderType] = useState(orderTypeUrl)
    const [frequency, setFrequency] = useState('daily')
    const [deliverySlot, setDeliverySlot] = useState('morning')
    const [payLoading, setPayLoading] = useState(false)

    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentTime = currentHour + currentMinute / 60

    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    const dayAfter = new Date(today)
    dayAfter.setDate(today.getDate() + 2)

    let minDateObj = today
    let cutoffWarning = null

    if (deliverySlot === 'morning') {
        if (currentTime >= 15.5) { 
            minDateObj = dayAfter
            cutoffWarning = "Today's 3:30 PM cutoff has passed. Earliest morning delivery is day after tomorrow."
        } else {
            minDateObj = tomorrow
        }
    } else { 
        if (currentTime >= 19.5) { 
            minDateObj = tomorrow
            cutoffWarning = "Today's 7:30 PM cutoff has passed. Earliest evening delivery is tomorrow."
        } else {
            minDateObj = today
        }
    }

    const minDateStr = minDateObj.toISOString().split('T')[0]
    const [deliveryDate, setDeliveryDate] = useState(minDateStr)

    useEffect(() => {
        if (orderType === 'one-time' && deliveryDate < minDateStr) {
            setDeliveryDate(minDateStr)
        }
    }, [deliverySlot, orderType, minDateStr, deliveryDate])

    useEffect(() => {
        if (cutoffWarning) {
            toast.error(cutoffWarning, { icon: '⏰', duration: 4000 })
        }
    }, [deliverySlot])

    const [orderId, setOrderId] = useState('')
    const { data: profile } = useUserProfile(user?.id)
    const walletBalance = profile?.wallet_balance || 0
    const hasActiveAppFee = profile?.app_fee_expiry ? new Date(profile.app_fee_expiry) > new Date() : false

    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
    const deliveryFee = (orderType === 'one-time' && !hasActiveAppFee) ? 20 : 0
    const total = subtotal + deliveryFee

    useEffect(() => {
        if (profile) {
            if (profile.address) setAddress(profile.address)
            if (profile.google_maps_url) setMapsUrl(profile.google_maps_url)
            if (profile.delivery_instructions) setInstructions(profile.delivery_instructions)
        }
    }, [profile])

    async function handlePayment() {
        if (!user) return toast.error('Please login to place order')
        setPayLoading(true)
        try {
            console.log('Starting payment process...', { orderType, total, itemsCount: items.length });
            await new Promise((r) => setTimeout(r, 1800))
            
            console.log('Updating user profile...');
            await updateUserProfile(user.id, {
                address,
                google_maps_url: mapsUrl,
                delivery_instructions: instructions,
                phone: profile?.phone || user?.primaryPhoneNumber?.phoneNumber || ''
            })

            let finalOrderId = '';
            if (orderType === 'subscription') {
                console.log('Creating subscription...');
                const sub = await createSubscription(user.id, items, deliverySlot, frequency)
                if (!sub?.id) throw new Error('Subscription creation failed: No ID returned')
                finalOrderId = sub.id.slice(0, 8).toUpperCase();
            } else {
                if (walletBalance < total) {
                    toast.error('Insufficient wallet balance')
                    setPayLoading(false)
                    return
                }
                console.log('Creating one-time order...');
                const order = await createOrder(user.id, items, total, deliverySlot, deliveryDate)
                if (!order?.id) throw new Error('Order creation failed: No ID returned')
                
                // One-time orders are now deducted only upon delivery, same as subscriptions.
                // await addWalletFunds(user.id, -total)
                finalOrderId = order.id.slice(0, 8).toUpperCase();
            }

            setOrderId(finalOrderId);
            clearCart()
            setStep(4)
            console.log('Order confirmed:', finalOrderId);
        } catch (error) {
            console.error('Checkout error:', error);
            toast.error(error.message || 'Order failed')
        } finally {
            setPayLoading(false)
        }
    }

    const containerVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }

    if (step === 4) {
        return (
            <div className="min-h-screen bg-[#f8fafc]">
                <Navbar />
                <motion.div initial="hidden" animate="visible" variants={containerVariants} className="max-w-xl mx-auto px-4 py-20 text-center">
                    <div className="card p-10 flex flex-col items-center gap-6 shadow-2xl shadow-emerald-500/10 border-emerald-100">
                        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-2">
                            <CheckCircle size={48} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Success!</h2>
                            <p className="text-slate-500 font-medium">Your {orderType === 'subscription' ? 'subscription' : 'order'} <span className="text-slate-900 font-heavy">#{orderId}</span> is confirmed.</p>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-6 w-full text-left space-y-2 border border-slate-100">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Delivery Promise</div>
                            <p className="text-sm font-semibold text-slate-700 leading-relaxed">
                                Fresh products will reach your doorstep by <span className="text-blue-600">7:00 AM</span> {orderType === 'subscription' ? `every day (${frequency})` : formatDate(deliveryDate)}.
                            </p>
                        </div>
                        <div className="flex gap-4 w-full">
                            <button className="btn-secondary flex-1" onClick={() => navigate('/dashboard')}>My Dashboard</button>
                            <button className="btn-primary flex-1" onClick={() => navigate('/products')}>Keep Shopping</button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-24 md:pb-10">
            <Navbar />
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                <div className="mb-10 text-center md:text-left">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                        {orderType === 'subscription' ? 'Plan your Daily Milk' : 'Checkout & Pay'}
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Review your basket and delivery preferences.</p>
                </div>

                {/* Modern Progress Bar */}
                <div className="flex items-center justify-between mb-12 max-w-2xl mx-auto">
                    {[
                        { icon: ShoppingBag, label: 'Basket' },
                        { icon: MapPin, label: 'Delivery' },
                        { icon: CreditCard, label: 'Confirm' }
                    ].map((s, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 group flex-1">
                            <div className="relative flex items-center w-full">
                                <div className={`flex-1 h-1 rounded-full mr-2 ${step > i + 1 ? 'bg-blue-600' : 'bg-slate-200'}`} />
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm ${
                                    step > i + 1 ? 'bg-blue-600 text-white' : step === i + 1 ? 'bg-white border-2 border-blue-600 text-blue-600 shadow-blue-100' : 'bg-white border-2 border-slate-200 text-slate-300'
                                }`}>
                                    {step > i + 1 ? <CheckCircle size={20} /> : <s.icon size={20} />}
                                </div>
                                <div className={`flex-1 h-1 rounded-full ml-2 ${step > i ? 'bg-blue-600/30' : 'bg-slate-200'}`} />
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${step >= i + 1 ? 'text-slate-900' : 'text-slate-300'}`}>{s.label}</span>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Panel: Checkout Steps */}
                    <div className="lg:col-span-8">
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div key="step1" initial="hidden" animate="visible" exit={{ opacity: 0, x: -10 }} variants={containerVariants} className="space-y-6">
                                    <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100 flex gap-4">
                                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shadow-sm"><Clock size={20} /></div>
                                        <div>
                                            <div className="text-xs font-bold text-blue-900 uppercase tracking-widest mb-1">Timing Guidelines</div>
                                            <div className="text-xs text-blue-800/70 font-medium leading-relaxed">
                                                🌅 Morning orders: Before 3:30 PM previous day<br />
                                                🌆 Evening orders: Before 7:30 PM same day
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card p-0 overflow-hidden border-slate-100 shadow-xl shadow-slate-200/30">
                                        <div className="p-6 border-b border-slate-50 bg-slate-50/30"><h2 className="text-lg font-black text-slate-800">Your Basket</h2></div>
                                        {items.length === 0 ? (
                                            <div className="p-16 text-center">
                                                <div className="text-4xl mb-4">🛒</div>
                                                <div className="font-bold text-slate-400">Empty Basket</div>
                                                <button className="btn-primary mt-6" onClick={() => navigate('/products')}>Browse Store</button>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-slate-50">
                                                {items.map((item) => (
                                                    <div key={item.id} className="p-5 flex items-center gap-4 hover:bg-slate-50/50 transition-all group">
                                                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                                                            {item.category === 'Milk' ? '🥛' : item.category === 'Curd' ? '🫙' : '🧈'}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="font-black text-slate-900 leading-tight">{item.name}</div>
                                                            <div className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{item.size_label}</div>
                                                        </div>
                                                        <div className="flex items-center bg-white border border-slate-100 rounded-xl p-1 shadow-sm">
                                                            <button onClick={() => updateQty(item.id, item.quantity - 1)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-500"><Minus size={14} /></button>
                                                            <span className="w-8 text-center font-black text-slate-900 text-sm">{item.quantity}</span>
                                                            <button onClick={() => updateQty(item.id, item.quantity + 1)} className="w-7 h-7 bg-blue-600 text-white rounded-lg flex items-center justify-center shadow-lg shadow-blue-200"><Plus size={14} /></button>
                                                        </div>
                                                        <div className="text-right min-w-[70px]">
                                                            <div className="font-black text-slate-900">{formatCurrency(item.price * item.quantity)}</div>
                                                        </div>
                                                        <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500 p-2"><Trash2 size={18} /></button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div key="step2" initial="hidden" animate="visible" exit={{ opacity: 0, x: -10 }} variants={containerVariants} className="card p-8 space-y-8 border-slate-100 shadow-xl shadow-slate-200/30">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 ml-1">
                                                <MapPin size={12} /> Full Delivery Address
                                            </label>
                                            <textarea className="input h-28 resize-none font-bold" value={address} onChange={e => setAddress(e.target.value)} required />
                                        </div>
                                        <div className="space-y-6">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 ml-1">
                                                    <Navigation size={12} /> Google Maps Pin Link
                                                </label>
                                                <input className="input !py-4 font-bold" type="url" value={mapsUrl} onChange={e => setMapsUrl(e.target.value)} />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 ml-1">
                                                    <MessageSquare size={12} /> Delivery Notes
                                                </label>
                                                <input className="input !py-4 font-bold" type="text" placeholder="Gate code, door color..." value={instructions} onChange={e => setInstructions(e.target.value)} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-50">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Delivery Time Slot</label>
                                            <select className="input !py-4 font-bold" value={deliverySlot} onChange={e => setDeliverySlot(e.target.value)}>
                                                <option value="morning">🌅 Morning (Before 7 AM)</option>
                                                <option value="evening">🌆 Evening (After 5 PM)</option>
                                            </select>
                                        </div>
                                        {orderType === 'one-time' ? (
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Select Delivery Date</label>
                                                <input className="input !py-4 font-bold" type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} min={minDateStr} />
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Delivery Frequency</label>
                                                <select className="input !py-4 font-bold" value={frequency} onChange={e => setFrequency(e.target.value)}>
                                                    <option value="daily">Every Day</option>
                                                    <option value="alternate">Alternate Days</option>
                                                    <option value="weekly">Once a Week</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div key="step3" initial="hidden" animate="visible" exit={{ opacity: 0, x: -10 }} variants={containerVariants} className="space-y-6">
                                    <div className="card p-8 border-slate-100 shadow-xl shadow-slate-200/30">
                                        <h2 className="text-xl font-black text-slate-900 mb-8">Confirm & Pay</h2>
                                        
                                        <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8">
                                            <div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Available Balance</div>
                                                <div className={`text-4xl font-black ${walletBalance < total && orderType !== 'subscription' ? 'text-red-500' : 'text-blue-600'}`}>
                                                    {formatCurrency(walletBalance)}
                                                </div>
                                            </div>
                                            
                                            {orderType === 'subscription' ? (
                                                <div className="bg-white p-4 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-500 max-w-xs leading-relaxed">
                                                    ℹ️ Subscriptions are auto-deducted daily. No charge is made right now. Keep your wallet funded for uninterrupted service.
                                                </div>
                                            ) : (
                                                walletBalance < total && (
                                                    <button onClick={() => navigate('/wallet')} className="btn-secondary !text-blue-600 !border-blue-100 whitespace-nowrap">
                                                        <Plus size={16} /> Recharge Wallet
                                                    </button>
                                                )
                                            )}
                                        </div>

                                        {orderType === 'subscription' && !hasActiveAppFee && (
                                            <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 text-sm font-bold flex gap-3">
                                                <Clock className="flex-shrink-0" /> Monthly App Access required for daily scheduling. Please subscribe in Profile.
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right Panel: Order Summary */}
                    <div className="lg:col-span-4 lg:sticky lg:top-24">
                        <div className="card p-8 border-slate-100 shadow-2xl shadow-slate-200/40 space-y-6">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-50 pb-4">Check Summary</h3>
                            
                            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 no-scrollbar">
                                {items.map((item) => (
                                    <div key={item.id} className="flex justify-between items-start text-sm">
                                        <div className="text-slate-500 font-bold max-w-[180px]">
                                            {item.name} <span className="text-slate-400 font-medium">× {item.quantity}</span>
                                        </div>
                                        <div className="font-black text-slate-900">{formatCurrency(item.price * item.quantity)}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-6 border-t border-slate-100 space-y-3">
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="text-slate-400 uppercase">Subtotal</span>
                                    <span className="text-slate-900">{formatCurrency(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="text-slate-400 uppercase">Delivery Fee</span>
                                    <span className={deliveryFee > 0 ? 'text-red-500' : 'text-emerald-500'}>
                                        {deliveryFee > 0 ? formatCurrency(deliveryFee) : 'FREE'}
                                    </span>
                                </div>
                                {deliveryFee > 0 && (
                                    <p className="text-[9px] text-slate-400 font-medium leading-tight">₹20 fee applies for users without active monthly access.</p>
                                )}
                            </div>

                            <div className="pt-6 border-t-2 border-dashed border-slate-100 flex justify-between items-end mb-8">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Total Amount</div>
                                <div className="text-3xl font-black text-blue-600 leading-none">{formatCurrency(total)}</div>
                            </div>

                            <div className="space-y-3">
                                {step === 1 && (
                                    <button onClick={() => { if (items.length) setStep(2); else toast.error('Basket is empty') }} className="btn-primary w-full !py-4.5 shadow-xl shadow-blue-500/20 group">
                                        Shipment Details <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                )}
                                {step === 2 && (
                                    <>
                                        <button onClick={() => { if (!address) toast.error('Enter address'); else setStep(3) }} className="btn-primary w-full !py-4.5 shadow-xl shadow-blue-500/20 group">
                                            Confirm Order <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                        </button>
                                        <button onClick={() => setStep(1)} className="btn-secondary w-full !py-4 border-none text-slate-400 flex items-center justify-center gap-2">
                                            <ArrowLeft size={16} /> Back to basket
                                        </button>
                                    </>
                                )}
                                {step === 3 && (
                                    <>
                                        <button
                                            onClick={handlePayment}
                                            disabled={payLoading || (orderType === 'subscription' && !hasActiveAppFee) || (walletBalance < total && orderType !== 'subscription')}
                                            className="btn-primary w-full !py-5 shadow-2xl shadow-blue-500/30 font-black tracking-tight"
                                        >
                                            {payLoading ? 'Synchronizing...' : orderType === 'subscription' ? 'Confirm Daily Schedule' : `Pay ${formatCurrency(total)} Now`}
                                        </button>
                                        <button onClick={() => setStep(2)} className="btn-secondary w-full !py-4 border-none text-slate-400 flex items-center justify-center gap-2">
                                            <ArrowLeft size={16} /> Edit Shipment
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
