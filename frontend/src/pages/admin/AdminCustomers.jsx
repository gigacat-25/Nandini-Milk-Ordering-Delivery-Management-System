import { useState } from 'react'
import { Search, Eye, Mail, Phone, Edit2, AlertTriangle, Loader2, RefreshCw } from 'lucide-react'
import { useCustomers, useOrders, useSubscriptions, addWalletFunds, deleteCustomerAccount, renewAppAccess } from '../../lib/useData'
import { formatCurrency, formatDate } from '../../lib/utils'
import toast from 'react-hot-toast'
import Navbar from '../../components/Navbar'
import Modal from '../../components/Modal'

export default function AdminCustomers() {
    const { data: customers, loading: customersLoading, refetch: refetchCustomers } = useCustomers()
    const { data: orders, loading: ordersLoading } = useOrders()
    const { data: subscriptions, loading: subsLoading } = useSubscriptions()

    const [search, setSearch] = useState('')
    const [selected, setSelected] = useState(null)
    const [loadingAction, setLoadingAction] = useState(false)

    // Compute stats on the fly
    const computedCustomers = (customers || []).map(c => {
        const cOrders = (orders || []).filter(o => o.customer_id === c.id)
        const cSubs = (subscriptions || []).filter(s => s.customer_id === c.id)

        const appExpiry = c.app_fee_expiry ? new Date(c.app_fee_expiry) : null
        const hasAppAccess = appExpiry && appExpiry > new Date()

        return {
            ...c,
            total_orders: cOrders.length,
            total_spent: cOrders.reduce((sum, o) => sum + o.total_amount, 0),
            subscriptions: cSubs.length,
            active_subscriptions: cSubs.filter(s => s.status === 'active').length,
            hasAppAccess,
            appExpiry
        }
    })

    const filtered = computedCustomers.filter(c =>
        c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.includes(search) ||
        c.email?.toLowerCase().includes(search.toLowerCase())
    )

    if (customersLoading || ordersLoading || subsLoading) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', color: '#64748b' }}><Loader2 className="spin" size={32} /></div>

    async function handleRenewSubscription(customer) {
        if (!confirm(`Are you sure you want to manually grant/renew 30 days of App Access for ${customer.full_name || 'this customer'}?`)) return

        setLoadingAction(true)
        try {
            await renewAppAccess(customer.id)
            await refetchCustomers()
            toast.success('App Access renewed for 30 days')
        } catch (err) {
            toast.error('Failed to renew access: ' + err.message)
        } finally {
            setLoadingAction(false)
        }
    }

    async function handleEditWallet(customer) {
        const rawAmount = prompt(`Current Wallet Balance: ${formatCurrency(customer.wallet_balance || 0)}\n\nEnter amount to add (use negative e.g., -50 to deduct):`)
        if (!rawAmount) return

        const amount = Number(rawAmount)
        if (isNaN(amount)) return toast.error('Invalid amount')

        const desc = prompt('Enter a reason/description for this adjustment:', 'Admin Manual Adjustment')
        if (!desc) return

        setLoadingAction(true)
        try {
            await addWalletFunds(customer.id, amount, desc)
            await refetchCustomers()
            toast.success('Wallet updated successfully')
            setSelected(null)
        } catch (err) {
            toast.error('Failed to update wallet: ' + err.message)
        } finally {
            setLoadingAction(false)
        }
    }

    async function handleDeleteAccount(customer) {
        let msg = `WARNING: Are you sure you want to completely delete ${customer.full_name}'s account?\n\nThis will instantly delete ALL their subscriptions, orders, and wallet history. This action CANNOT be reversed. `

        if (customer.wallet_balance > 0) {
            msg += `\n\n📌 NOTE: They have an outstanding Wallet Balance of ${formatCurrency(customer.wallet_balance)}. YOU MUST REFUND them this amount manually before/after doing this!`
        }

        if (!confirm(msg)) return
        if (!confirm('Type OK if you are absolutely sure you want to eradicate this customer data from the system.')) return

        setLoadingAction(true)
        try {
            await deleteCustomerAccount(customer.id)
            await refetchCustomers()
            toast.success('Account completely deleted')
            setSelected(null)
        } catch (err) {
            toast.error('Failed to delete account: ' + err.message)
        } finally {
            setLoadingAction(false)
        }
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
            <Navbar />
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem' }}>
                <div className="page-header">
                    <h1 className="page-title">Customer Management</h1>
                    <p className="page-subtitle">View all registered customers and their subscriptions.</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: 'Total Customers', value: computedCustomers.length },
                        { label: 'Active Milk Subs', value: computedCustomers.reduce((s, c) => s + c.active_subscriptions, 0) },
                        { label: 'Active App Access', value: computedCustomers.filter(c => c.hasAppAccess).length },
                        { label: 'Total Revenue', value: formatCurrency(computedCustomers.reduce((s, c) => s + c.total_spent, 0)) },
                    ].map((s) => (
                        <div key={s.label} className="card" style={{ textAlign: 'center', padding: '1rem' }}>
                            <div style={{ fontSize: '1.375rem', fontWeight: 800, color: '#0f172a' }}>{s.value}</div>
                            <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Search */}
                <div style={{ position: 'relative', marginBottom: '1.5rem', maxWidth: 400 }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input className="input" placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '2.25rem' }} />
                </div>

                {/* Table */}
                <div className="card" style={{ padding: 0 }}>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th className="text-left w-[20%]">Customer</th>
                                    <th className="text-left w-[20%]">Contact</th>
                                    <th className="text-center">App Access</th>
                                    <th className="text-center">Active Subs</th>
                                    <th className="text-center">Orders</th>
                                    <th className="text-right">Spent</th>
                                    <th className="text-right">Wallet</th>
                                    <th className="text-center">Joined</th>
                                    <th className="w-[80px]"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((c) => (
                                    <tr key={c.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{
                                                    width: 36, height: 36, borderRadius: '50%', background: '#dbeafe',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: '#2563eb', fontWeight: 700, fontSize: '0.875rem', flexShrink: 0,
                                                }}>
                                                    {c.full_name?.[0] || 'U'}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.875rem' }}>{c.full_name || 'Unknown'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '0.8125rem', color: '#374151' }}>{c.phone || 'N/A'}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{c.email || 'N/A'}</div>
                                        </td>
                                        <td className="text-center">
                                            <span className={c.hasAppAccess ? 'badge-success' : 'badge-warning'}>{c.hasAppAccess ? 'Active' : 'Expired'}</span>
                                        </td>
                                        <td className="text-center">
                                            <span className={c.active_subscriptions > 0 ? 'badge-blue' : 'badge-gray'}>{c.active_subscriptions} active</span>
                                        </td>
                                        <td className="text-center font-bold">{c.total_orders}</td>
                                        <td className="text-right font-bold text-blue-600">{formatCurrency(c.total_spent)}</td>
                                        <td className="text-right font-bold text-emerald-600 bg-emerald-50/50 px-3 py-1 rounded-lg inline-block">{formatCurrency(c.wallet_balance || 0)}</td>
                                        <td className="text-center font-medium text-slate-500">{formatDate(c.created_at)}</td>
                                        <td className="text-right">
                                            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors" title="View Details" onClick={() => setSelected(c)}>
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

            {/* Customer Detail Modal */}
            {selected && (
                <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Customer Details">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', fontWeight: 800, fontSize: '1.25rem' }}>
                                {selected.full_name?.[0] || 'U'}
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '1.125rem', color: '#0f172a' }}>{selected.full_name || 'Unknown User'}</div>
                                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Customer since {formatDate(selected.created_at)}</div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            {[
                                { icon: Phone, label: 'Phone', value: selected.phone || 'N/A' },
                                { icon: Mail, label: 'Email', value: selected.email || 'N/A' },
                            ].map(f => (
                                <div key={f.label} style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: 8 }}>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>{f.label}</div>
                                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.875rem' }}>{f.value}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: 8 }}>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Clerk ID</div>
                            <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.875rem' }}>{selected.id}</div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                            {[
                                { label: 'Milk Subs', value: selected.active_subscriptions },
                                { label: 'App Access', value: selected.hasAppAccess ? 'Active' : 'Expired', highlight: selected.hasAppAccess },
                                { label: 'Total Orders', value: selected.total_orders },
                                { label: 'Total Spent', value: formatCurrency(selected.total_spent) },
                                { label: 'Wallet Balance', value: formatCurrency(selected.wallet_balance || 0), highlight: true },
                            ].map(s => (
                                <div key={s.label} style={{ background: s.highlight ? '#dcfce7' : '#f8fafc', padding: '0.75rem', borderRadius: 8, textAlign: 'center', border: s.highlight ? '1px solid #86efac' : 'none' }}>
                                    <div style={{ fontWeight: 800, fontSize: '1.125rem', color: s.highlight ? '#166534' : '#2563eb' }}>{s.value}</div>
                                    <div style={{ fontSize: '0.75rem', color: s.highlight ? '#15803d' : '#64748b' }}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                            <button className="btn-secondary" onClick={() => handleDeleteAccount(selected)} disabled={loadingAction} style={{ color: '#dc2626', borderColor: '#fca5a5', background: '#fef2f2', display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                                {loadingAction ? <Loader2 size={16} className="spin" /> : <AlertTriangle size={16} />} Delete Account
                            </button>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button className="btn-secondary" onClick={() => handleRenewSubscription(selected)} disabled={loadingAction} style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                                    {loadingAction ? <Loader2 size={16} className="spin" /> : <RefreshCw size={16} />} Renew Access
                                </button>
                                <button className="btn-primary" onClick={() => handleEditWallet(selected)} disabled={loadingAction} style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                                    {loadingAction ? <Loader2 size={16} className="spin" /> : <Edit2 size={16} />} Edit Wallet
                                </button>
                                <button className="btn-secondary" onClick={() => setSelected(null)}>Close</button>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    )
}
