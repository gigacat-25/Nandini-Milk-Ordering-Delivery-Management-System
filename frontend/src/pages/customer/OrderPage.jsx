import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, Minus, Plus, CreditCard, CheckCircle, MapPin, Calendar, Navigation, MessageSquare } from 'lucide-react'
import { useCartStore } from '../../store'
import { formatCurrency } from '../../lib/utils'
import { createOrder, createSubscription, useUserProfile, addWalletFunds } from '../../lib/useData'
import { supabase } from '../../lib/supabase'
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
    const [instructions, setInstructions] = useState('')
    const [orderType, setOrderType] = useState('one-time')
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
        if (currentTime >= 15.5) { // 3:30 PM cutoff for next morning
            minDateObj = dayAfter
            cutoffWarning = "Today's 3:30 PM cutoff has passed. Your earliest morning delivery is now the day after tomorrow."
        } else {
            minDateObj = tomorrow
        }
    } else { // evening
        if (currentTime >= 19.5) { // 7:30 PM cutoff for same-day evening
            minDateObj = tomorrow
            cutoffWarning = "Today's 7:30 PM cutoff has passed. Your earliest evening delivery is tomorrow evening."
        } else {
            minDateObj = today
        }
    }

    const minDateStr = minDateObj.toISOString().split('T')[0]

    // Initialize deliveryDate lazily, but also update it if it's invalid
    const [deliveryDate, setDeliveryDate] = useState(minDateStr)

    useEffect(() => {
        if (orderType === 'one-time' && deliveryDate < minDateStr) {
            setDeliveryDate(minDateStr)
        }
    }, [deliverySlot, orderType, minDateStr, deliveryDate])

    // Toast warning the moment user selects a slot that's past its cutoff
    useEffect(() => {
        if (cutoffWarning) {
            toast(
                (t) => (
                    <span style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
                        <strong>⏰ Cut-off passed!</strong><br />
                        {cutoffWarning}
                    </span>
                ),
                {
                    icon: '⚠️',
                    duration: 5000,
                    style: { background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' }
                }
            )
        }
    }, [deliverySlot])

    const [orderId, setOrderId] = useState('')

    // Fetch profile to get wallet balance & app access info
    const { data: profile } = useUserProfile(user?.id)
    const walletBalance = profile?.wallet_balance || 0
    const hasActiveAppFee = profile?.app_fee_expiry ? new Date(profile.app_fee_expiry) > new Date() : false

    // Calculate Totals
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
    const deliveryFee = (orderType === 'one-time' && !hasActiveAppFee) ? 20 : 0
    const total = subtotal + deliveryFee

    useEffect(() => {
        if (!user) return
        supabase.from('users').select('address, google_maps_url, delivery_instructions').eq('id', user.id).single()
            .then(({ data }) => {
                if (data) {
                    if (data.address) setAddress(data.address)
                    if (data.google_maps_url) setMapsUrl(data.google_maps_url)
                    if (data.delivery_instructions) setInstructions(data.delivery_instructions)
                }
            })
    }, [user])

    async function handlePayment() {
        if (!user) return toast.error('You must be logged in to order')
        setPayLoading(true)
        try {
            // Simulated payment delay
            await new Promise((r) => setTimeout(r, 1800))

            // Save the address details back to user profile so they persist
            await supabase.from('users').update({
                address,
                google_maps_url: mapsUrl,
                delivery_instructions: instructions
            }).eq('id', user.id)

            // Actually create the order or subscription in Supabase
            if (orderType === 'subscription') {
                const sub = await createSubscription(user.id, items, deliverySlot, frequency)
                setOrderId(sub.id.slice(0, 8).toUpperCase())
            } else {
                // For one-time orders, deduct from wallet upfront
                if (walletBalance < total) {
                    toast.error('Insufficient wallet balance. Please add funds.')
                    setPayLoading(false)
                    return
                }

                const order = await createOrder(user.id, items, total, deliverySlot)
                await addWalletFunds(user.id, -total) // Deduct total from wallet
                setOrderId(order.id.slice(0, 8).toUpperCase())
            }

            clearCart()
            setStep(4)
        } catch (error) {
            console.error(error)
            toast.error(error.message || 'Failed to place order')
        } finally {
            setPayLoading(false)
        }
    }

    if (step === 4) {
        return (
            <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
                <Navbar />
                <div style={{ maxWidth: 520, margin: '4rem auto', padding: '2rem 1.5rem', textAlign: 'center' }}>
                    <div className="card fade-in">
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
                        <CheckCircle size={48} color="#059669" style={{ marginBottom: '1rem' }} />
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem' }}>{orderType === 'subscription' ? 'Subscription Confirmed!' : 'Order Confirmed!'}</h2>
                        <p style={{ color: '#64748b', margin: '0 0 0.5rem' }}>Your {orderType === 'subscription' ? 'subscription' : 'order'} <strong>{orderId}</strong> has been placed successfully.</p>
                        <p style={{ color: '#64748b', margin: '0 0 2rem', fontSize: '0.9rem' }}>
                            Fresh Nandini products will be delivered by <strong>7:00 AM</strong> {orderType === 'subscription' ? `starting tomorrow (${frequency})` : 'tomorrow'}.
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                            <button className="btn-secondary" onClick={() => navigate('/dashboard')}>Dashboard</button>
                            <button className="btn-primary" onClick={() => { setStep(1); navigate('/products') }}>Order More</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
            <Navbar />
            <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>
                <div className="page-header">
                    <h1 className="page-title">Place Order</h1>
                </div>

                {/* Progress Steps */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
                    {['Cart', 'Delivery', 'Payment'].map((s, i) => (
                        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: step > i + 1 ? '#059669' : step === i + 1 ? '#2563eb' : '#e2e8f0',
                                color: step >= i + 1 ? 'white' : '#94a3b8', fontSize: '0.75rem', fontWeight: 700,
                            }}>
                                {step > i + 1 ? <CheckCircle size={14} /> : i + 1}
                            </div>
                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: step === i + 1 ? '#2563eb' : '#94a3b8' }}>{s}</span>
                            {i < 2 && <div style={{ width: 40, height: 2, background: step > i + 1 ? '#059669' : '#e2e8f0' }} />}
                        </div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
                    {/* Left panel */}
                    <div>
                        {step === 1 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {/* Cutoff info banner always visible on Step 1 */}
                                <div style={{ padding: '0.875rem 1rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, fontSize: '0.8rem', color: '#1e40af', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                    <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>⏰</span>
                                    <div>
                                        <strong>Order Cut-Off Times</strong>
                                        <div style={{ marginTop: '0.25rem', lineHeight: 1.6 }}>
                                            🌅 <strong>Morning</strong> (before 7 AM): Order by <strong>3:30 PM</strong> the previous day<br />
                                            🌆 <strong>Evening</strong> (after 5 PM): Order by <strong>7:30 PM</strong> the same day
                                        </div>
                                    </div>
                                </div>
                                <div className="card">
                                    <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#0f172a', margin: '0 0 1rem' }}>Order Type</h2>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                        <button className={orderType === 'one-time' ? 'btn-primary' : 'btn-secondary'} onClick={() => setOrderType('one-time')} style={{ justifyContent: 'center' }}>One-Time Order</button>
                                        <button className={orderType === 'subscription' ? 'btn-primary' : 'btn-secondary'} onClick={() => setOrderType('subscription')} style={{ justifyContent: 'center' }}>Subscribe</button>
                                    </div>
                                </div>
                                <div className="card">
                                    <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#0f172a', margin: '0 0 1.25rem' }}>Your Cart</h2>
                                    {items.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                                            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🛒</div>
                                            <div style={{ fontWeight: 600 }}>Your cart is empty</div>
                                            <button className="btn-primary" onClick={() => navigate('/products')} style={{ marginTop: '1rem' }}>Browse Products</button>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            {items.map((item) => (
                                                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem', background: '#f8fafc', borderRadius: 10 }}>
                                                    <div style={{ fontSize: '1.75rem', width: 44, flexShrink: 0 }}>
                                                        {item.category === 'Milk' ? '🥛' : item.category === 'Curd' ? '🫙' : '🧈'}
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>{item.name}</div>
                                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.size_label}</div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <button onClick={() => updateQty(item.id, item.quantity - 1)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Minus size={12} />
                                                        </button>
                                                        <span style={{ minWidth: 20, textAlign: 'center', fontWeight: 700 }}>{item.quantity}</span>
                                                        <button onClick={() => updateQty(item.id, item.quantity + 1)} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: '#2563eb', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                                            <Plus size={12} />
                                                        </button>
                                                    </div>
                                                    <div style={{ fontWeight: 700, color: '#0f172a', minWidth: 64, textAlign: 'right' }}>{formatCurrency(item.price * item.quantity)}</div>
                                                    <button onClick={() => removeItem(item.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.25rem' }}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="card">
                                <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#0f172a', margin: '0 0 1.25rem' }}>Delivery Details</h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div>
                                        <label className="label"><MapPin size={13} style={{ display: 'inline', marginRight: 4 }} />Delivery Address</label>
                                        <textarea
                                            className="input"
                                            rows={2}
                                            placeholder="House Number, Street, Landmark..."
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                            style={{ resize: 'vertical' }}
                                        />
                                    </div>
                                    <div>
                                        <label className="label"><Navigation size={13} style={{ display: 'inline', marginRight: 4 }} />Google Maps Link</label>
                                        <input
                                            type="url"
                                            className="input"
                                            placeholder="https://maps.google.com/..."
                                            value={mapsUrl}
                                            onChange={e => setMapsUrl(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="label"><MessageSquare size={13} style={{ display: 'inline', marginRight: 4 }} />Delivery Instructions (Optional)</label>
                                        <input
                                            type="text"
                                            className="input"
                                            placeholder="E.g. Leave at the gate..."
                                            value={instructions}
                                            onChange={e => setInstructions(e.target.value)}
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                                        {orderType === 'one-time' ? (
                                            <div>
                                                <label className="label"><Calendar size={13} style={{ display: 'inline', marginRight: 4 }} />Delivery Date</label>
                                                <input
                                                    className="input"
                                                    type="date"
                                                    value={deliveryDate}
                                                    onChange={(e) => setDeliveryDate(e.target.value)}
                                                    min={minDateStr}
                                                />
                                            </div>
                                        ) : (
                                            <div>
                                                <label className="label"><Calendar size={13} style={{ display: 'inline', marginRight: 4 }} />Frequency</label>
                                                <select className="input" value={frequency} onChange={e => setFrequency(e.target.value)}>
                                                    <option value="daily">Daily</option>
                                                    <option value="weekly">Weekly</option>
                                                    <option value="alternate">Alternate Days</option>
                                                </select>
                                            </div>
                                        )}
                                        <div>
                                            <label className="label">Delivery Slot</label>
                                            <select className="input" value={deliverySlot} onChange={e => setDeliverySlot(e.target.value)}>
                                                <option value="morning">Morning (Before 7 AM)</option>
                                                <option value="evening">Evening (After 5 PM)</option>
                                            </select>
                                        </div>
                                    </div>
                                    {/* Persistent cutoff schedule reminder */}
                                    <div style={{ padding: '0.75rem 1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.78rem', color: '#64748b', marginTop: '0.5rem' }}>
                                        ⏰ Cut-offs: <strong>Morning</strong> by 3:30 PM prev. day · <strong>Evening</strong> by 7:30 PM same day
                                    </div>
                                    {/* Warning when cutoff has been missed */}
                                    {cutoffWarning && (
                                        <div style={{ padding: '0.875rem 1rem', background: '#fffbeb', color: '#92400e', borderRadius: 8, fontSize: '0.8125rem', border: '1px solid #fde68a', marginTop: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                                            <span style={{ flexShrink: 0 }}>⚠️</span>
                                            <div>
                                                <strong>Cut-off Passed:</strong> {cutoffWarning}{' '}
                                                {orderType === 'one-time'
                                                    ? 'The earliest available date has been updated below.'
                                                    : 'Your subscription will begin from the next available delivery cycle.'}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="card">
                                <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#0f172a', margin: '0 0 1.25rem' }}>Payment</h2>

                                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <div style={{ fontWeight: 600, color: '#475569' }}>Prepaid Wallet Balance</div>
                                        <div style={{ fontWeight: 800, fontSize: '1.25rem', color: walletBalance >= total || orderType === 'subscription' ? '#059669' : '#dc2626' }}>
                                            {formatCurrency(walletBalance)}
                                        </div>
                                    </div>

                                    {orderType === 'subscription' && !hasActiveAppFee ? (
                                        <div style={{ fontSize: '0.875rem', color: '#dc2626', background: '#fee2e2', padding: '1rem', borderRadius: 8 }}>
                                            ❌ <strong>Monthly Subscription Required.</strong> Daily milk subscriptions are only available to users with an active ₹150 monthly app membership. Please subscribe in Settings first.
                                        </div>
                                    ) : orderType === 'subscription' ? (
                                        <div style={{ fontSize: '0.875rem', color: '#64748b', background: '#eff6ff', padding: '1rem', borderRadius: 8 }}>
                                            ℹ️ <strong>Subscriptions are deducted daily upon delivery.</strong> Make sure you keep your wallet funded so morning deliveries are not interrupted. You will not be charged right now.
                                        </div>
                                    ) : (
                                        <>
                                            {walletBalance < total ? (
                                                <div style={{ fontSize: '0.875rem', color: '#dc2626', background: '#fee2e2', padding: '1rem', borderRadius: 8 }}>
                                                    ❌ Insufficient funds. Please add at least <strong>{formatCurrency(total - walletBalance)}</strong> to your wallet to place this one-time order.
                                                </div>
                                            ) : (
                                                <div style={{ fontSize: '0.875rem', color: '#166534', background: '#f0fdf4', padding: '1rem', borderRadius: 8 }}>
                                                    ✅ Sufficient funds available. <strong>{formatCurrency(total)}</strong> will be deducted from your wallet immediately.
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                {walletBalance < total && orderType !== 'subscription' && (
                                    <button className="btn-secondary" onClick={() => navigate('/billing')} style={{ width: '100%', justifyContent: 'center', marginBottom: '1rem' }}>
                                        <Plus size={16} /> Add Funds to Wallet
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Order Summary */}
                    <div>
                        <div className="card" style={{ position: 'sticky', top: 80 }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 1rem' }}>Order Summary</h3>
                            {items.map((item) => (
                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                                    <span style={{ color: '#64748b' }}>{item.name} × {item.quantity}</span>
                                    <span style={{ fontWeight: 600 }}>{formatCurrency(item.price * item.quantity)}</span>
                                </div>
                            ))}

                            <div style={{ borderTop: '1px solid #f1f5f9', margin: '1rem 0', paddingTop: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Subtotal</span>
                                    <span style={{ fontSize: '0.875rem', color: '#475569', fontWeight: 600 }}>{formatCurrency(subtotal)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Delivery</span>
                                    <span style={{ fontSize: '0.875rem', color: deliveryFee > 0 ? '#ef4444' : '#059669', fontWeight: 600 }}>
                                        {deliveryFee > 0 ? formatCurrency(deliveryFee) : 'Free'}
                                    </span>
                                </div>
                                {deliveryFee > 0 && (
                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                                        (₹20 fee applies without an active ₹150 monthly subscription)
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                                <span style={{ fontWeight: 700, color: '#0f172a' }}>Total</span>
                                <span style={{ fontWeight: 800, color: '#2563eb', fontSize: '1.125rem' }}>{formatCurrency(total)}</span>
                            </div>

                            {step === 1 && (
                                <button className="btn-primary" onClick={() => { if (items.length === 0) { toast.error('Cart is empty'); return } setStep(2) }} style={{ width: '100%', justifyContent: 'center' }}>
                                    Continue to Delivery →
                                </button>
                            )}
                            {step === 2 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <button
                                        className="btn-primary"
                                        onClick={() => {
                                            if (!address) { toast.error('Enter delivery address'); return }
                                            if (cutoffWarning) {
                                                toast(
                                                    (t) => (
                                                        <span style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
                                                            <strong>⚠️ Reminder: Cut-off passed</strong><br />
                                                            {cutoffWarning} Your delivery date has been adjusted.
                                                        </span>
                                                    ),
                                                    { duration: 5000, style: { background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' } }
                                                )
                                            }
                                            setStep(3)
                                        }}
                                        style={{ width: '100%', justifyContent: 'center' }}
                                    >
                                        Continue to Payment →
                                    </button>
                                    <button className="btn-secondary" onClick={() => setStep(1)} style={{ width: '100%', justifyContent: 'center' }}>← Back to Cart</button>
                                </div>
                            )}
                            {step === 3 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <button
                                        className="btn-primary"
                                        onClick={handlePayment}
                                        disabled={payLoading || (orderType === 'subscription' && !hasActiveAppFee) || (walletBalance < total && orderType !== 'subscription')}
                                        style={{ width: '100%', justifyContent: 'center' }}
                                    >
                                        <CreditCard size={16} />
                                        {payLoading ? 'Processing...' : orderType === 'subscription' ? 'Confirm Subscription' : `Pay ${formatCurrency(total)}`}
                                    </button>
                                    <button className="btn-secondary" onClick={() => setStep(2)} style={{ width: '100%', justifyContent: 'center' }}>← Back</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div >
    )
}
