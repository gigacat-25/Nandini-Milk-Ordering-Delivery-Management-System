import { useState } from 'react'
import { IndianRupee, Plus, History, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { useUserProfile, useWalletTransactions, addWalletFunds } from '../../lib/useData'
import { useUser } from '@clerk/clerk-react'
import { formatCurrency, formatDate } from '../../lib/utils'
import Navbar from '../../components/Navbar'
import Modal from '../../components/Modal'
import toast from 'react-hot-toast'

export default function WalletPage() {
    const { user } = useUser()
    const { data: profile, loading: profileLoading, refetch: refetchProfile } = useUserProfile(user?.id)
    const { data: transactions, loading: txnsLoading, refetch: refetchTxns } = useWalletTransactions(user?.id)

    const [showTopUp, setShowTopUp] = useState(false)
    const [amount, setAmount] = useState(500)
    const [isProcessing, setIsProcessing] = useState(false)

    async function handleAddFunds() {
        if (amount < 100) { toast.error('Minimum top-up is ₹100'); return }
        setIsProcessing(true)

        // Simulate payment gateway delay
        setTimeout(async () => {
            try {
                await addWalletFunds(user.id, amount)
                toast.success(`Successfully added ${formatCurrency(amount)} to wallet!`)
                setShowTopUp(false)
                refetchProfile()
                refetchTxns()
            } catch (err) {
                toast.error('Failed to add funds: ' + err.message)
            } finally {
                setIsProcessing(false)
            }
        }, 1500)
    }

    if (profileLoading || txnsLoading) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', color: '#64748b' }}>Loading wallet...</div>

    const balance = profile?.wallet_balance || 0

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
            <Navbar />
            <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>
                <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 className="page-title">Wallet & Payments</h1>
                        <p className="page-subtitle">Manage your prepaid balance for daily deliveries.</p>
                    </div>
                    <button className="btn-primary" onClick={() => setShowTopUp(true)}>
                        <Plus size={16} /> Add Funds
                    </button>
                </div>

                {/* Wallet Balance Card */}
                <div className="card fade-in" style={{
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                    color: 'white',
                    marginBottom: '2rem',
                    border: 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '2rem'
                }}>
                    <div>
                        <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>Current Balance</div>
                        <div style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1 }}>{formatCurrency(balance)}</div>
                    </div>
                    <div style={{ width: 64, height: 64, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IndianRupee size={32} color="white" />
                    </div>
                </div>

                {/* Transaction History */}
                <div className="card">
                    <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#0f172a', margin: '0 0 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <History size={18} /> Transaction History
                    </h2>

                    {(transactions || []).length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📭</div>
                            <div style={{ fontWeight: 600 }}>No transactions yet</div>
                            <div style={{ fontSize: '0.875rem' }}>Top up your wallet to get started.</div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {transactions.map(t => {
                                const isAddition = t.amount > 0
                                return (
                                    <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#f8fafc', borderRadius: 8, border: '1px solid #f1f5f9' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{
                                                width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: isAddition ? '#d1fae5' : '#fee2e2', color: isAddition ? '#059669' : '#dc2626'
                                            }}>
                                                {isAddition ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.95rem' }}>{t.description}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{formatDate(t.created_at)}</div>
                                            </div>
                                        </div>
                                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: isAddition ? '#059669' : '#0f172a' }}>
                                            {isAddition ? '+' : ''}{formatCurrency(t.amount)}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Top Up Modal */}
            <Modal isOpen={showTopUp} onClose={() => !isProcessing && setShowTopUp(false)} title="Add Funds to Wallet">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                        {[500, 1000, 2000].map(val => (
                            <button
                                key={val}
                                onClick={() => setAmount(val)}
                                style={{
                                    padding: '0.75rem', borderRadius: 8, border: '2px solid',
                                    borderColor: amount === val ? '#2563eb' : '#e2e8f0',
                                    background: amount === val ? '#eff6ff' : 'white',
                                    color: amount === val ? '#1d4ed8' : '#64748b',
                                    fontWeight: 600, cursor: 'pointer'
                                }}
                            >
                                {formatCurrency(val)}
                            </button>
                        ))}
                    </div>

                    <div>
                        <label className="label">Custom Amount (₹)</label>
                        <input
                            type="number"
                            className="input"
                            value={amount}
                            onChange={e => setAmount(Number(e.target.value))}
                            min={100}
                        />
                    </div>

                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 8, fontSize: '0.875rem', color: '#64748b' }}>
                        Transactions are secured. You are adding funds to handle your recurring milk deliveries. Deliveries will be paused if your balance drops below the daily order amount.
                    </div>

                    <button
                        className="btn-primary"
                        onClick={handleAddFunds}
                        style={{ width: '100%', justifyContent: 'center', padding: '1rem', fontSize: '1.05rem' }}
                        disabled={isProcessing}
                    >
                        {isProcessing ? 'Processing Payment...' : `Pay ${formatCurrency(amount)}`}
                    </button>
                </div>
            </Modal>
        </div>
    )
}
