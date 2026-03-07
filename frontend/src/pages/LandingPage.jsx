import { Link } from 'react-router-dom'
import { Milk, CheckCircle, Clock, Truck, Star, ChevronRight, Menu } from 'lucide-react'
import { useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useProducts } from '../lib/useData'
import { formatCurrency } from '../lib/utils'

const features = [
    { icon: Clock, title: 'Daily Fresh Delivery', desc: 'Get fresh Nandini milk delivered every morning before 7 AM.' },
    { icon: CheckCircle, title: 'Flexible Subscriptions', desc: 'Pause or skip any day. No cancellation fees. Full control.' },
    { icon: Truck, title: 'Vaderhalli Coverage', desc: 'Serving all areas of Vaderhalli, Bengaluru and nearby.' },
]

const testimonials = [
    { name: 'Priya S.', text: 'Never missed a day! Fresh milk delivered perfectly. Love the app.', stars: 5 },
    { name: 'Ravi K.', text: 'Pausing during vacation is so easy. Great service!', stars: 5 },
    { name: 'Meena N.', text: 'Best Nandini store nearby. Very reliable delivery.', stars: 5 },
]

export default function LandingPage() {
    const { isSignedIn, user } = useUser()
    const { data: products } = useProducts()
    const isAdmin = isSignedIn && (user?.publicMetadata?.role === 'admin' || user?.primaryEmailAddress?.emailAddress?.includes('admin'))
    const [menuOpen, setMenuOpen] = useState(false)

    const featuredProducts = (products || []).slice(0, 4)

    return (
        <div style={{ minHeight: '100vh', background: 'white' }}>
            {/* Hero Nav */}
            <nav style={{
                padding: '1rem 2rem', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9',
                position: 'sticky', top: 0, background: 'white', zIndex: 100,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <div style={{
                        width: 40, height: 40, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                        borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Milk size={22} color="white" />
                    </div>
                    <div>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Nandini Milk</div>
                        <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>Vaderhalli Store, Bengaluru</div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {isSignedIn ? (
                        <Link
                            to={isAdmin ? '/admin' : '/dashboard'}
                            className="btn-primary"
                            style={{ textDecoration: 'none' }}
                        >
                            Go to Dashboard
                        </Link>
                    ) : (
                        <>
                            <Link to="/auth" className="btn-secondary" style={{ textDecoration: 'none' }}>Login</Link>
                            <Link to="/auth?signup=1" className="btn-primary" style={{ textDecoration: 'none' }}>Get Started</Link>
                        </>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <section style={{
                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #eff6ff 100%)',
                padding: '5rem 2rem',
                textAlign: 'center',
            }}>
                <div style={{ maxWidth: 720, margin: '0 auto' }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                        background: '#dbeafe', color: '#1e40af', padding: '0.375rem 1rem',
                        borderRadius: 20, fontSize: '0.8125rem', fontWeight: 600, marginBottom: '1.5rem',
                    }}>
                        🥛 Fresh Nandini Milk, Delivered Daily
                    </div>
                    <h1 style={{
                        fontSize: 'clamp(2.25rem, 5vw, 3.5rem)', fontWeight: 800,
                        color: '#0f172a', margin: '0 0 1.25rem', lineHeight: 1.15,
                    }}>
                        Your Daily Milk,<br />
                        <span style={{ color: '#2563eb' }}>Delivered to Your Door</span>
                    </h1>
                    <p style={{ fontSize: '1.125rem', color: '#475569', margin: '0 0 2rem', lineHeight: 1.7 }}>
                        Subscribe to get fresh Nandini milk, curd, and ghee delivered every morning.
                        Manage orders, pause subscriptions, and pay online — all in one place.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/auth?signup=1" className="btn-primary" style={{ textDecoration: 'none', padding: '0.875rem 2rem', fontSize: '1rem' }}>
                            Start Free Subscription →
                        </Link>
                        <Link to="/products" className="btn-secondary" style={{ textDecoration: 'none', padding: '0.875rem 2rem', fontSize: '1rem' }}>
                            Browse Products
                        </Link>
                    </div>
                    <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginTop: '2.5rem', fontSize: '0.875rem', color: '#64748b', flexWrap: 'wrap' }}>
                        <span>✅ No setup fees</span>
                        <span>✅ Cancel anytime</span>
                        <span>✅ Morning delivery</span>
                        <span>✅ UPI payments</span>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section style={{ padding: '5rem 2rem', maxWidth: 1100, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.75rem' }}>
                        Why Choose Us?
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '1rem', margin: 0 }}>
                        Built for the everyday needs of Vaderhalli families.
                    </p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {features.map((f) => (
                        <div key={f.title} className="card" style={{ textAlign: 'center' }}>
                            <div style={{
                                width: 56, height: 56, background: '#dbeafe', borderRadius: 14,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 1rem', color: '#2563eb',
                            }}>
                                <f.icon size={26} />
                            </div>
                            <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, margin: '0 0 0.5rem', color: '#0f172a' }}>{f.title}</h3>
                            <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem', lineHeight: 1.6 }}>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Products Preview */}
            <section style={{ padding: '4rem 2rem', background: '#f8fafc' }}>
                <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Our Products</h2>
                        <Link to="/products" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            View All <ChevronRight size={16} />
                        </Link>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
                        {featuredProducts.map((p) => {
                            const emoji = p.category === 'Milk' ? '🥛' : p.category === 'Curd' ? '🫙' : '🧈'
                            const bg = p.category === 'Milk' ? '#dbeafe' : p.category === 'Curd' ? '#fef9c3' : '#fef3c7'
                            return (
                                <div key={p.id} className="card">
                                    <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
                                        <div style={{ width: 48, height: 48, background: bg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                                            {emoji}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#0f172a' }}>{p.name}</div>
                                            <div style={{ color: '#64748b', fontSize: '0.8125rem' }}>{p.size_label}</div>
                                            <div style={{ fontWeight: 700, color: '#2563eb', marginTop: '0.375rem' }}>{formatCurrency(p.price)}</div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section style={{ padding: '5rem 2rem', maxWidth: 1100, margin: '0 auto' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', textAlign: 'center', marginBottom: '2.5rem' }}>
                    Loved by Vaderhalli Families
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
                    {testimonials.map((t) => (
                        <div key={t.name} className="card">
                            <div style={{ color: '#f59e0b', display: 'flex', gap: '0.2rem', marginBottom: '0.75rem' }}>
                                {[...Array(t.stars)].map((_, i) => <Star key={i} size={14} fill="#f59e0b" />)}
                            </div>
                            <p style={{ color: '#374151', margin: '0 0 1rem', lineHeight: 1.6, fontStyle: 'italic' }}>"{t.text}"</p>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f172a' }}>— {t.name}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section style={{
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                padding: '4rem 2rem', textAlign: 'center',
            }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'white', margin: '0 0 1rem' }}>
                    Ready to Get Started?
                </h2>
                <p style={{ color: '#bfdbfe', margin: '0 0 2rem', fontSize: '1rem' }}>
                    Join 500+ families in Vaderhalli getting fresh milk every morning.
                </p>
                <Link to="/auth?signup=1" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    background: 'white', color: '#2563eb',
                    padding: '0.875rem 2rem', borderRadius: 10,
                    textDecoration: 'none', fontWeight: 700, fontSize: '1rem',
                }}>
                    Create Free Account →
                </Link>
            </section>

            {/* Footer */}
            <footer style={{ padding: '2rem', textAlign: 'center', borderTop: '1px solid #f1f5f9', color: '#94a3b8', fontSize: '0.875rem' }}>
                © 2026 Nandini Milk Store, Vaderhalli, Bengaluru. All rights reserved.
            </footer>
        </div>
    )
}
