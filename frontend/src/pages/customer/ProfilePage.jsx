import { useState, useEffect } from 'react'
import { Save, MapPin, Navigation, Info, Download, Smartphone, ShieldCheck, Zap, Heart, QrCode, Mail } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { downloadQRCode } from '../../lib/qrUtils'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '@clerk/clerk-react'
import { renewAppAccess, useUserProfile, updateUserProfile } from '../../lib/useData'
import Navbar from '../../components/Navbar'
import MapPicker from '../../components/MapPicker'
import toast from 'react-hot-toast'
import { formatCurrency, formatDate } from '../../lib/utils'
import { usePWAStore } from '../../store'

export default function ProfilePage() {
    const { user, isLoaded } = useUser()
    const { data: userProfile, loading: profileLoading, error: profileError, refetch: refetchProfile } = useUserProfile(user?.id)
    const { deferredPrompt, clearPrompt } = usePWAStore()

    const [saving, setSaving] = useState(false)
    const [paying, setPaying] = useState(false)
    const [sendingEmail, setSendingEmail] = useState(false)
    const [profile, setProfile] = useState({
        address: '',
        delivery_instructions: '',
        google_maps_url: '',
        phone: '',
        latitude: null,
        longitude: null
    })

    const handleInstall = () => {
        if (deferredPrompt) {
            deferredPrompt.prompt()
            clearPrompt()
        }
    }

    useEffect(() => {
        if (userProfile) {
            setProfile({
                address: userProfile.address || '',
                delivery_instructions: userProfile.delivery_instructions || '',
                google_maps_url: userProfile.google_maps_url || '',
                phone: userProfile.phone || user?.primaryPhoneNumber?.phoneNumber || '',
                latitude: userProfile.latitude || null,
                longitude: userProfile.longitude || null,
                house_no: userProfile.house_no || '',
                area: userProfile.area || '',
                address_label: userProfile.address_label || 'Home'
            })
        } else if (user) {
            // Pre-fill phone if it's a new user
            setProfile(prev => ({
                ...prev,
                phone: user.primaryPhoneNumber?.phoneNumber || ''
            }))
        }
    }, [userProfile, user])

    async function handleSave(e) {
        e.preventDefault()
        if (!user) return

        setSaving(true)
        try {
            await updateUserProfile(user.id, profile)
            toast.success('Delivery details saved successfully!')
            refetchProfile()
        } catch (err) {
            toast.error('Failed to save details: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    async function handlePayment() {
        if (!user) return
        setPaying(true)
        try {
            await new Promise(r => setTimeout(r, 1500))
            await renewAppAccess(user.id)
            toast.success('App subscription renewed successfully!')
            refetchProfile()
        } catch (err) {
            toast.error('Failed to process payment. Please try again.')
        } finally {
            setPaying(false)
        }
    }

    async function handleSendEmail() {
        if (!user) return
        setSendingEmail(true)
        try {
            // This will call the backend API we plan to implement
            const response = await fetch(`${import.meta.env.VITE_API_URL}/deliveries/email-qr`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId: user.id,
                    email: user.primaryEmailAddress?.emailAddress,
                    name: user.fullName,
                    origin: window.location.origin
                })
            })
            
            if (response.ok) {
                toast.success('QR Code sent to your email!')
            } else {
                throw new Error('Failed to send email')
            }
        } catch (err) {
            toast.error('Failed to send email. Please try again later.')
        } finally {
            setSendingEmail(false)
        }
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    }

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    }

    if (!isLoaded || profileLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading Identity...</p>
                </div>
            </div>
        )
    }

    const expiry = userProfile?.app_fee_expiry ? new Date(userProfile.app_fee_expiry) : null
    const isExpired = !expiry || expiry < new Date()
    const daysLeft = expiry ? Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24)) : 0
    const formattedExpiry = userProfile?.app_fee_expiry ? formatDate(userProfile.app_fee_expiry) : ''

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            <Navbar />
            
            <motion.main 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 pb-32 md:pb-12"
            >
                {/* Header */}
                <motion.div variants={itemVariants} className="mb-8 md:mb-12 text-center md:text-left">
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Delivery Profile</h1>
                    <p className="text-slate-500 font-medium text-sm md:text-base">Fine-tune your location and preferences for seamless mornings.</p>
                </motion.div>

                {/* Installation Prompt */}
                {deferredPrompt && (
                    <motion.div variants={itemVariants} className="mb-6 md:mb-10 relative group px-1">
                        <div className="absolute inset-0 bg-blue-600 blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
                        <div className="bg-blue-600 rounded-[28px] md:rounded-[32px] p-6 md:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 relative overflow-hidden shadow-2xl shadow-blue-500/20">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                            
                            <div className="flex items-center gap-5 md:gap-6 text-center md:text-left flex-col md:flex-row">
                                <div className="w-14 h-14 md:w-16 md:h-16 bg-white/20 rounded-2xl backdrop-blur-md flex items-center justify-center border border-white/20">
                                    <Smartphone size={28} md:size={32} />
                                </div>
                                <div>
                                    <h2 className="text-lg md:text-xl font-black">Nandini on your Home Screen</h2>
                                    <p className="text-blue-100/70 font-medium text-xs md:text-sm">Experience faster loading and offline tracking.</p>
                                </div>
                            </div>
                            
                            <button 
                                onClick={handleInstall}
                                className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-blue-50 active:scale-95 transition-all text-sm flex items-center gap-2 w-full md:w-auto justify-center"
                            >
                                <Download size={18} /> Install App
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Monthly Access */}
                <motion.div variants={itemVariants} className="card p-0 overflow-hidden mb-6 md:mb-10 border-slate-100 shadow-xl shadow-slate-200/40">
                    <div className="p-5 md:p-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                        <h2 className="text-[10px] md:text-xs font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Zap size={14} md:size={16} className="text-amber-500" />
                            Premium Access status
                        </h2>
                    </div>
                    
                    <div className="p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
                        <div className="flex items-center gap-5 md:gap-6 text-center md:text-left flex-col md:flex-row">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isExpired ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                <ShieldCheck size={28} md:size={32} />
                            </div>
                            <div>
                                <div className={`text-lg font-black ${isExpired ? 'text-red-600' : 'text-emerald-600'}`}>
                                    {isExpired ? 'Account Service Overdue' : 'Service is Active'}
                                </div>
                                <div className="text-slate-400 font-bold text-[9px] md:text-[10px] uppercase tracking-widest mt-0.5">
                                    {isExpired ? 'RENEWAL REQUIRED' : `VALID UNTIL ${formattedExpiry.toUpperCase()}`}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handlePayment}
                            disabled={paying || (!isExpired && daysLeft > 5)}
                            className={`btn-primary !px-8 !py-4 shadow-xl active:scale-95 transition-all w-full md:w-auto ${
                                isExpired ? 'shadow-blue-500/20' : 'bg-white !text-blue-600 border border-blue-100 shadow-none hover:bg-slate-50'
                            }`}
                        >
                            {paying ? 'Authorizing...' : isExpired ? `Pay Subscription ₹150` : `Renew for ₹150`}
                        </button>
                    </div>
                </motion.div>

                {/* Doorstep QR Code */}
                <motion.div variants={itemVariants} className="card p-0 overflow-hidden mb-6 md:mb-10 border-slate-100 shadow-xl shadow-slate-200/40">
                    <div className="p-5 md:p-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                        <h2 className="text-[10px] md:text-xs font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2">
                            <QrCode size={14} md:size={16} className="text-blue-500" />
                            Your Doorstep Digital Card
                        </h2>
                    </div>
                    
                    <div className="p-6 md:p-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
                        <div className="bg-white p-6 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 relative group overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            
                            {/* Scanning Animation Line */}
                            <motion.div 
                                animate={{ top: ['0%', '100%', '0%'] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent z-10 opacity-40"
                            />

                            <QRCodeSVG 
                                id="customer-qr-code"
                                value={`${window.location.origin}/delivery/scan/${user?.id}`}
                                size={200}
                                level="Q"
                                includeMargin={true}
                                className="relative z-0 rounded-2xl"
                            />
                            
                            <div className="absolute inset-0 flex items-center justify-center bg-white/40 opacity-0 group-hover:opacity-100 transition-all duration-500 backdrop-blur-[1px]">
                                <div className="bg-blue-600 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-200 scale-90 group-hover:scale-100 transition-transform">
                                    Doorstep ID
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 space-y-6 text-center md:text-left">
                            <div>
                                <h3 className="text-lg font-black text-slate-900">Seamless Deliveries</h3>
                                <p className="text-slate-500 font-medium text-sm mt-1 leading-relaxed">
                                    Stick this QR code at your door. Your delivery partner will scan it to see exactly what to deliver each morning.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => downloadQRCode(user?.id)}
                                    className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-xs hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                                >
                                    <Download size={16} /> Download PNG
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleSendEmail}
                                    type="button"
                                    disabled={sendingEmail}
                                    className="flex-1 flex items-center justify-center gap-2 bg-white text-slate-900 border border-slate-200 px-6 py-4 rounded-2xl font-black text-xs hover:bg-slate-50 transition-all"
                                >
                                    {sendingEmail ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
                                            <span>Sending...</span>
                                        </div>
                                    ) : (
                                        <><Mail size={16} /> Send to Email</>
                                    )}
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Settings Form */}
                <motion.form variants={itemVariants} onSubmit={handleSave} className="card p-6 md:p-10 space-y-6 md:space-y-10 border-slate-100 shadow-xl shadow-slate-200/40">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                        <div className="space-y-4">
                            <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3 mb-6">
                                <Info size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
                                <p className="text-[11px] font-bold text-amber-800 leading-relaxed">
                                    A detailed address will help our Delivery Partner reach your doorstep easily.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">House / Flat / Block No.</label>
                                <input
                                    type="text"
                                    className="input !py-4 font-bold text-sm"
                                    placeholder="e.g. Drno: 45-54-A"
                                    value={profile.house_no}
                                    onChange={e => setProfile({ ...profile, house_no: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Apartment / Road / Area (Optional)</label>
                                <input
                                    type="text"
                                    className="input !py-4 font-bold text-sm"
                                    placeholder="e.g. Prestige Heights / Residency Road"
                                    value={profile.area}
                                    onChange={e => setProfile({ ...profile, area: e.target.value })}
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-6 md:space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Pin your exact location</label>
                                <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-inner bg-slate-50 min-h-[300px] relative">
                                    <MapPicker 
                                        initialPosition={profile.latitude ? { lat: profile.latitude, lng: profile.longitude } : null}
                                        onLocationChange={(pos) => setProfile(prev => ({ ...prev, latitude: pos.lat, longitude: pos.lng }))}
                                        onAddressChange={(addr, isAuto) => {
                                            // Overwrite address if it's empty OR if it was explicitly requested via "Use My Location"
                                            if (!profile.address || isAuto) {
                                                setProfile(prev => ({ ...prev, address: addr }))
                                            }
                                        }}
                                    />
                                </div>
                                <div className="text-[9px] font-bold text-slate-400 px-1">
                                    Dragging the pin helps our partner find your exact gate.
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Contact Number</label>
                                <div className="relative group">
                                    <Smartphone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                                    <input
                                        type="tel"
                                        className="input !pl-12 !py-4 font-bold text-sm"
                                        placeholder="+91..."
                                        value={profile.phone}
                                        onChange={e => setProfile({ ...profile, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Directions to Reach (Optional)</label>
                            <div className="relative">
                                <textarea
                                    className="input !py-4 h-24 resize-none font-bold italic text-slate-600 text-sm"
                                    placeholder="e.g. Ring the bell on the red gate"
                                    value={profile.delivery_instructions}
                                    maxLength={200}
                                    onChange={e => setProfile({ ...profile, delivery_instructions: e.target.value })}
                                />
                                <div className="absolute bottom-3 right-4 text-[9px] font-bold text-slate-300">
                                    {profile.delivery_instructions?.length || 0}/200
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 pt-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Save this address as</label>
                            <div className="flex gap-3">
                                {['Home', 'Work', 'Other'].map(label => (
                                    <button
                                        key={label}
                                        type="button"
                                        onClick={() => setProfile({ ...profile, address_label: label })}
                                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                                            profile.address_label === label 
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200' 
                                            : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-slate-50">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center md:text-left">
                            <Info size={14} className="flex-shrink-0" /> Only your delivery person can see this.
                        </div>
                        <button type="submit" disabled={saving} className="btn-primary !px-12 !py-5 shadow-2xl shadow-blue-500/20 w-full md:w-auto text-sm">
                            {saving ? (
                                <div className="flex items-center justify-center gap-3">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Synchronizing...
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-2">
                                    <Save size={18} /> Update Settings
                                </div>
                            )}
                        </button>
                    </div>
                </motion.form>
                
                <motion.div variants={itemVariants} className="mt-12 md:mt-16 text-center p-6 md:p-8 bg-slate-100/50 rounded-[32px] border border-slate-100 flex flex-col items-center gap-3 mx-2">
                    <Heart size={20} md:size={24} className="text-red-400" />
                    <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] max-w-sm leading-relaxed">
                        Thank you for choosing Nandini Vaderhalli. We strive to bring the best dairy to your doorstep.
                    </p>
                </motion.div>
            </motion.main>
        </div>
    )
}

