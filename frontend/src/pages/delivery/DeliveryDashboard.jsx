import { useState, useMemo, useRef, useEffect } from 'react'
import { CheckCircle, MapPin, Phone, MessageSquare, ExternalLink, Loader2, Lock, Camera, X, Image, QrCode, PackageCheck, AlertCircle } from 'lucide-react'
import { Html5Qrcode } from "html5-qrcode"
import { useSubscriptions, useCustomers, useSubscriptionPauses, useOrdersByDate, useDeliveries, markOrderDelivered, markSubscriptionDelivered, useDeliverySession, usePartialSkips, uploadDeliveryPhoto } from '../../lib/useData'
import DeliveryNavbar from '../../components/DeliveryNavbar'
import toast from 'react-hot-toast'

const playSuccessSound = () => {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
        const playNote = (freq, startTime, duration) => {
            const osc = audioCtx.createOscillator()
            const gainNode = audioCtx.createGain()
            osc.type = 'sine'
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime + startTime)
            gainNode.gain.setValueAtTime(0, audioCtx.currentTime + startTime)
            gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + startTime + 0.05)
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + startTime + duration)
            osc.connect(gainNode)
            gainNode.connect(audioCtx.destination)
            osc.start(audioCtx.currentTime + startTime)
            osc.stop(audioCtx.currentTime + startTime + duration)
        }
        // Play a happy major arpeggio
        playNote(523.25, 0, 0.2) // C5
        playNote(659.25, 0.1, 0.2) // E5
        playNote(783.99, 0.2, 0.2) // G5
        playNote(1046.50, 0.3, 0.4) // C6
    } catch(e) { console.error('Audio not supported', e) }
}

export default function DeliveryDashboard() {
    const { data: subscriptions, loading: subsLoading } = useSubscriptions()
    const { data: customers, loading: custLoading } = useCustomers()
    const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
    const [activeSlot, setActiveSlot] = useState('morning')
    const { data: pauses, loading: pausesLoading } = useSubscriptionPauses(date)
    const { data: orders, loading: ordersLoading, refetch: refetchOrders } = useOrdersByDate(date)
    const { data: completedDeliveries, loading: compLoading, refetch: refetchComp } = useDeliveries(date)
    const { data: deliverySession } = useDeliverySession(date, activeSlot)
    const { data: partialSkips, loading: skipsLoading } = usePartialSkips(date)

    const [updatingId, setUpdatingId] = useState(null)
    const isSessionActive = !!deliverySession

    // QR Scanning state
    const [scanModal, setScanModal] = useState(null) // { delivery: d }
    const [isScanning, setIsScanning] = useState(false)
    const [scanError, setScanError] = useState(null)
    const [isVerified, setIsVerified] = useState(false)
    const qrScannerRef = useRef(null)

    // Photo capture state
    const [photoModal, setPhotoModal] = useState(null) // { delivery: d }
    const [photoFile, setPhotoFile] = useState(null)
    const [photoPreview, setPhotoPreview] = useState(null)
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef(null)

    const deliveries = useMemo(() => {
        if (!subscriptions || !customers || !orders || !completedDeliveries) return []

        // 1. Process Subscriptions
        const activeSubs = subscriptions.filter(s => {
            if (s.status !== 'active') return false

            const subCreated = new Date(s.created_at)
            const targetDate = new Date(date)

            // Find the most restrictive cutoff among all items in this subscription
            let minCutoff = s.delivery_slot === 'morning' ? 15.5 : 19.5
            if (s.items?.length > 0) {
                const cutoffs = s.items.map(i => s.delivery_slot === 'morning' ? (i.products?.cutoff_morning || 15.5) : (i.products?.cutoff_evening || 19.5))
                minCutoff = Math.min(...cutoffs)
            }

            let cutoffTime = new Date(targetDate)
            if (s.delivery_slot === 'morning') {
                cutoffTime.setDate(cutoffTime.getDate() - 1)
            }

            const hours = Math.floor(minCutoff)
            const mins = (minCutoff % 1) * 60
            cutoffTime.setHours(hours, mins, 0, 0)

            if (subCreated >= cutoffTime) return false
            if (s.delivery_slot !== activeSlot) return false

            const isPaused = pauses?.some(p => p.subscription_id === s.id && p.pause_date === date)
            return !isPaused
        }).map(sub => {
            const customer = customers.find(c => c.id === sub.customer_id)
            const isDelivered = completedDeliveries.some(d => d.subscription_id === sub.id)

            const activeItems = sub.items?.filter(i => !partialSkips?.some(ps => ps.target_id === sub.id && ps.product_id === i.product_id)) || []
            
            // Group items to avoid duplicates like "1x Milk, 1x Milk"
            const grouped = activeItems.reduce((acc, item) => {
                const pid = item.product_id
                if (!acc[pid]) {
                    acc[pid] = { ...item }
                } else {
                    acc[pid].quantity += item.quantity
                }
                return acc
            }, {})

            const subItemsStr = Object.values(grouped).map(i => `${i.quantity}x ${i.products?.name}`).join(', ')
            const subAmount = activeItems.reduce((sum, i) => sum + ((i.price_at_time ?? i.products?.price ?? 0) * i.quantity), 0)

            const hasFunds = (customer?.wallet_balance || 0) >= subAmount
            let status = isDelivered ? 'delivered' : 'pending'
            if (!hasFunds && !isDelivered) status = 'insufficient_funds'

            return {
                id: sub.id,
                type: 'subscription',
                customerId: sub.customer_id,
                customer: customer?.full_name || 'Unknown',
                address: customer?.address || 'Address not provided',
                phone: customer?.phone || 'N/A',
                google_maps: customer?.google_maps_url,
                instructions: customer?.delivery_instructions,
                itemArray: Object.values(grouped),
                slot: sub.delivery_slot,
                status,
                hasActiveItems: activeItems.length > 0,
                amount: subAmount
            }
        })

        // 2. Process One-Off Orders
        const orderDeliveries = orders.filter(o => o.delivery_slot === activeSlot).map(order => {
            const orderItems = order.items?.map(i => ({
                ...i,
                isSkipped: partialSkips?.some(ps => ps.target_id === order.id && ps.product_id === i.product_id)
            })) || []

            const activeItems = orderItems.filter(i => !i.isSkipped)
            
            // Group items to avoid duplicates
            const grouped = activeItems.reduce((acc, item) => {
                const pid = item.product_id
                if (!acc[pid]) {
                    acc[pid] = { ...item }
                } else {
                    acc[pid].quantity += item.quantity
                }
                return acc
            }, {})

            const itemsStr = Object.values(grouped).map(i => `${i.quantity}x ${i.products?.name}`).join(', ')
            const orderAmount = activeItems.reduce((sum, i) => sum + ((i.price_at_time ?? i.products?.price ?? 0) * i.quantity), 0)

            return {
                id: order.id,
                type: 'order',
                customerId: order.customer_id,
                customer: order.customer_name || 'Unknown',
                address: order.customer_address || 'Address not provided',
                phone: order.customer_phone || 'N/A',
                google_maps: order.google_maps_url,
                instructions: order.delivery_instructions,
                itemArray: Object.values(grouped),
                slot: order.delivery_slot,
                status: order.status === 'delivered' ? 'delivered' : 'pending',
                amount: orderAmount,
                hasActiveItems: activeItems.length > 0
            }
        })

        return [...activeSubs, ...orderDeliveries].filter(d => d.hasActiveItems)
    }, [subscriptions, customers, pauses, orders, completedDeliveries, date, partialSkips, activeSlot])

    function openScanModal(d) {
        setScanModal({ delivery: d })
        setIsVerified(false)
        setScanError(null)
        setIsScanning(true)
    }

    function closeScanModal() {
        if (qrScannerRef.current) {
            qrScannerRef.current.stop().catch(err => console.error("Failed to stop scanner", err))
            qrScannerRef.current = null
        }
        setScanModal(null)
        setIsScanning(false)
    }

    useEffect(() => {
        if (isScanning && scanModal && !isVerified) {
            const html5QrCode = new Html5Qrcode("qr-reader")
            qrScannerRef.current = html5QrCode
            
            const config = { fps: 10, qrbox: { width: 250, height: 250 } }
            
            html5QrCode.start(
                { facingMode: "environment" },
                config,
                (decodedText) => {
                    // QR content is: ${window.location.origin}/delivery/scan/${user?.id}
                    const parts = decodedText.split('/')
                    const scannedUserId = parts[parts.length - 1]
                    
                    if (scannedUserId === scanModal.delivery.customerId) {
                        setIsVerified(true)
                        toast.success('QR Verified!')
                        playSuccessSound()
                        // Stop scanning after verification
                        html5QrCode.stop().then(() => {
                            qrScannerRef.current = null
                        })
                    } else {
                        setScanError("This QR does not match the customer for this delivery.")
                    }
                },
                (errorMessage) => {
                    // Ignore noisy errors
                }
            ).catch(err => {
                console.error("Scanner error", err)
                setScanError("Could not access camera. Please check permissions.")
            })

            return () => {
                if (qrScannerRef.current) {
                    qrScannerRef.current.stop().catch(err => console.error("Cleanup error", err))
                    qrScannerRef.current = null
                }
            }
        }
    }, [isScanning, scanModal, isVerified])

    function openPhotoModal(d) {
        setPhotoModal({ delivery: d })
        setPhotoFile(null)
        setPhotoPreview(null)
    }

    function closePhotoModal() {
        setPhotoModal(null)
        setPhotoFile(null)
        setPhotoPreview(null)
    }

    function handlePhotoSelect(e) {
        const file = e.target.files?.[0]
        if (!file) return
        setPhotoFile(file)
        setPhotoPreview(URL.createObjectURL(file))
    }

    async function handleConfirmDelivery() {
        if (!photoFile || !photoModal) return
        const d = photoModal.delivery
        setUploading(true)
        try {
            // 1. Upload photo
            await uploadDeliveryPhoto(photoFile, d.type, d.id, date)

            // 2. Mark as delivered
            if (d.type === 'order') {
                await markOrderDelivered(d.id, d.customerId, d.amount, date)
                await refetchOrders()
            } else {
                await markSubscriptionDelivered(d.customerId, d.id, date, d.amount)
                await refetchComp()
            }
            toast.success('✅ Delivery confirmed with photo!')
            playSuccessSound()
            closePhotoModal()
        } catch (err) {
            console.error(err)
            toast.error('Failed to confirm delivery: ' + err.message)
        } finally {
            setUploading(false)
        }
    }

    const pending = deliveries.filter(d => d.status === 'pending').length
    const delivered = deliveries.filter(d => d.status === 'delivered').length

    if (subsLoading || custLoading || pausesLoading || ordersLoading || compLoading) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', color: '#64748b' }}><Loader2 className="spin" size={32} /></div>

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
            <DeliveryNavbar />
            <div style={{ maxWidth: 800, margin: '0 auto', padding: '1.5rem 1rem' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Driver Route</h1>
                        <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>Your active run sheet.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <select
                            className="input"
                            value={activeSlot}
                            onChange={e => setActiveSlot(e.target.value)}
                            style={{ width: 'auto', fontSize: '0.875rem', padding: '0.5rem' }}
                        >
                            <option value="morning">🌅 Morning</option>
                            <option value="evening">🌆 Evening</option>
                        </select>
                        <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: 'auto', padding: '0.5rem', fontSize: '0.875rem' }} />
                    </div>
                </div>

                {/* Session status banner */}
                <div style={{
                    padding: '0.75rem 1rem',
                    background: isSessionActive ? '#f0fdf4' : '#fef2f2',
                    border: `1px solid ${isSessionActive ? '#86efac' : '#fecaca'}`,
                    borderRadius: 10,
                    marginBottom: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: isSessionActive ? '#166534' : '#991b1b'
                }}>
                    {isSessionActive
                        ? <><CheckCircle size={16} /> Run is active — tap "Mark as Delivered" to capture proof of delivery.</>
                        : <><Lock size={16} /> Delivery locked. Waiting for admin to start the run.</>}
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <div className="card" style={{ flex: 1, textAlign: 'center', padding: '0.75rem' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563eb' }}>{deliveries.length}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total</div>
                    </div>
                    <div className="card" style={{ flex: 1, textAlign: 'center', padding: '0.75rem' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f59e0b' }}>{pending}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Pending</div>
                    </div>
                    <div className="card" style={{ flex: 1, textAlign: 'center', padding: '0.75rem' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>{delivered}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Done</div>
                    </div>
                </div>

                {/* Delivery Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {deliveries.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.875rem' }}>
                            No deliveries scheduled for this date.
                        </div>
                    ) : deliveries.map((d, idx) => (
                        <div key={d.id} className="card fade-in" style={{
                            padding: '1.25rem',
                            display: 'flex', flexDirection: 'column', gap: '0.875rem',
                            opacity: d.status === 'delivered' ? 0.7 : 1,
                            border: d.status === 'pending' ? '2px solid #93c5fd' : '1px solid #e2e8f0',
                            boxShadow: d.status === 'pending' ? '0 10px 15px -3px rgba(59, 130, 246, 0.1)' : '0 1px 3px 0 rgb(0 0 0 / 0.05)',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{
                                        width: 32, height: 32, borderRadius: '50%', background: d.status === 'delivered' ? '#d1fae5' : d.status === 'insufficient_funds' ? '#fee2e2' : '#dbeafe',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 700, color: d.status === 'delivered' ? '#059669' : d.status === 'insufficient_funds' ? '#dc2626' : '#2563eb', flexShrink: 0, fontSize: '0.875rem',
                                    }}>
                                        {d.status === 'delivered' ? <CheckCircle size={14} /> : idx + 1}
                                    </div>
                                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>{d.customer}</div>
                                </div>
                                {d.google_maps && (
                                    <a href={d.google_maps} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: '#2563eb', padding: '0.25rem 0.5rem', background: '#eff6ff', borderRadius: 20, display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none', fontWeight: 600 }}>
                                        <ExternalLink size={12} /> Directions
                                    </a>
                                )}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                                <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', background: '#f1f5f9', padding: '0.75rem', borderRadius: 8 }}>
                                    <MapPin size={18} style={{ flexShrink: 0, marginTop: 2, color: '#3b82f6' }} />
                                    <span>{d.address}</span>
                                </div>
                                
                                <a href={`tel:${d.phone}`} style={{ 
                                    textDecoration: 'none', background: '#22c55e', color: 'white', padding: '0.75rem', borderRadius: 8, 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1rem',
                                    boxShadow: '0 4px 6px -1px rgba(34, 197, 94, 0.4)'
                                }}>
                                    <Phone size={18} /> Call Customer {d.phone}
                                </a>
                            </div>

                            {d.instructions && (
                                <div style={{ fontSize: '0.8125rem', color: '#b45309', display: 'flex', alignItems: 'flex-start', gap: '0.35rem', background: '#fffbeb', padding: '0.5rem', borderRadius: 8, border: '1px solid #fef3c7' }}>
                                    <MessageSquare size={14} style={{ marginTop: 1, flexShrink: 0 }} /> {d.instructions}
                                </div>
                            )}

                            <div style={{ marginTop: '0.25rem' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Products to Deliver</span>
                                    <span style={{ 
                                        padding: '0.1rem 0.4rem', 
                                        background: d.slot === 'morning' ? '#eff6ff' : '#fff7ed', 
                                        color: d.slot === 'morning' ? '#2563eb' : '#9a3412',
                                        borderRadius: 4, 
                                        border: `1px solid ${d.slot === 'morning' ? '#dbeafe' : '#ffedd5'}`
                                    }}>{d.slot}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    {d.itemArray.map((item, idx) => (
                                        <div key={idx} style={{ 
                                            display: 'flex', alignItems: 'center', gap: '0.75rem', 
                                            background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: 10,
                                            border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                                        }}>
                                            <div style={{ 
                                                fontSize: '1.25rem', fontWeight: 900, color: '#2563eb',
                                                minWidth: '2.5rem', display: 'flex', alignItems: 'center'
                                            }}>
                                                {item.quantity}x
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '1rem' }}>{item.products?.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{item.products?.size_label}</div>
                                            </div>
                                            <div style={{ fontSize: '1.25rem' }}>
                                                {item.products?.name?.toLowerCase().includes('milk') ? '🥛' : 
                                                 item.products?.name?.toLowerCase().includes('curd') ? '🫙' : '📦'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {d.status === 'delivered' ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '0.5rem', background: '#f0fdf4', color: '#166534', borderRadius: 8, fontWeight: 600, fontSize: '0.875rem', gap: '0.4rem', alignItems: 'center' }}>
                                    <CheckCircle size={16} /> Delivered Successfully
                                </div>
                            ) : d.status === 'insufficient_funds' ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '0.5rem', background: '#fee2e2', color: '#dc2626', borderRadius: 8, fontWeight: 600, fontSize: '0.875rem' }}>
                                    Insufficient Funds (₹{d.amount})
                                </div>
                            ) : !isSessionActive ? (
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', padding: '0.6rem', background: '#f1f5f9', color: '#94a3b8', borderRadius: 8, fontWeight: 600, fontSize: '0.8125rem' }}>
                                    <Lock size={14} /> Locked — waiting for admin
                                </div>
                            ) : (
                                <button
                                    className="btn-primary"
                                    onClick={() => openScanModal(d)}
                                    disabled={updatingId === d.id}
                                    style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '0.9rem' }}
                                >
                                    <QrCode size={16} />
                                    Mark as Delivered
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* QR Scan Modal */}
            {scanModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
                }}>
                    <div style={{
                        background: 'white', borderRadius: '1.5rem',
                        padding: '1.5rem', width: '100%', maxWidth: 440,
                        display: 'flex', flexDirection: 'column', gap: '1rem'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>
                                {isVerified ? '✅ QR Verified' : '🔍 Scan Customer QR'}
                            </div>
                            <button onClick={closeScanModal} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <X size={16} color="#64748b" />
                            </button>
                        </div>

                        {!isVerified ? (
                            <>
                                <div style={{ fontSize: '0.875rem', color: '#64748b', textAlign: 'center' }}>
                                    Point camera at the customer's Doorstep QR code
                                </div>
                                <div id="qr-reader" style={{ width: '100%', borderRadius: 12, overflow: 'hidden', background: '#000' }}></div>
                                {scanError && (
                                    <div style={{ padding: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#991b1b', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <AlertCircle size={14} /> {scanError}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div style={{ background: '#f0fdf4', border: '1px solid #b9f6ca', borderRadius: 12, padding: '1rem', textAlign: 'center' }}>
                                    <div style={{ fontWeight: 800, color: '#166534', fontSize: '1.1rem' }}>{scanModal.delivery.customer}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#15803d' }}>Identity confirmed successfully</div>
                                </div>

                                <div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Items to hand over:</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {scanModal.delivery.itemArray.map((item, i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '0.75rem', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                                                <span style={{ fontWeight: 700 }}>{item.quantity}x {item.products?.name}</span>
                                                <span style={{ color: '#64748b' }}>{item.products?.size_label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    className="btn-primary"
                                    onClick={() => {
                                        const d = scanModal.delivery
                                        closeScanModal()
                                        openPhotoModal(d)
                                    }}
                                    style={{ width: '100%', justifyContent: 'center', padding: '1rem' }}
                                >
                                    <Camera size={18} /> Take Delivery Photo
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Photo Capture Modal */}
            {photoModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000,
                    display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
                }}>
                    <div style={{
                        background: 'white', borderRadius: '1.25rem 1.25rem 0 0',
                        padding: '1.5rem', width: '100%', maxWidth: 480,
                        display: 'flex', flexDirection: 'column', gap: '1rem'
                    }}>
                        {/* Modal Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: '1.0625rem', color: '#0f172a' }}>📷 Proof of Delivery</div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Take a photo showing the delivered items</div>
                            </div>
                            <button onClick={closePhotoModal} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                <X size={16} color="#64748b" />
                            </button>
                        </div>

                        {/* Customer info */}
                        <div style={{ background: '#f8fafc', borderRadius: 10, padding: '0.75rem', fontSize: '0.875rem', color: '#374151' }}>
                            <strong>{photoModal.delivery.customer}</strong> — {photoModal.delivery.itemArray.map(i => `${i.quantity}x ${i.products?.name}`).join(', ')}
                        </div>

                        {/* Photo Preview / Picker */}
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                border: '2px dashed #cbd5e1', borderRadius: 12, padding: '1.5rem',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                gap: '0.5rem', cursor: 'pointer', minHeight: 180,
                                background: photoPreview ? 'transparent' : '#f8fafc',
                                position: 'relative', overflow: 'hidden'
                            }}
                        >
                            {photoPreview ? (
                                <img src={photoPreview} alt="Preview" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 8 }} />
                            ) : (
                                <>
                                    <div style={{ width: 56, height: 56, background: '#dbeafe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Camera size={24} color="#2563eb" />
                                    </div>
                                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9375rem' }}>Take / Choose Photo</div>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Tap to open camera or gallery</div>
                                </>
                            )}
                        </div>

                        {/* Hidden file input — capture="environment" opens rear camera on mobile */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            style={{ display: 'none' }}
                            onChange={handlePhotoSelect}
                        />

                        {photoPreview && (
                            <button
                                onClick={() => { setPhotoFile(null); setPhotoPreview(null) }}
                                style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.5rem', fontSize: '0.8125rem', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                            >
                                <Image size={14} /> Choose a different photo
                            </button>
                        )}

                        <button
                            className="btn-primary"
                            onClick={handleConfirmDelivery}
                            disabled={!photoFile || uploading}
                            style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', fontSize: '1rem', opacity: (!photoFile || uploading) ? 0.5 : 1 }}
                        >
                            {uploading ? <><Loader2 size={18} className="spin" /> Uploading...</> : <><CheckCircle size={18} /> Confirm Delivery</>}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
