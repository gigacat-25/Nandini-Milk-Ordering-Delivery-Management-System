import { useState } from 'react'
import { Plus, Pause, Play, Trash2, RefreshCw, Calendar } from 'lucide-react'
import { MOCK_SUBSCRIPTIONS, PRODUCTS } from '../../lib/mockData'
import { formatCurrency, formatDate } from '../../lib/utils'
import Navbar from '../../components/Navbar'
import Modal from '../../components/Modal'
import toast from 'react-hot-toast'

export default function SubscriptionsPage() {
    const [subs, setSubs] = useState(MOCK_SUBSCRIPTIONS)
    const [showCreate, setShowCreate] = useState(false)
    const [showPause, setShowPause] = useState(null)
    const [pauseDate, setPauseDate] = useState('')
    const [newSub, setNewSub] = useState({ product_id: '', quantity: 1, start_date: '' })

    function togglePause(id) {
        setSubs(subs.map(s => s.id === id ? { ...s, status: s.status === 'active' ? 'paused' : 'active', next_delivery: s.status === 'paused' ? 'Tomorrow' : 'Paused' } : s))
        toast.success(subs.find(s => s.id === id)?.status === 'active' ? 'Subscription paused' : 'Subscription resumed')
    }

    function deleteSub(id) {
        setSubs(subs.filter(s => s.id !== id))
        toast.success('Subscription cancelled')
    }

    function addPause() {
        if (!pauseDate) { toast.error('Select a date to pause'); return }
        toast.success(`Delivery paused for ${formatDate(pauseDate)}`)
        setShowPause(null)
        setPauseDate('')
    }

    function createSubscription() {
        if (!newSub.product_id || !newSub.start_date) { toast.error('Fill all fields'); return }
        const product = PRODUCTS.find(p => p.id === newSub.product_id)
        const sub = {
            id: 'SUB-' + Math.random().toString(36).slice(2, 6).toUpperCase(),
            product_name: product.name,
            size: product.size_label,
            quantity: newSub.quantity,
            price_per_unit: product.price,
            frequency: 'Daily',
            start_date: newSub.start_date,
            status: 'active',
            next_delivery: formatDate(newSub.start_date),
        }
        setSubs([...subs, sub])
        toast.success('Subscription created!')
        setShowCreate(false)
        setNewSub({ product_id: '', quantity: 1, start_date: '' })
    }

    const activeSubs = subs.filter(s => s.status === 'active')
    const monthlyEst = activeSubs.reduce((sum, s) => sum + s.price_per_unit * s.quantity * 30, 0)

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
            <Navbar />
            <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 className="page-title">My Subscriptions</h1>
                        <p className="page-subtitle">Manage your daily recurring milk orders.</p>
                    </div>
                    <button className="btn-primary" onClick={() => setShowCreate(true)}>
                        <Plus size={16} /> New Subscription
                    </button>
                </div>

                {/* Summary */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Active Subscriptions', value: activeSubs.length, color: '#059669', bg: '#d1fae5' },
                        { label: 'Paused', value: subs.filter(s => s.status === 'paused').length, color: '#f59e0b', bg: '#fef3c7' },
                        { label: 'Est. Monthly Cost', value: formatCurrency(monthlyEst), color: '#2563eb', bg: '#dbeafe' },
                    ].map((s) => (
                        <div key={s.label} className="stat-card">
                            <div style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '0.25rem' }}>{s.label}</div>
                            <div style={{ fontSize: '1.375rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                        </div>
                    ))}
                </div>

                {/* Subscriptions List */}
                {subs.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                        <RefreshCw size={40} color="#94a3b8" style={{ marginBottom: '0.75rem' }} />
                        <div style={{ fontWeight: 700, color: '#374151', marginBottom: '0.5rem' }}>No subscriptions yet</div>
                        <div style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.25rem' }}>Set up a daily milk subscription and never run out.</div>
                        <button className="btn-primary" onClick={() => setShowCreate(true)}><Plus size={16} /> Create Subscription</button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {subs.map((s) => (
                            <div key={s.id} className="card fade-in" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                                <div style={{ width: 48, height: 48, background: s.status === 'active' ? '#d1fae5' : '#fef3c7', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                                    🥛
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>{s.product_name}</div>
                                    <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>{s.size} · {s.quantity} {s.quantity > 1 ? 'packets' : 'packet'} · {s.frequency}</div>
                                    <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.2rem' }}>
                                        Next delivery: <strong>{s.next_delivery}</strong>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1.0625rem' }}>{formatCurrency(s.price_per_unit * s.quantity)}<span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>/day</span></div>
                                    <span className={s.status === 'active' ? 'badge-success' : 'badge-warning'}>{s.status}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => togglePause(s.id)}
                                        style={{
                                            padding: '0.5rem 0.875rem', borderRadius: 8, border: '1px solid',
                                            borderColor: s.status === 'active' ? '#f59e0b' : '#059669',
                                            background: 'white', color: s.status === 'active' ? '#f59e0b' : '#059669',
                                            cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600,
                                            display: 'flex', alignItems: 'center', gap: '0.375rem',
                                        }}
                                    >
                                        {s.status === 'active' ? <Pause size={13} /> : <Play size={13} />}
                                        {s.status === 'active' ? 'Pause' : 'Resume'}
                                    </button>
                                    <button
                                        onClick={() => setShowPause(s.id)}
                                        className="btn-secondary"
                                        style={{ padding: '0.5rem 0.75rem', fontSize: '0.8125rem' }}
                                        title="Skip a day"
                                    >
                                        <Calendar size={13} />
                                    </button>
                                    <button
                                        onClick={() => { if (confirm('Cancel this subscription?')) deleteSub(s.id) }}
                                        style={{ padding: '0.5rem', borderRadius: 8, border: '1px solid #fee2e2', background: 'white', color: '#ef4444', cursor: 'pointer' }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Subscription Modal */}
            <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Subscription">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label className="label">Select Product</label>
                        <select className="input" value={newSub.product_id} onChange={e => setNewSub({ ...newSub, product_id: e.target.value })}>
                            <option value="">Choose a product...</option>
                            {PRODUCTS.map(p => <option key={p.id} value={p.id}>{p.name} — {p.size_label} ({formatCurrency(p.price)})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label">Daily Quantity</label>
                        <input className="input" type="number" min={1} max={10} value={newSub.quantity} onChange={e => setNewSub({ ...newSub, quantity: parseInt(e.target.value) })} />
                    </div>
                    <div>
                        <label className="label">Start Date</label>
                        <input className="input" type="date" value={newSub.start_date} onChange={e => setNewSub({ ...newSub, start_date: e.target.value })} min={new Date().toISOString().split('T')[0]} />
                    </div>
                    {newSub.product_id && (
                        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '0.75rem', fontSize: '0.875rem', color: '#166534' }}>
                            💰 Estimated monthly cost: <strong>{formatCurrency((PRODUCTS.find(p => p.id === newSub.product_id)?.price || 0) * newSub.quantity * 30)}</strong>
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                        <button className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                        <button className="btn-primary" onClick={createSubscription}>Create Subscription</button>
                    </div>
                </div>
            </Modal>

            {/* Skip Day Modal */}
            <Modal isOpen={!!showPause} onClose={() => setShowPause(null)} title="Skip Delivery Day" size="sm">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>Select a date to skip your delivery:</p>
                    <input className="input" type="date" value={pauseDate} onChange={e => setPauseDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                        <button className="btn-secondary" onClick={() => setShowPause(null)}>Cancel</button>
                        <button className="btn-primary" onClick={addPause}>Skip This Day</button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
