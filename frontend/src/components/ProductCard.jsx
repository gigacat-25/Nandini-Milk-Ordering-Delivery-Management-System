import { useCartStore } from '../store'
import { formatCurrency } from '../lib/utils'
import { Plus, Minus, ShoppingBag } from 'lucide-react'

export default function ProductCard({ product }) {
    const { items, addItem, updateQty } = useCartStore()
    const cartItem = items.find((i) => i.id === product.id)

    const categoryColors = {
        Milk: { bg: '#dbeafe', text: '#1e40af', emoji: '🥛' },
        Curd: { bg: '#fef9c3', text: '#854d0e', emoji: '🫙' },
        Ghee: { bg: '#fef3c7', text: '#92400e', emoji: '🧈' },
    }
    const colors = categoryColors[product.category] || { bg: '#f1f5f9', text: '#475569' }

    return (
        <div className="card fade-in" style={{
            display: 'flex', flexDirection: 'column', gap: '1rem',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgb(0 0 0 / 0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}
        >
            {/* Icon + category */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{
                    width: 56, height: 56, background: colors.bg,
                    borderRadius: 14, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 26,
                }}>
                    {colors.emoji}
                </div>
                <span style={{
                    background: colors.bg, color: colors.text,
                    padding: '0.2rem 0.625rem', borderRadius: 20,
                    fontSize: '0.75rem', fontWeight: 600,
                }}>
                    {product.category}
                </span>
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
                    {product.name}
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '0.5rem' }}>
                    {product.size_label}
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.5 }}>
                    {product.description}
                </div>
            </div>

            {/* Price + Add to cart */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                <div>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                        {formatCurrency(product.price)}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '0.25rem' }}>
                        / {product.unit}
                    </span>
                </div>

                {!cartItem ? (
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
    )
}
