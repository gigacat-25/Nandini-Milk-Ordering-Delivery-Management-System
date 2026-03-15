import { useState } from 'react'
import { Search, ShoppingBag, Clock, ArrowRight, Filter } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProducts } from '../../lib/useData'
import ProductCard from '../../components/ProductCard'
import Navbar from '../../components/Navbar'
import { useCartStore } from '../../store'
import { formatCurrency } from '../../lib/utils'
import { useNavigate, useLocation } from 'react-router-dom'

const CATEGORIES = ['All', 'Milk', 'Curd', 'Milk Products']

export default function ProductsPage() {
    const [activeCategory, setActiveCategory] = useState('All')
    const [search, setSearch] = useState('')
    const cartItems = useCartStore((s) => s.items)
    const cartTotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
    const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0)
    const navigate = useNavigate()
    const location = useLocation()
    const queryParams = new URLSearchParams(location.search)
    const orderType = queryParams.get('type') || 'one-time'

    const { data: allProducts, loading, error } = useProducts('delivery')

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
    }

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Fetching Freshness...</p>
                </div>
            </div>
        )
    }

    if (error) return <div className="min-h-screen grid place-items-center bg-red-50 text-red-600 font-bold p-10">Error loading store: {error.message}</div>

    const filtered = (allProducts || []).filter((p) => {
        const matchCat = activeCategory === 'All' || p.category === activeCategory
        const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.size_label.toLowerCase().includes(search.toLowerCase())
        return matchCat && matchSearch
    })

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-40 md:pb-32">
            <Navbar />
            
            <motion.main 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 md:py-10"
            >
                {/* Hero Header */}
                <motion.div variants={itemVariants} className="mb-8 text-center md:text-left px-2">
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                        {orderType === 'subscription' ? 'Dairy Subscriptions' : 'Fresh Daily Store'}
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium max-w-2xl text-sm md:text-base">
                        {orderType === 'subscription' 
                            ? 'Set up your recurring milk delivery. Edit or pause anytime.' 
                            : 'Order fresh packets for tomorrow morning. Straight from local dairy.'}
                    </p>
                </motion.div>

                {/* Booking Status Banner */}
                {(() => {
                    const now = new Date()
                    const hour = now.getHours() + now.getMinutes() / 60
                    const isPastMorning = hour >= 15.5
                    const isPastEvening = hour >= 19.5
                    if (!isPastMorning && !isPastEvening) return null

                    return (
                        <motion.div 
                            variants={itemVariants} 
                            className={`mb-8 p-3 md:p-4 rounded-2xl border flex items-center gap-4 ${
                                isPastEvening ? 'bg-slate-50 border-slate-100 text-slate-500' : 'bg-amber-50 border-amber-100 text-amber-800'
                            }`}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                isPastEvening ? 'bg-slate-200' : 'bg-amber-200 animate-pulse'
                            }`}>
                                <Clock size={18} />
                            </div>
                            <div className="text-[12px] md:text-sm font-semibold">
                                {isPastEvening ? (
                                    <span>Today's booking is closed. Scheduled for tomorrow evening.</span>
                                ) : (
                                    <span>Morning booking closed. You can still order for evening!</span>
                                )}
                            </div>
                        </motion.div>
                    )
                })()}

                {/* Search & Filters */}
                <motion.div variants={itemVariants} className="flex flex-col md:flex-row gap-3 mb-10 px-1">
                    <div className="relative flex-1 group">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <input
                            type="text"
                            className="input !pl-11 !py-3.5 shadow-sm hover:border-slate-300 transition-all font-semibold text-sm"
                            placeholder="Find milk, curd, or ghee..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex bg-white p-1.5 rounded-[18px] border border-slate-200 shadow-sm overflow-x-auto no-scrollbar gap-1">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all whitespace-nowrap ${
                                    activeCategory === cat 
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Product Groups */}
                <div className="space-y-12">
                    {CATEGORIES.filter(c => c !== 'All' && (activeCategory === 'All' || activeCategory === c)).map(cat => {
                        const catProducts = filtered.filter(p => p.category === cat)
                        if (catProducts.length === 0) return null
                        return (
                            <motion.section key={cat} variants={itemVariants}>
                                <div className="flex items-center gap-4 mb-5 px-1">
                                    <h2 className="text-lg font-black text-slate-900 border-l-4 border-blue-600 pl-3 uppercase tracking-tighter">
                                        {cat}
                                    </h2>
                                    <div className="h-px bg-slate-100 flex-1"></div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{catProducts.length} items</span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                                    {catProducts.map(p => <ProductCard key={p.id} product={p} />)}
                                </div>
                            </motion.section>
                        )
                    })}
                    
                    {filtered.length === 0 && (
                        <div className="text-center py-20 flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                <Search size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">No products found</h3>
                            <p className="text-slate-400 text-sm">Try searching for something else.</p>
                            <button onClick={() => { setSearch(''); setActiveCategory('All'); }} className="btn-secondary !text-blue-600 !border-blue-100 !px-6 !py-2.5">Clear filters</button>
                        </div>
                    )}
                </div>
            </motion.main>

            {/* Sticky Cart Footer - Optimized for Mobile + Bottom Nav */}
            <AnimatePresence>
                {cartCount > 0 && (
                    <motion.div 
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-24 md:bottom-8 left-4 right-4 md:left-auto md:right-8 z-50 lg:z-[100]"
                    >
                        <div className="bg-slate-900 text-white rounded-[24px] p-4 md:min-w-[400px] shadow-2xl flex items-center justify-between border border-slate-800 relative group overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                            
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                    <ShoppingBag size={20} className="sm:size-24" />
                                </div>
                                <div>
                                    <div className="text-base sm:text-lg font-black">{formatCurrency(cartTotal)}</div>
                                    <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cartCount} items selected</div>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => navigate(`/order?type=${orderType}`)}
                                className="bg-white text-slate-900 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 hover:bg-blue-50 hover:scale-105 active:scale-95 transition-all shadow-xl"
                            >
                                Checkout <ArrowRight size={16} sm:size={18} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

