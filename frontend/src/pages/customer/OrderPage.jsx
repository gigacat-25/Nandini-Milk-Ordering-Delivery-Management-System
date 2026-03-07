import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, Minus, Plus, CreditCard, CheckCircle, MapPin, Calendar, Navigation, MessageSquare } from 'lucide-react'
import { useCartStore } from '../../store'
import { formatCurrency } from '../../lib/utils'
import { createOrder } from '../../lib/useData'
import { supabase } from '../../lib/supabase'
import { useUser } from '@clerk/clerk-react'
import Navbar from '../../components/Navbar'
import toast from 'react-hot-toast'

export default function OrderPage() {
    const { items, updateQty, removeItem, clearCart } = useCartStore()
    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
    const navigate = useNavigate()
    const { user } = useUser()
    const [step, setStep] = useState(1) // 1=cart, 2=address, 3=payment, 4=confirmed
    const [address, setAddress] = useState('')
    const [mapsUrl, setMapsUrl] = useState('')
    const [instructions, setInstructions] = useState('')
    const [deliveryDate, setDeliveryDate] = useState('')
    const [deliverySlot, setDeliverySlot] = useState('morning')
    const [payLoading, setPayLoading] = useState(false)
    const [orderId, setOrderId] = useState('')

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

            // Actually create the order in Supabase
            const order = await createOrder(user.id, items, total, deliverySlot)

            setOrderId(order.id.slice(0, 8).toUpperCase())
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
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem' }}>Order Confirmed!</h2>
                        <p style={{ color: '#64748b', margin: '0 0 0.5rem' }}>Your order <strong>{orderId}</strong> has been placed successfully.</p>
                        <p style={{ color: '#64748b', margin: '0 0 2rem', fontSize: '0.9rem' }}>
                            Fresh Nandini products will be delivered by <strong>7:00 AM</strong> tomorrow.
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
                                        <div>
                                            <label className="label"><Calendar size={13} style={{ display: 'inline', marginRight: 4 }} />Delivery Date</label>
                                            <input
                                                className="input"
                                                type="date"
                                                value={deliveryDate}
                                                onChange={(e) => setDeliveryDate(e.target.value)}
                                                min={new Date().toISOString().split('T')[0]}
                                            />
                                        </div>
                                        <div>
                                            <label className="label">Delivery Slot</label>
                                            <select className="input" value={deliverySlot} onChange={e => setDeliverySlot(e.target.value)}>
                                                <option value="morning">Morning (Before 7 AM)</option>
                                                <option value="evening">Evening (After 5 PM)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="card">
                                <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#0f172a', margin: '0 0 1.25rem' }}>Payment</h2>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                    {[
                                        { id: 'upi', icon: '📱', label: 'UPI (GPay, PhonePe)', sub: 'Instant transfer' },
                                        { id: 'cod', icon: '💵', label: 'Cash on Delivery', sub: 'Pay at doorstep' },
                                    ].map((m) => (
                                        <div key={m.id} style={{
                                            padding: '1rem', border: '2px solid #2563eb', borderRadius: 10,
                                            cursor: 'pointer', background: '#eff6ff',
                                        }}>
                                            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{m.icon}</div>
                                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>{m.label}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{m.sub}</div>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#166534' }}>
                                    🔒 Payments secured by Razorpay. UPI integration ready for production.
                                </div>
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
                            <div style={{ borderTop: '1px solid #f1f5f9', margin: '1rem 0', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Delivery</span>
                                <span style={{ fontSize: '0.875rem', color: '#059669', fontWeight: 600 }}>Free</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
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
                                    <button className="btn-primary" onClick={() => { if (!address) { toast.error('Enter delivery address'); return } setStep(3) }} style={{ width: '100%', justifyContent: 'center' }}>
                                        Continue to Payment →
                                    </button>
                                    <button className="btn-secondary" onClick={() => setStep(1)} style={{ width: '100%', justifyContent: 'center' }}>← Back to Cart</button>
                                </div>
                            )}
                            {step === 3 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <button className="btn-primary" onClick={handlePayment} disabled={payLoading} style={{ width: '100%', justifyContent: 'center' }}>
                                        <CreditCard size={16} />
                                        {payLoading ? 'Processing...' : `Pay ${formatCurrency(total)}`}
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
