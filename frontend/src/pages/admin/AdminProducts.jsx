import { useState } from 'react'
import { Plus, Pencil, Trash2, Package } from 'lucide-react'
import { useProducts } from '../../lib/useData'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/utils'
import Navbar from '../../components/Navbar'
import Modal from '../../components/Modal'
import toast from 'react-hot-toast'

export default function AdminProducts() {
    const { data: products, loading, refetch } = useProducts()
    const [editProduct, setEditProduct] = useState(null)
    const [showCreate, setShowCreate] = useState(false)
    const [form, setForm] = useState({ name: '', category: 'Milk', size_label: '', price: '', stock_qty: '', active: true })

    async function handleSave() {
        if (!form.name || !form.price || !form.size_label) { toast.error('Fill in all required fields'); return }

        try {
            if (editProduct) {
                const { error } = await supabase.from('products').update({ ...form, price: parseFloat(form.price), stock_qty: parseInt(form.stock_qty || 0) }).eq('id', editProduct.id)
                if (error) throw error
                toast.success('Product updated')
            } else {
                const { error } = await supabase.from('products').insert([{ ...form, price: parseFloat(form.price), stock_qty: parseInt(form.stock_qty || 0) }])
                if (error) throw error
                toast.success('Product added')
            }
            refetch()
            setEditProduct(null); setShowCreate(false)
            setForm({ name: '', category: 'Milk', size_label: '', price: '', stock_qty: '', active: true })
        } catch (err) {
            toast.error(err.message)
        }
    }

    function openEdit(p) {
        setForm({ name: p.name, category: p.category, size_label: p.size_label, price: String(p.price), stock_qty: String(p.stock_qty), active: p.active })
        setEditProduct(p)
        setShowCreate(true)
    }

    async function deleteProduct(id) {
        if (!window.confirm('Delete this product?')) return
        const { error } = await supabase.from('products').delete().eq('id', id)
        if (error) { toast.error(error.message); return }
        toast.success('Product deleted')
        refetch()
    }

    async function toggleActive(p) {
        const { error } = await supabase.from('products').update({ active: !p.active }).eq('id', p.id)
        if (error) { toast.error(error.message); return }
        refetch()
    }

    const categoryEmoji = { Milk: '🥛', Curd: '🫙', 'Milk Products': '🧈' }

    if (loading) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', color: '#64748b' }}>Loading products...</div>

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
            <Navbar />
            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 className="page-title">Product Management</h1>
                        <p className="page-subtitle">Manage your product catalog and pricing.</p>
                    </div>
                    <button className="btn-primary" onClick={() => { setForm({ name: '', category: 'Milk', size_label: '', price: '', stock_qty: '', active: true }); setEditProduct(null); setShowCreate(true) }}>
                        <Plus size={16} /> Add Product
                    </button>
                </div>

                {/* Product Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                    {(products || []).map(p => (
                        <div key={p.id} className="card" style={{ opacity: p.active ? 1 : 0.6 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: 44, height: 44, background: p.category === 'Milk' ? '#dbeafe' : p.category === 'Curd' ? '#fef9c3' : '#fef3c7', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                                        {categoryEmoji[p.category] || '📦'}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>{p.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{p.size_label}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.375rem' }}>
                                    <button onClick={() => openEdit(p)} style={{ padding: '0.375rem', border: 'none', background: '#f1f5f9', borderRadius: 6, cursor: 'pointer', color: '#374151' }}><Pencil size={14} /></button>
                                    <button onClick={() => deleteProduct(p.id)} style={{ padding: '0.375rem', border: 'none', background: '#fee2e2', borderRadius: 6, cursor: 'pointer', color: '#dc2626' }}><Trash2 size={14} /></button>
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <span style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a' }}>{formatCurrency(p.price)}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Stock: {p.stock_qty}</span>
                                    <button
                                        onClick={() => toggleActive(p)}
                                        style={{
                                            padding: '0.2rem 0.625rem', borderRadius: 20, border: 'none',
                                            background: p.active ? '#d1fae5' : '#f1f5f9',
                                            color: p.active ? '#059669' : '#94a3b8',
                                            fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                                        }}
                                    >
                                        {p.active ? 'Active' : 'Inactive'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Add/Edit Modal */}
            <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); setEditProduct(null) }} title={editProduct ? 'Edit Product' : 'Add New Product'}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    <div>
                        <label className="label">Product Name *</label>
                        <input className="input" placeholder="e.g. Nandini Toned Milk" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                        <div>
                            <label className="label">Category *</label>
                            <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                <option>Milk</option><option>Curd</option><option>Milk Products</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">Size / Label *</label>
                            <input className="input" placeholder="e.g. 1L Packet" value={form.size_label} onChange={e => setForm({ ...form, size_label: e.target.value })} />
                        </div>
                        <div>
                            <label className="label">Price (₹) *</label>
                            <input className="input" type="number" placeholder="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                        </div>
                        <div>
                            <label className="label">Stock Qty</label>
                            <input className="input" type="number" placeholder="0" value={form.stock_qty} onChange={e => setForm({ ...form, stock_qty: e.target.value })} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                        <button className="btn-secondary" onClick={() => { setShowCreate(false); setEditProduct(null) }}>Cancel</button>
                        <button className="btn-primary" onClick={handleSave}>{editProduct ? 'Save Changes' : 'Add Product'}</button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
