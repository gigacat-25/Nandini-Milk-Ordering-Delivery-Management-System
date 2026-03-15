import { Link } from 'react-router-dom'
import { Milk, CheckCircle, Clock, Truck, Star, ChevronRight, Menu, Play, Users, MapPin, Sparkles, ShieldCheck, Zap } from 'lucide-react'
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
    { icon: Clock, title: 'Reliable Timing', desc: 'Rain or shine, our delivery partners reach you before 7 AM every morning.', color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: Zap, title: 'Smart Subscriptions', desc: 'Pause, resume, or modify your daily milk order with a single tap.', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { icon: ShieldCheck, title: 'Secure Payments', desc: 'Prepaid wallet system with UPI support for seamless transactions.', color: 'text-purple-600', bg: 'bg-purple-50' },
]

const testimonials = [
    { name: 'Priya S.', text: 'Never missed a day! Fresh milk delivered perfectly. Love the app.', stars: 5, role: 'Vaderhalli Resident' },
    { name: 'Ravi K.', text: 'Pausing during vacation is so easy. Great service!', stars: 5, role: 'Software Engineer' },
    { name: 'Meena N.', text: 'Best Nandini store nearby. Very reliable delivery.', stars: 5, role: 'Homemaker' },
]

export default function LandingPage() {
    const { isSignedIn, user } = useUser()
    const { data: products } = useProducts('delivery')
    const isAdmin = isSignedIn && (user?.publicMetadata?.role === 'admin' || user?.primaryEmailAddress?.emailAddress === 'thejaswinp6@gmail.com')

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
    }

    const itemVariants = {
        hidden: { y: 30, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: "easeOut" } }
    }

    return (
        <div className="min-h-screen bg-white overflow-x-hidden selection:bg-blue-100 selection:text-blue-900">
            {/* Nav */}
            <nav className="fixed top-0 left-0 right-0 z-[100] px-4 py-4">
                <div className="max-w-7xl mx-auto glass rounded-2xl border border-white/40 shadow-xl shadow-blue-900/5 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <motion.div 
                            initial={{ rotate: -20, scale: 0 }}
                            animate={{ rotate: 0, scale: 1 }}
                            className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20"
                        >
                            <Milk size={20} className="text-white" />
                        </motion.div>
                        <div className="hidden sm:block">
                            <div className="text-sm font-black text-slate-900 leading-none">Nandini Milk</div>
                            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-0.5">Vaderhalli Store</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {isSignedIn ? (
                            <Link to={isAdmin ? '/admin' : '/dashboard'} className="btn-primary !rounded-xl !py-2.5 !px-6 shadow-xl shadow-blue-500/10">
                                My Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link to="/auth" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">Log In</Link>
                                <Link to="/auth?signup=1" className="btn-primary !rounded-xl !py-2.5 !px-6 shadow-xl shadow-blue-500/20">
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-40 pb-20 px-4 overflow-hidden">
                {/* Background Decorations */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-50 rounded-full blur-[120px] -mr-96 -mt-96 opacity-60"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-50 rounded-full blur-[100px] -ml-72 -mb-72 opacity-40"></div>
                
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="max-w-7xl mx-auto text-center"
                >
                    <motion.div variants={itemVariants} className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-8 border border-blue-100 shadow-sm shadow-blue-100/50">
                        <Sparkles size={14} className="animate-pulse" /> Serving Vaderhalli Residents
                    </motion.div>
                    
                    <motion.h1 variants={itemVariants} className="text-5xl md:text-8xl font-black text-slate-900 tracking-tight leading-[0.9] mb-8">
                        Fresh Milk.<br />
                        <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent italic">Right at Your Door.</span>
                    </motion.h1>

                    <motion.p variants={itemVariants} className="text-lg md:text-xl text-slate-500 font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
                        The smarter way to manage your morning essentials. 
                        Subscribe once, enjoy fresh quality every single morning before 7 AM.
                    </motion.p>

                    <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link to="/auth?signup=1" className="btn-primary !py-5 !px-10 !text-lg !rounded-2xl shadow-2xl shadow-blue-600/20 group">
                            Start My Subscription <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link to="/products" className="btn-secondary !py-5 !px-10 !text-lg !rounded-2xl !bg-white">
                            View Price List
                        </Link>
                    </motion.div>

                    {/* Trust Indicators */}
                    <motion.div variants={itemVariants} className="mt-20 flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                        <div className="flex items-center gap-2 font-black text-slate-400">
                            <CheckCircle size={20} className="text-emerald-500" /> NO SETUP FEES
                        </div>
                        <div className="flex items-center gap-2 font-black text-slate-400">
                            <CheckCircle size={20} className="text-emerald-500" /> UPI INTEGRATED
                        </div>
                        <div className="flex items-center gap-2 font-black text-slate-400">
                            <CheckCircle size={20} className="text-emerald-500" /> CANCEL ANYTIME
                        </div>
                    </motion.div>
                </motion.div>
            </section>

            {/* Features Bridge */}
            <section className="py-24 px-4 bg-slate-50/50">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {features.map((f, i) => (
                            <motion.div 
                                key={f.title}
                                whileHover={{ y: -10 }}
                                className="card bg-white p-10 rounded-[40px] border-none shadow-xl shadow-slate-200/50 group"
                            >
                                <div className={`w-16 h-16 ${f.bg} ${f.color} rounded-3xl flex items-center justify-center mb-8 transition-transform group-hover:rotate-6 group-hover:scale-110`}>
                                    <f.icon size={32} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-4">{f.title}</h3>
                                <p className="text-slate-500 font-medium leading-relaxed">{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-24 px-4 overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="text-blue-600 text-xs font-black uppercase tracking-[0.3em]">Neighborhood Love</span>
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 mt-4 tracking-tight">Trusted by your neighbors</h2>
                    </div>

                    <Swiper
                        modules={[Autoplay, Pagination]}
                        spaceBetween={32}
                        slidesPerView={1}
                        autoplay={{ delay: 4000 }}
                        pagination={{ clickable: true }}
                        breakpoints={{
                            768: { slidesPerView: 2 },
                            1024: { slidesPerView: 3 }
                        }}
                        className="pb-16"
                    >
                        {testimonials.map((t, i) => (
                            <SwiperSlide key={i}>
                                <div className="card h-full flex flex-col p-8 rounded-[32px] border-slate-100 shadow-lg shadow-slate-100">
                                    <div className="flex gap-1 mb-6">
                                        {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />)}
                                    </div>
                                    <p className="text-lg font-bold text-slate-700 italic mb-8 flex-1 leading-relaxed">"{t.text}"</p>
                                    <div className="flex items-center gap-4 pt-6 border-t border-slate-50">
                                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center font-black text-white shadow-lg">
                                            {t.name[0]}
                                        </div>
                                        <div>
                                            <div className="font-black text-slate-900">{t.name}</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.role}</div>
                                        </div>
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-24 px-4">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="max-w-7xl mx-auto rounded-[48px] overflow-hidden relative"
                >
                    <div className="absolute inset-0 bg-[#0f172a] -z-10"></div>
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/20 to-transparent -z-10"></div>
                    
                    <div className="px-8 py-20 md:py-32 text-center text-white max-w-3xl mx-auto">
                        <h2 className="text-4xl md:text-6xl font-black mb-8 leading-[0.95] tracking-tighter">Never miss your morning milk again</h2>
                        <p className="text-slate-400 text-lg font-medium mb-12">Join hundreds of families in Vaderhalli who start their day fresh with Nandini.</p>
                        <Link to="/auth?signup=1" className="bg-white text-slate-900 px-10 py-5 rounded-2xl font-black text-xl shadow-2xl hover:bg-blue-50 transition-all hover:scale-105 inline-block">
                            Create My Account
                        </Link>
                    </div>
                </motion.div>
            </section>

            {/* Modern Footer */}
            <footer className="py-20 px-4 border-t border-slate-100">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-12 mb-16">
                        <div className="flex flex-col items-center md:items-start gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                    <Milk size={20} className="text-white" />
                                </div>
                                <span className="text-xl font-black tracking-tight">Nandini Vaderhalli</span>
                            </div>
                            <p className="text-sm text-slate-400 font-medium text-center md:text-left">
                                Official retailer of Nandini Milk & Dairy Products.<br />Serving Vaderhalli, Bangalore since 2020.
                            </p>
                        </div>
                        
                        <div className="flex gap-12 text-sm font-bold text-slate-400 uppercase tracking-widest">
                            <Link to="/products" className="hover:text-blue-600 transition-colors">Prices</Link>
                            <Link to="/terms" className="hover:text-blue-600 transition-colors">Terms</Link>
                            <Link to="/privacy" className="hover:text-blue-600 transition-colors">Privacy</Link>
                        </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row justify-between items-center border-t border-slate-50 pt-8 gap-4">
                        <div className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">
                            © 2026 NANDINI MILK STORE • VADERHALLI, BENGALURU
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">V2.0 STABLE</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}

