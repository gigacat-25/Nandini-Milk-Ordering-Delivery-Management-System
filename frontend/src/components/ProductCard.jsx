import { useCartStore } from '../store'
import { formatCurrency } from '../lib/utils'
import { Plus, Minus, ShoppingBag, Info, Clock } from 'lucide-react'
import { motion } from 'framer-motion'

export default function ProductCard({ product }) {
    const { items, addItem, updateQty } = useCartStore()
    const cartItem = items.find((i) => i.id === product.id)

    const categoryColors = {
        Milk: { bg: 'bg-blue-50', text: 'text-blue-700', emoji: '🥛' },
        Curd: { bg: 'bg-amber-50', text: 'text-amber-700', emoji: '🫙' },
        'Milk Products': { bg: 'bg-emerald-50', text: 'text-emerald-700', emoji: '🧈' },
    }
    const colors = categoryColors[product.category] || { bg: 'bg-slate-50', text: 'text-slate-700' }

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
        <motion.div 
            whileHover={{ y: -5 }}
            className={`card group flex flex-col p-0 overflow-hidden ${product.stock_qty <= 0 ? 'opacity-80' : ''} bg-white border-slate-100 shadow-xl shadow-slate-200/40`}
        >
            {/* Image Section */}
            <div className={`relative h-44 w-full bg-gradient-to-br ${colors.bg.replace('bg-', 'from-')}/40 to-white flex items-center justify-center overflow-hidden`}>
                <div className={`absolute inset-0 bg-gradient-to-tr from-white/0 to-${colors.bg.replace('bg-', '')}/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${product.stock_qty <= 0 ? 'grayscale' : ''}`}
                    />
                ) : (
                    <div className="text-6xl motion-safe:animate-bounce-slow drop-shadow-xl saturate-150">
                        {colors.emoji || '📦'}
                    </div>
                )}
                
                {/* Product Category Badge */}
                <div className="absolute top-3 left-3">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-white/90 backdrop-blur-md shadow-sm ${colors.text} border border-white/50`}>
                        {product.category}
                    </span>
                </div>

                {/* Stock Badge */}
                {product.stock_qty <= 0 && (
                    <div className="absolute top-3 right-3">
                        <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-red-500 text-white shadow-lg">
                            Sold Out
                        </span>
                    </div>
                )}

                {/* Availability Pills */}
                <div className="absolute bottom-3 left-3 right-3 flex gap-2">
                    <div className="flex-1 bg-white/90 backdrop-blur-md rounded-lg py-1.5 px-2 flex flex-col items-center justify-center border border-white/50 shadow-sm">
                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Morning Slot</span>
                        <div className="flex items-center gap-1">
                            <span className={`text-[9px] font-black ${currentTime < morningCutoff ? 'text-blue-600' : 'text-slate-500'}`}>
                                {currentTime < morningCutoff ? '🌅 REQ NEXT' : '🗓️ DAY AFTER'}
                            </span>
                        </div>
                    </div>
                    <div className="flex-1 bg-white/90 backdrop-blur-md rounded-lg py-1.5 px-2 flex flex-col items-center justify-center border border-white/50 shadow-sm">
                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Evening Slot</span>
                        <div className="flex items-center gap-1">
                            <span className={`text-[9px] font-black ${currentTime < eveningCutoff ? 'text-amber-600' : 'text-slate-500'}`}>
                                {currentTime < eveningCutoff ? '🌆 TODAY' : '🗓️ TOMORROW'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Section */}
            <div className="p-4 flex-1 flex flex-col">
                <div className="min-h-[4rem] mb-2">
                    <h3 className="text-sm font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors uppercase tracking-tight line-clamp-2">
                        {product.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-4 h-4 rounded-md bg-slate-100 flex items-center justify-center">
                            <Info size={10} className="text-slate-400" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                            {product.size_label}
                        </span>
                    </div>
                </div>

                {/* Price & Action Row */}
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50 gap-2">
                    <div className="flex flex-col flex-shrink-0">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Price</span>
                        <span className="text-lg font-black text-slate-900 leading-none">{formatCurrency(product.price)}</span>
                    </div>

                    {product.stock_qty <= 0 ? (
                        <button disabled className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl cursor-not-allowed border border-slate-100">
                            Closed
                        </button>
                    ) : !cartItem ? (
                        <button
                            className="bg-blue-600 text-white p-2.5 sm:px-4 sm:py-2.5 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 hover:bg-blue-700 w-fit"
                            onClick={() => addItem(product, 1)}
                        >
                            <Plus size={18} className="flex-shrink-0" /> 
                            <span className="text-[11px] font-black uppercase tracking-widest hidden sm:inline">Add</span>
                        </button>
                    ) : (
                        <div className="flex items-center bg-blue-50 rounded-xl p-1 border border-blue-100 shadow-inner">
                            <button
                                onClick={() => updateQty(product.id, Math.max(0, cartItem.quantity - 1))}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-blue-600 hover:bg-white hover:shadow-sm transition-all"
                            >
                                <Minus size={14} />
                            </button>
                            <span className="min-w-[1.5rem] px-1 text-center font-black text-blue-600 text-xs">
                                {cartItem.quantity}
                            </span>
                            <button
                                onClick={() => updateQty(product.id, cartItem.quantity + 1)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center bg-blue-600 text-white shadow-md shadow-blue-200 hover:scale-105 transition-all"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    )
}

