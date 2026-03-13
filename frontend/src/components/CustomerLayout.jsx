import { Link, useLocation } from 'react-router-dom'
import { LayoutGrid, FileText, IndianRupee, AlignRight, ShoppingBag, ShoppingCart, RefreshCw } from 'lucide-react'
import { useCartStore } from '../store'

export default function CustomerLayout({ children }) {
    const location = useLocation()
    const cartItems = useCartStore((s) => s.items)
    const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0)

    const tabs = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutGrid },
        { name: 'Products', path: '/products', icon: ShoppingBag },
        { name: 'Subscriptions', path: '/subscriptions', icon: RefreshCw },
        { name: 'Cart', path: '/order', icon: ShoppingCart },
        { name: 'Reports', path: '/reports', icon: FileText },
        { name: 'Payment', path: '/payment', icon: IndianRupee },
        { name: 'Profile', path: '/profile', icon: AlignRight }
    ]

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f8fafc', overflow: 'hidden' }}>
            {/* Main scrollable content area */}
            <main style={{ flex: 1, overflowY: 'auto', paddingBottom: '70px' }}>
                {children}
            </main>

            {/* Bottom navigation bar */}
            <nav style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                height: '65px',
                background: 'white',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
                boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
                zIndex: 100
            }}>
                {tabs.map((tab) => {
                    const isActive = location.pathname.startsWith(tab.path)
                    const Icon = tab.icon
                    return (
                        <Link
                            key={tab.name}
                            to={tab.path}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textDecoration: 'none',
                                color: isActive ? 'var(--color-primary)' : '#64748b',
                                flex: 1,
                                height: '100%',
                                gap: '0.25rem',
                                minWidth: 0 // To allow text truncation
                            }}
                        >
                            <div style={{ position: 'relative', display: 'flex' }}>
                                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                {tab.name === 'Cart' && cartCount > 0 && (
                                    <span style={{
                                        position: 'absolute', top: -5, right: -8,
                                        background: '#2563eb', color: 'white', borderRadius: '50%',
                                        width: 14, height: 14, fontSize: 9, fontWeight: 700,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>{cartCount}</span>
                                )}
                            </div>
                            <span style={{
                                fontSize: '0.6rem',
                                fontWeight: isActive ? 600 : 500,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '100%',
                                padding: '0 2px'
                            }}>
                                {tab.name}
                            </span>
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}
