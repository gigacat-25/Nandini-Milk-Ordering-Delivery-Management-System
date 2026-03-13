import { useCartStore } from '../store'
import { formatCurrency } from '../lib/utils'
import { Plus, Minus, ShoppingBag } from 'lucide-react'

export default function ProductCard({ product }) {
    const { items, addItem, updateQty } = useCartStore()
    const cartItem = items.find((i) => i.id === product.id)

    const categoryColors = {
        Milk: { bg: '#dbeafe', text: '#1e40af', emoji: '🥛' },
        Curd: { bg: '#fef9c3', text: '#854d0e', emoji: '🫙' },
        'Milk Products': { bg: '#fef3c7', text: '#92400e', emoji: '🧈' },
    }
    const colors = categoryColors[product.category] || { bg: '#f1f5f9', text: '#475569' }

    const now = new Date()
    const currentTime = now.getHours() + now.getMinutes() / 60
    const morningCutoff = product.cutoff_morning || 15.5
    const eveningCutoff = product.cutoff_evening || 19.5

    const morningStatus = currentTime < morningCutoff ? 'Next' : 'Day After'
    const eveningStatus = currentTime < eveningCutoff ? 'Today' : 'Tomorrow'

    const formatTimeStr = (t) => {
        const h = Math.floor(t)
        const m = (t % 1) * 60
        return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
    }

    return (
        <div className="card fade-in" style={{
            display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgb(0 0 0 / 0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}
        >
            {/* Product Image or Icon */}
            <div style={{ width: '100%', height: 180, background: colors.bg, position: 'relative', overflow: 'hidden' }}>
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        style={{
                            width: '100%', height: '100%', objectFit: 'cover',
                            filter: product.stock_qty <= 0 ? 'grayscale(0.8) opacity(0.6)' : 'none',
                            transition: 'filter 0.3s ease'
                        }}
                    />
                ) : (
                    <div style={{
                        width: '100%', height: '100%', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 56,
                        filter: product.stock_qty <= 0 ? 'grayscale(1)' : 'none',
                        opacity: product.stock_qty <= 0 ? 0.5 : 1
                    }}>
                        {colors.emoji}
                    </div>
                )}

                {/* Overlay Badges */}
                <div style={{ position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pointerEvents: 'none' }}>
                    <span style={{
                        background: colors.bg, color: colors.text,
                        padding: '0.25rem 0.75rem', borderRadius: 20,
                        fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: '1px solid rgba(255,255,255,0.2)'
                    }}>
                        {product.category}
                    </span>
                    {product.stock_qty <= 0 && (
                        <span style={{
                            background: '#ef4444', color: 'white',
                            padding: '0.25rem 0.75rem', borderRadius: 20,
                            fontSize: '0.7rem', fontWeight: 800,
                            textTransform: 'uppercase', letterSpacing: '0.025em',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                            Out of Stock
                        </span>
                    )}
                    {product.stock_qty > 0 && currentTime >= eveningCutoff && currentTime >= morningCutoff && (
                        <span style={{
                            background: '#475569', color: 'white',
                            padding: '0.25rem 0.75rem', borderRadius: 20,
                            fontSize: '0.7rem', fontWeight: 800,
                            textTransform: 'uppercase',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                            Today's Booking Closed
                        </span>
                    )}
                </div>
            </div>

            {/* Info */}
            <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', opacity: product.stock_qty <= 0 ? 0.7 : 1 }}>
                <div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.125rem' }}>
                        {product.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {product.size_label}
                    </div>
                </div>

                <div style={{ fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.4, flex: 1 }}>
                    {product.description}
                </div>

                {/* Live Availability Status */}
                <div style={{
                    marginTop: '0.25rem',
                    padding: '0.5rem',
                    background: '#f8fafc',
                    borderRadius: 8,
                    border: '1px solid #f1f5f9',
                    fontSize: '0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#64748b' }}>🌅 Next Morning Entry:</span>
                        <span style={{ fontWeight: 700, color: currentTime < morningCutoff ? '#059669' : '#64748b' }}>
                            {morningStatus} {currentTime >= morningCutoff ? '' : ' (Order by ' + formatTimeStr(morningCutoff) + ')'}
                        </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#64748b' }}>🌆 Next Evening Entry:</span>
                        <span style={{ fontWeight: 700, color: currentTime < eveningCutoff ? '#059669' : '#64748b' }}>
                            {eveningStatus} {currentTime >= eveningCutoff ? '' : ' (Order by ' + formatTimeStr(eveningCutoff) + ')'}
                        </span>
                    </div>
                </div>

                {/* Price + Add to cart */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <div>
                        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                            {formatCurrency(product.price)}
                        </span>
                    </div>

                    {product.stock_qty <= 0 ? (
                        <button
                            className="btn-secondary"
                            disabled
                            style={{ padding: '0.5rem 0.875rem', fontSize: '0.8125rem', background: '#f1f5f9', color: '#94a3b8', cursor: 'not-allowed', border: '1px solid #e2e8f0' }}
                        >
                            Unavailable
                        </button>
                    ) : !cartItem ? (
                        <button
                            className="btn-primary"
                            style={{ padding: '0.5rem 0.875rem', fontSize: '0.8125rem' }}
                            onClick={() => addItem(product, 1)}
                        >
                            <ShoppingBag size={14} /> Add
                        </button>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button
                                onClick={() => updateQty(product.id, cartItem.quantity - 1)}
                                style={{
                                    width: 30, height: 30, borderRadius: 8, border: '1px solid #e2e8f0',
                                    background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', color: '#374151',
                                }}
                            >
                                <Minus size={14} />
                            </button>
                            <span style={{ fontSize: '0.9375rem', fontWeight: 700, minWidth: 20, textAlign: 'center', color: '#2563eb' }}>
                                {cartItem.quantity}
                            </span>
                            <button
                                onClick={() => updateQty(product.id, cartItem.quantity + 1)}
                                style={{
                                    width: 30, height: 30, borderRadius: 8, border: 'none',
                                    background: '#2563eb', cursor: 'pointer', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', color: 'white',
                                }}
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
