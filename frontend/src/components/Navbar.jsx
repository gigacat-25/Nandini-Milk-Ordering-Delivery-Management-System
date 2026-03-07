import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ShoppingCart, Menu, X, Milk, User, LogOut, Bell } from 'lucide-react'
import { useState } from 'react'
import { useAuthStore, useCartStore } from '../store'

export default function Navbar() {
    const { user, logout, isAdmin } = useAuthStore()
    const cartItems = useCartStore((s) => s.items)
    const navigate = useNavigate()
    const location = useLocation()
    const [menuOpen, setMenuOpen] = useState(false)
    const [profileOpen, setProfileOpen] = useState(false)

    const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0)

    const navLinks = isAdmin
        ? [
            { to: '/admin', label: 'Dashboard' },
            { to: '/admin/orders', label: 'Orders' },
            { to: '/admin/customers', label: 'Customers' },
            { to: '/admin/products', label: 'Products' },
            { to: '/admin/delivery', label: 'Delivery' },
            { to: '/admin/analytics', label: 'Analytics' },
        ]
        : [
            { to: '/products', label: 'Products' },
            { to: '/subscriptions', label: 'Subscriptions' },
            { to: '/billing', label: 'Billing' },
        ]

    return (
        <nav style={{
            background: 'white',
            borderBottom: '1px solid #e2e8f0',
            padding: '0 1.5rem',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)',
        }}>
            {/* Logo */}
            <Link to={user ? (isAdmin ? '/admin' : '/dashboard') : '/'} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                <div style={{
                    width: 36, height: 36, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                    borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Milk size={20} color="white" />
                </div>
                <div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>Nandini</div>
                    <div style={{ fontSize: '0.6875rem', color: '#64748b', lineHeight: 1.1 }}>Vaderhalli Store</div>
                </div>
            </Link>

            {/* Desktop Nav Links */}
            {user && (
                <div style={{ display: 'flex', gap: '0.25rem' }} className="desktop-nav">
                    {navLinks.map((link) => (
                        <Link
                            key={link.to}
                            to={link.to}
                            style={{
                                padding: '0.5rem 0.875rem',
                                borderRadius: '8px',
                                textDecoration: 'none',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                color: location.pathname === link.to ? '#2563eb' : '#64748b',
                                background: location.pathname === link.to ? '#dbeafe' : 'transparent',
                                transition: 'all 0.15s ease',
                            }}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
            )}

            {/* Right side */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {!user && (
                    <>
                        <Link to="/auth" className="btn-secondary" style={{ textDecoration: 'none', padding: '0.5rem 1rem' }}>Login</Link>
                        <Link to="/auth?signup=1" className="btn-primary" style={{ textDecoration: 'none', padding: '0.5rem 1rem' }}>Get Started</Link>
                    </>
                )}

                {user && !isAdmin && (
                    <Link to="/order" style={{ position: 'relative', textDecoration: 'none', color: '#374151' }}>
                        <div style={{
                            padding: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', transition: 'all 0.15s'
                        }}>
                            <ShoppingCart size={20} />
                            {cartCount > 0 && (
                                <span style={{
                                    position: 'absolute', top: -6, right: -6,
                                    background: '#2563eb', color: 'white', borderRadius: '50%',
                                    width: 18, height: 18, fontSize: 11, fontWeight: 700,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>{cartCount}</span>
                            )}
                        </div>
                    </Link>
                )}

                {user && (
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setProfileOpen(!profileOpen)}
                            style={{
                                width: 36, height: 36, borderRadius: '50%',
                                background: '#dbeafe', border: 'none', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#2563eb', fontWeight: 700, fontSize: '0.875rem',
                            }}
                        >
                            {user.name?.[0]?.toUpperCase() || <User size={16} />}
                        </button>
                        {profileOpen && (
                            <div style={{
                                position: 'absolute', right: 0, top: '110%',
                                background: 'white', border: '1px solid #e2e8f0',
                                borderRadius: 10, padding: '0.5rem', minWidth: 180,
                                boxShadow: '0 4px 20px rgb(0 0 0 / 0.1)',
                                zIndex: 200,
                            }}>
                                <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid #f1f5f9', marginBottom: '0.25rem' }}>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>{user.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{user.email || user.phone}</div>
                                </div>
                                <button
                                    onClick={() => { logout(); navigate('/'); setProfileOpen(false) }}
                                    style={{
                                        width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem',
                                        padding: '0.5rem 0.75rem', border: 'none', background: 'none',
                                        cursor: 'pointer', color: '#ef4444', borderRadius: 8,
                                        fontSize: '0.875rem', fontWeight: 500,
                                    }}
                                >
                                    <LogOut size={16} /> Logout
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Mobile Menu Button */}
                {user && (
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#374151', display: 'none' }}
                        className="mobile-menu-btn"
                    >
                        {menuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                )}
            </div>

            {/* Mobile Menu */}
            {menuOpen && user && (
                <div style={{
                    position: 'absolute', top: 64, left: 0, right: 0,
                    background: 'white', borderBottom: '1px solid #e2e8f0',
                    padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem',
                    zIndex: 99,
                }}>
                    {navLinks.map((link) => (
                        <Link
                            key={link.to}
                            to={link.to}
                            onClick={() => setMenuOpen(false)}
                            style={{
                                padding: '0.75rem 1rem', borderRadius: '8px',
                                textDecoration: 'none', fontSize: '0.9375rem', fontWeight: 500,
                                color: location.pathname === link.to ? '#2563eb' : '#374151',
                                background: location.pathname === link.to ? '#dbeafe' : 'transparent',
                            }}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
            )}

            <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
        </nav>
    )
}
