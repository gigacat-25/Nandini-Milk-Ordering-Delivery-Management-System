import { Link, useLocation } from 'react-router-dom'
import { LayoutGrid, FileText, IndianRupee, MapPin, ShoppingBag, ShoppingCart, RefreshCw, User } from 'lucide-react'
import { motion } from 'framer-motion'
import { useCartStore } from '../store'

export default function CustomerLayout({ children }) {
    const location = useLocation()
    const cartItems = useCartStore((s) => s.items)
    const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0)

    const tabs = [
        { name: 'Home', path: '/dashboard', icon: LayoutGrid },
        { name: 'Store', path: '/products', icon: ShoppingBag },
        { name: 'Daily', path: '/subscriptions', icon: RefreshCw },
        { name: 'Cart', path: '/order', icon: ShoppingCart },
        { name: 'Wallet', path: '/wallet', icon: IndianRupee },
        { name: 'Profile', path: '/profile', icon: User }
    ]

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            {/* Main Content Area */}
            <main className="flex-1 pb-24 md:pb-0 overflow-x-hidden">
                {children}
            </main>

            {/* Bottom Navigation (Mobile Only) */}
            <nav className="fixed bottom-4 left-4 right-4 h-16 glass border border-white/50 rounded-2xl md:hidden flex items-center justify-around px-2 shadow-2xl shadow-blue-500/10 z-[100]">
                {tabs.map((tab) => {
                    const isActive = location.pathname.startsWith(tab.path)
                    const Icon = tab.icon
                    
                    return (
                        <Link
                            key={tab.name}
                            to={tab.path}
                            className="relative flex flex-col items-center justify-center flex-1 h-full py-1 group"
                        >
                            <div className="relative flex flex-col items-center gap-1">
                                {isActive && (
                                    <motion.div 
                                        layoutId="activeTab"
                                        className="absolute -inset-x-4 -inset-y-1 bg-blue-500/10 rounded-xl"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                
                                <div className={`relative z-10 ${isActive ? 'text-blue-600' : 'text-slate-400 group-active:scale-95 transition-all'}`}>
                                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                    {tab.name === 'Cart' && cartCount > 0 && (
                                        <motion.span 
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white"
                                        >
                                            {cartCount}
                                        </motion.span>
                                    )}
                                </div>
                                <span className={`text-[9px] font-bold tracking-tight uppercase relative z-10 transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                                    {tab.name}
                                </span>
                            </div>
                        </Link>
                    )
                })}
            </nav>

            {/* Safety spacer for iOS home indicator */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 h-4 bg-white/5 backdrop-blur-sm pointer-events-none z-[99]"></div>
        </div>
    )
}

