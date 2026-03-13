import { Link } from 'react-router-dom'
import { Milk, CheckCircle, Clock, Truck, Star, ChevronRight, Menu, Play, Users, MapPin } from 'lucide-react'
import { useState, useRef } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useProducts } from '../lib/useData'
import { formatCurrency } from '../lib/utils'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination, EffectFade } from 'swiper/modules'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/effect-fade'

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
    const isAdmin = isSignedIn && (user?.publicMetadata?.role === 'admin' || user?.primaryEmailAddress?.emailAddress === 'thejaswinp6@gmail.com')
    const [menuOpen, setMenuOpen] = useState(false)

    const featuredProducts = (products || []).slice(0, 4)

    return (
        <div style={{ minHeight: '100vh', background: 'white', overflowX: 'hidden' }}>
            <style>{`
                .swiper-pagination-bullet-active { background: #2563eb !important; }
                .hero-gradient { background: radial-gradient(circle at top right, #dbeafe 0%, transparent 40%), radial-gradient(circle at bottom left, #eff6ff 0%, transparent 40%); }
                @media (max-width: 640px) { .mobile-hide { display: none !important; } }
            `}</style>

            {/* Nav */}
            <nav style={{
                padding: '1rem 1.5rem', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9',
                position: 'sticky', top: 0, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', zIndex: 100,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{
                        width: 40, height: 40, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                        borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Milk size={22} color="white" />
                    </motion.div>
                    <div className="mobile-hide">
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>Nandini Milk</div>
                        <div style={{ fontSize: '0.6875rem', color: '#64748b', fontWeight: 600 }}>Vaderhalli Store</div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {isSignedIn ? (
                        <Link to={isAdmin ? '/admin' : '/dashboard'} className="btn-primary" style={{ textDecoration: 'none', padding: '0.6rem 1.25rem' }}>
                            Go to Dashboard
                        </Link>
                    ) : (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <Link to="/auth" className="btn-secondary" style={{ textDecoration: 'none', padding: '0.6rem 1.25rem', border: 'none' }}>Login</Link>
                            <Link to="/auth?signup=1" className="btn-primary" style={{ textDecoration: 'none', boxShadow: '0 8px 16px -4px rgba(37,99,235,0.4)', padding: '0.6rem 1.25rem' }}>Join Now</Link>
                        </div>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero-gradient" style={{ padding: '4rem 1.5rem', position: 'relative' }}>
                <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="badge-blue"
                        style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem', marginBottom: '1.5rem', borderRadius: 24, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <span style={{ fontSize: '1.25rem' }}>🥛</span> Serving Vaderhalli Daily
                    </motion.div>
                    
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', fontWeight: 900, color: '#0f172a', lineHeight: 1.05, letterSpacing: '-0.02em', marginBottom: '1.5rem' }}
                    >
                        Fresh Milk.<br />
                        <span style={{ background: 'linear-gradient(to right, #2563eb, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Right at Your Door.</span>
                    </motion.h1>

                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        style={{ fontSize: '1.25rem', color: '#475569', maxWidth: 600, marginBottom: '2.5rem', lineHeight: 1.6 }}
                    >
                        The smartest way to get your morning Nandini milk. 
                        Pause, resume, or change your daily order with one tap.
                    </motion.p>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}
                    >
                        <Link to="/auth?signup=1" className="btn-primary" style={{ textDecoration: 'none', padding: '1.25rem 2.5rem', fontSize: '1.125rem', borderRadius: 16 }}>
                            Start Daily Milk <ChevronRight size={20} />
                        </Link>
                        <Link to="/products" className="btn-secondary" style={{ textDecoration: 'none', padding: '1.25rem 2.5rem', fontSize: '1.125rem', borderRadius: 16 }}>
                            Browse Items
                        </Link>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        style={{ display: 'flex', gap: '2rem', marginTop: '4rem', color: '#94a3b8', fontSize: '0.875rem', fontWeight: 600, flexWrap: 'wrap', justifyContent: 'center' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={16} color="#22c55e" /> No Setup Fees</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={16} color="#22c55e" /> UPI Payments</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={16} color="#22c55e" /> 7AM Delivery</div>
                    </motion.div>
                </div>
            </section>

            {/* Why section with entrance animation */}
            <section style={{ padding: '6rem 1.5rem' }}>
                <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                        {[
                            { icon: Clock, title: 'Reliable Timing', desc: 'Rain or shine, our delivery partners reach you before 7 AM every morning.', color: '#3b82f6', bg: '#eff6ff' },
                            { icon: CheckCircle, title: 'Full Control', desc: 'Going on vacation? Pause your milk in one click. No calls needed.', color: '#10b981', bg: '#ecfdf5' },
                            { icon: MapPin, title: 'Localized Care', desc: 'We are part of Vaderhalli. We know these streets and your needs.', color: '#f59e0b', bg: '#fffbeb' },
                        ].map((item, i) => (
                            <motion.div 
                                viewport={{ once: true }}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                key={item.title} 
                                style={{ padding: '2.5rem', borderRadius: 24, border: '1px solid #f1f5f9', background: 'white' }}
                            >
                                <div style={{ width: 64, height: 64, borderRadius: 18, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: item.color }}>
                                    <item.icon size={32} />
                                </div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>{item.title}</h3>
                                <p style={{ fontSize: '1.125rem', color: '#64748b', lineHeight: 1.6 }}>{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Carousel Section */}
            <section style={{ padding: '6rem 1.5rem', background: '#f8fafc' }}>
                <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', marginBottom: '1rem' }}>Trusted by Neighbors</h2>
                        <p style={{ fontSize: '1.25rem', color: '#64748b' }}>Here is what Vaderhalli residents have to say</p>
                    </div>
                    
                    <Swiper
                        modules={[Autoplay, Pagination]}
                        spaceBetween={24}
                        slidesPerView={1}
                        autoplay={{ delay: 3000 }}
                        pagination={{ clickable: true }}
                        breakpoints={{
                            768: { slidesPerView: 2 },
                            1024: { slidesPerView: 3 }
                        }}
                        style={{ paddingBottom: '3rem' }}
                    >
                        {testimonials.map((t, i) => (
                            <SwiperSlide key={i}>
                                <div style={{ background: 'white', padding: '2.5rem', borderRadius: 24, border: '1px solid #e2e8f0', height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.25rem' }}>
                                        {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="#f59e0b" color="#f59e0b" />)}
                                    </div>
                                    <p style={{ fontSize: '1.125rem', color: '#334155', lineHeight: 1.6, fontStyle: 'italic', marginBottom: '2rem', flex: 1 }}>"{t.text}"</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', fontWeight: 800 }}>{t.name[0]}</div>
                                        <div>
                                            <div style={{ fontWeight: 800, color: '#0f172a' }}>{t.name}</div>
                                            <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Verified Customer</div>
                                        </div>
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </section>

            {/* Newsletter/CTA */}
            <section style={{ padding: '6rem 1.5rem' }}>
                <motion.div 
                    viewport={{ once: true }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    style={{ 
                        maxWidth: 1100, margin: '0 auto', 
                        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
                        padding: '4rem 2rem', borderRadius: 40, textAlign: 'center', color: 'white',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                    }}
                >
                    <h2 style={{ fontSize: ' clamp(1.75rem, 5vw, 3rem)', fontWeight: 900, marginBottom: '1.5rem' }}>Never Miss Your Morning Milk</h2>
                    <p style={{ fontSize: '1.25rem', color: '#94a3b8', maxWidth: 600, margin: '0 auto 3rem' }}>Join hundreds of families. Freshness, at your command.</p>
                    <Link to="/auth?signup=1" className="btn-primary" style={{ background: 'white', color: '#0f172a', padding: '1.25rem 3rem', borderRadius: 20, fontSize: '1.25rem', border: 'none' }}>
                        Create My Account
                    </Link>
                </motion.div>
            </section>

            {/* Modern Footer */}
            <footer style={{ padding: '4rem 1.5rem', borderTop: '1px solid #f1f5f9', background: '#ffffff' }}>
                <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: 32, height: 32, background: '#2563eb', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Milk size={18} color="white" />
                            </div>
                            <span style={{ fontWeight: 800, fontSize: '1.125rem' }}>Nandini Vaderhalli</span>
                        </div>
                        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                            <Link to="/terms" style={{ color: '#64748b', textDecoration: 'none', fontSize: '1rem', fontWeight: 500 }}>Terms</Link>
                            <Link to="/privacy" style={{ color: '#64748b', textDecoration: 'none', fontSize: '1rem', fontWeight: 500 }}>Privacy</Link>
                            <Link to="/products" style={{ color: '#64748b', textDecoration: 'none', fontSize: '1rem', fontWeight: 500 }}>Products</Link>
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem', color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: '2rem' }}>
                        <span>© 2026 Nandini Milk Store. Bengaluru.</span>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <span>App v2.0</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
