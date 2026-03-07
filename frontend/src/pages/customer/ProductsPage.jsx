import { useState } from 'react'
import { Search } from 'lucide-react'
import { useProducts } from '../../lib/useData'
import ProductCard from '../../components/ProductCard'
import Navbar from '../../components/Navbar'
import { useCartStore } from '../../store'
import { formatCurrency } from '../../lib/utils'
import { useNavigate } from 'react-router-dom'

const CATEGORIES = ['All', 'Milk', 'Curd', 'Milk Products']

export default function ProductsPage() {
    const [activeCategory, setActiveCategory] = useState('All')
    const [search, setSearch] = useState('')
    const cartItems = useCartStore((s) => s.items)
    const cartTotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
    const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0)
    const navigate = useNavigate()

    const { data: allProducts, loading, error } = useProducts()

    if (loading) return <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'grid', placeItems: 'center', color: '#64748b' }}>Loading products...</div>
    if (error) return <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'grid', placeItems: 'center', color: '#ef4444' }}>Error: {error.message}</div>

    const filtered = (allProducts || []).filter((p) => {
        const matchCat = activeCategory === 'All' || p.category === activeCategory
        const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.size_label.toLowerCase().includes(search.toLowerCase())
        return matchCat && matchSearch
    })

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
            <Navbar />
            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem 8rem 1.5rem' }}>
                <div className="page-header">
                    <h1 className="page-title">Our Products</h1>
                    <p className="page-subtitle">Fresh Nandini dairy products delivered daily.</p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: '1 1 260px' }}>
                        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            className="input"
                            placeholder="Search products..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ paddingLeft: '2.25rem' }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                style={{
                                    padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid',
                                    borderColor: activeCategory === cat ? '#2563eb' : '#e2e8f0',
                                    background: activeCategory === cat ? '#2563eb' : 'white',
                                    color: activeCategory === cat ? 'white' : '#64748b',
                                    fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                                    transition: 'all 0.15s',
                                }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔍</div>
                        <div style={{ fontWeight: 600 }}>No products found</div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                        {CATEGORIES.filter(c => c !== 'All' && (activeCategory === 'All' || activeCategory === c)).map(cat => {
                            const catProducts = filtered.filter(p => p.category === cat)
                            if (catProducts.length === 0) return null
                            return (
                                <div key={cat} className="fade-in">
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {cat === 'Milk' ? '🥛' : cat === 'Curd' ? '🫙' : '🧈'}
                                        {cat}
                                    </h2>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
                                        {catProducts.map(p => <ProductCard key={p.id} product={p} />)}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {cartCount > 0 && (
                <div style={{
                    position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
                    background: '#0f172a', color: 'white', padding: '1rem 1.5rem',
                    borderRadius: 14, boxShadow: '0 8px 32px rgb(0 0 0 / 0.25)',
                    display: 'flex', alignItems: 'center', gap: '1.5rem',
                    zIndex: 200, minWidth: 320, animation: 'fadeIn 0.3s ease',
                }}>
                    <div>
                        <span style={{ fontWeight: 700 }}>{cartCount} item{cartCount > 1 ? 's' : ''}</span>
                        <span style={{ color: '#94a3b8', fontSize: '0.875rem', marginLeft: '0.5rem' }}>in cart</span>
                    </div>
                    <div style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#60a5fa' }}>{formatCurrency(cartTotal)}</div>
                    <button className="btn-primary" onClick={() => navigate('/order')} style={{ marginLeft: 'auto', fontSize: '0.875rem' }}>
                        Checkout →
                    </button>
                </div>
            )}
        </div>
    )
}
