import { useState, useMemo } from 'react'
import { Search, Eye, PauseCircle, PlayCircle, Clock, Calendar, AlertTriangle, Loader2 } from 'lucide-react'
import { useSubscriptions, useCustomers, useSubscriptionPauses, toggleSubscriptionStatus } from '../../lib/useData'
import { formatCurrency, formatDate } from '../../lib/utils'
import Navbar from '../../components/Navbar'
import toast from 'react-hot-toast'
import Modal from '../../components/Modal'

export default function AdminSubscriptions() {
    const { data: subscriptions, loading: subsLoading, refetch: refetchSubs } = useSubscriptions()
    const { data: customers, loading: custLoading } = useCustomers()
    const { data: pauses, loading: pausesLoading, refetch: refetchPauses } = useSubscriptionPauses()
    
    const [search, setSearch] = useState('')
    const [selectedSub, setSelectedSub] = useState(null)
    const [updatingId, setUpdatingId] = useState(null)

    // Compute enriched subscription data
    const enrichedSubs = useMemo(() => {
        if (!subscriptions || !customers) return []

        return subscriptions.map(sub => {
            const customer = customers.find(c => c.id === sub.customer_id)
            const activeItems = sub.items || []
            const subAmount = activeItems.reduce((sum, i) => sum + (i.price_at_time * i.quantity), 0)
            
            // Analyze pauses
            const subPauses = (pauses || []).filter(p => p.subscription_id === sub.id)
            const todayDateStr = new Date().toISOString().split('T')[0]
            const isPausedToday = subPauses.some(p => p.pause_date === todayDateStr)

            return {
                ...sub,
                customer: customer || { full_name: 'Unknown', phone: 'N/A' },
                amount: subAmount,
                items_str: activeItems.map(i => `${i.quantity}x ${i.products?.name}`).join(', '),
                total_items: activeItems.length,
                isPausedToday,
                recentPauses: subPauses.slice(0, 5)
            }
        })
    }, [subscriptions, customers, pauses])

    // Filter by search
    const filteredSubs = enrichedSubs.filter(sub => 
        sub.customer.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        sub.customer.phone?.includes(search) ||
        sub.id.toLowerCase().includes(search.toLowerCase())
    )

    // Stats
    const activeCount = enrichedSubs.filter(s => s.status === 'active').length
    const pausedOrCancelledCount = enrichedSubs.filter(s => s.status !== 'active').length
    const pausedTodayCount = enrichedSubs.filter(s => s.status === 'active' && s.isPausedToday).length
    const totalDailyValue = enrichedSubs.filter(s => s.status === 'active' && !s.isPausedToday).reduce((sum, s) => sum + s.amount, 0)

    async function handleToggleStatus(sub) {
        const newStatus = sub.status === 'active' ? 'cancelled' : 'active'
        const actionStr = newStatus === 'cancelled' ? 'Cancel' : 'Reactivate'
        
        if (!confirm(`Are you sure you want to ${actionStr} this subscription for ${sub.customer.full_name}?`)) return
        
        setUpdatingId(sub.id)
        try {
            await toggleSubscriptionStatus(sub.id, sub.customer_id, newStatus)
            await refetchSubs()
            toast.success(`Subscription ${newStatus === 'active' ? 'reactivated' : 'cancelled'}`)
            if (selectedSub?.id === sub.id) {
                setSelectedSub({ ...selectedSub, status: newStatus })
            }
        } catch(err) {
            toast.error(`Failed to ${actionStr}: ` + err.message)
        } finally {
            setUpdatingId(null)
        }
    }

    if (subsLoading || custLoading || pausesLoading) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', color: '#64748b' }}><Loader2 className="spin" size={32} /></div>

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
            <Navbar />
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem' }}>
                <div className="page-header">
                    <h1 className="page-title">Subscription Management</h1>
                    <p className="page-subtitle">Track and manage all recurring daily deliveries.</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: 'Active Subscriptions', value: activeCount, color: '#059669' },
                        { label: 'Paused Today', value: pausedTodayCount, color: '#f59e0b' },
                        { label: 'Cancelled/Inactive', value: pausedOrCancelledCount, color: '#94a3b8' },
                        { label: 'Daily Recurring Value', value: formatCurrency(totalDailyValue), color: '#3b82f6' },
                    ].map((s) => (
                        <div key={s.label} className="card" style={{ textAlign: 'center', padding: '1rem' }}>
                            <div style={{ fontSize: '1.375rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                            <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Search */}
                <div style={{ position: 'relative', marginBottom: '1.5rem', maxWidth: 400 }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input className="input" placeholder="Search by name, phone or sub ID..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '2.25rem' }} />
                </div>

                {/* Table */}
                <div className="card" style={{ padding: 0 }}>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th className="text-left w-[20%]">Subscriber</th>
                                    <th className="text-left">ID</th>
                                    <th className="text-center">Timing</th>
                                    <th className="text-left w-[25%]">Items Preview</th>
                                    <th className="text-right">Daily Value</th>
                                    <th className="text-center">Status</th>
                                    <th className="text-right">Registered</th>
                                    <th className="w-[80px]"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSubs.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No subscriptions found</td>
                                    </tr>
                                ) : filteredSubs.map((s) => (
                                    <tr key={s.id} style={{ opacity: s.status === 'active' ? 1 : 0.6 }}>
                                        <td>
                                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9375rem' }}>{s.customer.full_name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.customer.phone}</div>
                                        </td>
                                        <td style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                                            {s.id.split('-')[0]}
                                        </td>
                                        <td className="text-center">
                                            <span style={{ 
                                                fontSize: '0.7rem', fontWeight: 700, padding: '0.25rem 0.75rem', borderRadius: 99, textTransform: 'uppercase',
                                                background: s.delivery_slot === 'morning' ? '#eff6ff' : '#fff7ed',
                                                color: s.delivery_slot === 'morning' ? '#2563eb' : '#9a3412',
                                                border: `1px solid ${s.delivery_slot === 'morning' ? '#dbeafe' : '#ffedd5'}`
                                            }}>
                                                {s.delivery_slot}
                                            </span>
                                        </td>
                                        <td className="max-w-[200px] truncate italic text-slate-500 font-medium">
                                            {s.items_str || 'No items'}
                                        </td>
                                        <td className="text-right font-black text-slate-900">
                                            {formatCurrency(s.amount)}
                                        </td>
                                        <td className="text-center">
                                            {s.status === 'active' ? (
                                                s.isPausedToday 
                                                    ? <span className="badge-warning">Paused Today</span> 
                                                    : <span className="badge-success">Active</span>
                                            ) : (
                                                <span className="badge-gray">Cancelled</span>
                                            )}
                                        </td>
                                        <td className="text-right font-medium text-slate-500">{formatDate(s.created_at)}</td>
                                        <td className="text-right">
                                            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors" title="View Details" onClick={() => setSelectedSub(s)}>
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Subscription Detail Modal */}
            {selectedSub && (
                <Modal isOpen={!!selectedSub} onClose={() => setSelectedSub(null)} title="Subscription Details">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        
                        {/* Header Banner */}
                        <div style={{ 
                            background: selectedSub.status === 'active' ? '#f0fdf4' : '#f1f5f9', 
                            padding: '1.25rem', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: '1.25rem', color: selectedSub.status === 'active' ? '#166534' : '#475569' }}>
                                    {formatCurrency(selectedSub.amount)} / day
                                </div>
                                <div style={{ fontSize: '0.875rem', color: selectedSub.status === 'active' ? '#15803d' : '#64748b' }}>
                                    {selectedSub.total_items} items total
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Status</div>
                                <div style={{ fontWeight: 700, fontSize: '1rem', color: selectedSub.status === 'active' ? '#059669' : '#64748b', textTransform: 'capitalize' }}>
                                    {selectedSub.status}
                                </div>
                            </div>
                        </div>

                        {/* Customer Info */}
                        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: 600 }}>Subscriber</div>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>{selectedSub.customer.full_name}</div>
                            <div style={{ fontSize: '0.8125rem', color: '#475569', marginTop: '0.25rem' }}>Phone: {selectedSub.customer.phone}</div>
                        </div>

                        {/* Items List */}
                        <div>
                            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>Daily Delivery List</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {selectedSub.items?.map(item => (
                                    <div key={item.product_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                                        <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{item.quantity}x {item.products?.name}</div>
                                        <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{formatCurrency(item.price_at_time * item.quantity)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Pauses List */}
                        {selectedSub.recentPauses?.length > 0 && (
                            <div>
                                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <Calendar size={14} /> Recorded Pauses
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    {selectedSub.recentPauses.map(p => (
                                        <div key={p.id} style={{ fontSize: '0.8125rem', color: '#b45309', background: '#fffbeb', padding: '0.4rem 0.75rem', borderRadius: 6, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Clock size={12} /> Paused for {formatDate(p.pause_date)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                            {selectedSub.status === 'active' ? (
                                <button 
                                    className="btn-secondary" 
                                    onClick={() => handleToggleStatus(selectedSub)}
                                    disabled={updatingId === selectedSub.id}
                                    style={{ flex: 1, justifyContent: 'center', color: '#dc2626', borderColor: '#fca5a5', background: '#fef2f2' }}
                                >
                                    {updatingId === selectedSub.id ? <Loader2 size={16} className="spin" /> : <PauseCircle size={16} />} 
                                    Cancel Subscription
                                </button>
                            ) : (
                                <button 
                                    className="btn-primary" 
                                    onClick={() => handleToggleStatus(selectedSub)}
                                    disabled={updatingId === selectedSub.id}
                                    style={{ flex: 1, justifyContent: 'center' }}
                                >
                                    {updatingId === selectedSub.id ? <Loader2 size={16} className="spin" /> : <PlayCircle size={16} />} 
                                    Reactivate Subscription
                                </button>
                            )}
                        </div>
                        
                    </div>
                </Modal>
            )}
        </div>
    )
}
