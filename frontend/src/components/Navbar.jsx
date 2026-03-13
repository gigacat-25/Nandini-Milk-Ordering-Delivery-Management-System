import { Link, useLocation } from 'react-router-dom'
import { ShoppingCart, Menu, X, Milk, LogIn, ChevronRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useUser, UserButton, SignedIn, SignedOut } from '@clerk/clerk-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCartStore } from '../store'

export default function Navbar() {
    const { user, isSignedIn } = useUser()
    const cartItems = useCartStore((s) => s.items)
    const location = useLocation()
    const [menuOpen, setMenuOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0)
    const isAdmin = isSignedIn && (user?.publicMetadata?.role === 'admin' || user?.primaryEmailAddress?.emailAddress === 'thejaswinp6@gmail.com')

    const navLinks = isAdmin
        ? [
            { to: '/admin', label: 'Dashboard' },
            { to: '/admin/customers', label: 'Customers' },
            { to: '/admin/subscriptions', label: 'Subscriptions' },
            { to: '/admin/products', label: 'Products' },
            { to: '/admin/delivery', label: 'Delivery' },
            { to: '/admin/analytics', label: 'Analytics' },
        ]
        : [
            { to: '/dashboard', label: 'Home' },
            { to: '/products', label: 'Products' },
            { to: '/subscriptions', label: 'Subscriptions' },
            { to: '/wallet', label: 'Wallet' },
            { to: '/profile', label: 'Profile' },
        ]

    return (
        <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'glass shadow-lg py-2' : 'bg-white border-b border-slate-100 py-3'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                {/* Logo */}
                <Link to={isSignedIn ? (isAdmin ? '/admin' : '/dashboard') : '/'} className="flex items-center gap-2 sm:gap-3 transition-transform hover:scale-105 active:scale-95">
                    <div className="w-10 h-10 bg-gradient-blue rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Milk size={22} className="text-white" />
                    </div>
                    <div>
                        <div className="text-base font-black text-slate-900 leading-none">Nandini</div>
                        <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-0.5">Vaderhalli Store</div>
                    </div>
                </Link>

                {/* Desktop Nav Links (Hidden on Mobile for Customers) */}
                <SignedIn>
                    <div className={`hidden ${isAdmin ? 'md:flex' : 'lg:flex'} items-center gap-1`}>
                        {navLinks.map((link) => (
                            <Link
                                key={link.to}
                                to={link.to}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 nav-link ${
                                    location.pathname === link.to 
                                    ? 'text-blue-600 bg-blue-50/50' 
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </SignedIn>

                {/* Right side */}
                <div className="flex items-center gap-2 sm:gap-3">
                    <SignedOut>
                        <div className="flex items-center gap-2">
                            <Link to="/auth" className="btn-secondary !px-4 !py-2 !text-[13px] sm:text-sm">
                                <LogIn size={16} /> Login
                            </Link>
                            <Link to="/auth?signup=1" className="hidden sm:inline-flex btn-primary !px-5 !py-2 text-sm">
                                Join Now
                            </Link>
                        </div>
                    </SignedOut>

                    <SignedIn>
                        {/* Only show cart icon for admins on desktop OR customers on large desktop */}
                        {!isAdmin && (
                            <Link to="/order" className="hidden lg:flex relative p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                                <ShoppingCart size={22} />
                                {cartCount > 0 && (
                                    <motion.span 
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white"
                                    >
                                        {cartCount}
                                    </motion.span>
                                )}
                            </Link>
                        )}

                        <div className="ml-1 border-l border-slate-200 pl-3 h-8 flex items-center">
                            <UserButton 
                                appearance={{
                                    elements: {
                                        userButtonAvatarBox: 'w-8 h-8 sm:w-9 sm:h-9 border-2 border-white shadow-sm'
                                    }
                                }}
                            />
                        </div>

                        {/* Admin Mobile Menu Button */}
                        {isAdmin && (
                            <button
                                onClick={() => setMenuOpen(!menuOpen)}
                                className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                            >
                                {menuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        )}
                    </SignedIn>
                </div>
            </div>

            {/* Mobile Menu (Only for Admins or special links) */}
            <AnimatePresence>
                {menuOpen && isSignedIn && isAdmin && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden glass border-t border-slate-100 overflow-hidden"
                    >
                        <div className="p-4 space-y-2">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    onClick={() => setMenuOpen(false)}
                                    className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                                        location.pathname === link.to 
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                                        : 'bg-white/50 text-slate-700 hover:bg-white'
                                    }`}
                                >
                                    <span className="font-semibold text-sm">{link.label}</span>
                                    <ChevronRight size={16} className={location.pathname === link.to ? 'text-white' : 'text-slate-400'} />
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    )
}

