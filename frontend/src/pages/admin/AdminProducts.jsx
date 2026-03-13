import { useState, useRef, useEffect } from 'react'
import { Plus, Pencil, Trash2, Package, Camera, X, Loader2, Check } from 'lucide-react'
import { useProducts, uploadProductPhoto } from '../../lib/useData'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/utils'
import Navbar from '../../components/Navbar'
import Modal from '../../components/Modal'
import ClockPicker from '../../components/ClockPicker'
import toast from 'react-hot-toast'

export default function AdminProducts() {
    const { data: products, loading, refetch } = useProducts()
    const [editProduct, setEditProduct] = useState(null)
    const [showCreate, setShowCreate] = useState(false)
    const [form, setForm] = useState({ name: '', category: 'Milk', size_label: '', price: '', stock_qty: '', active: true, image_url: '', cutoff_morning: 15.5, cutoff_evening: 19.5 })
    const [globalCutoffs, setGlobalCutoffs] = useState({ milk_morning: 15.5, milk_evening: 19.5 })
    const [updatingGlobal, setUpdatingGlobal] = useState(false)
    const [photoFile, setPhotoFile] = useState(null)
    const [photoPreview, setPhotoPreview] = useState(null)
    const [saving, setSaving] = useState(false)
    const [pickerTarget, setPickerTarget] = useState(null) // { field: 'milk_morning' } or { field: 'cutoff_morning', isForm: true }
    const fileInputRef = useRef(null)

    // Sync global cutoffs from existing products
    useEffect(() => {
        if (products?.length > 0) {
            const milkProd = products.find(p => p.category === 'Milk' || p.category === 'Curd')
            if (milkProd) {
                setGlobalCutoffs({
                    milk_morning: milkProd.cutoff_morning || 15.5,
                    milk_evening: milkProd.cutoff_evening || 19.5
                })
            }
        }
    }, [products])

    async function handleSave() {
        if (!form.name || !form.price || !form.size_label) { toast.error('Fill in all required fields'); return }
        setSaving(true)

        try {
            let finalImageUrl = form.image_url

            // 1. Upload photo if exists
            if (photoFile) {
                try {
                    finalImageUrl = await uploadProductPhoto(photoFile, editProduct?.id || 'new')
                } catch (err) {
                    console.error('Upload failed:', err)
                    toast.error('Storage Error: Please create a PUBLIC bucket named "product-photos" in your Supabase Dashboard to upload images.')
                    setSaving(false)
                    return // Stop the save process if upload fails
                }
            }

            const productData = {
                ...form,
                price: parseFloat(form.price),
                stock_qty: parseInt(form.stock_qty || 0),
                image_url: finalImageUrl,
                cutoff_morning: parseFloat(form.cutoff_morning),
                cutoff_evening: parseFloat(form.cutoff_evening)
            }

            if (editProduct) {
                const { error } = await supabase.from('products').update(productData).eq('id', editProduct.id)
                if (error) throw error
                toast.success('Product updated successfully')
            } else {
                const { error } = await supabase.from('products').insert([productData])
                if (error) throw error
                toast.success('Product added successfully')
            }
            refetch()
            closeModal()
        } catch (err) {
            toast.error(err.message)
        } finally {
            setSaving(false)
        }
    }

    async function saveGlobalCutoffs() {
        setUpdatingGlobal(true)
        try {
            const { error } = await supabase.from('products')
                .update({
                    cutoff_morning: globalCutoffs.milk_morning,
                    cutoff_evening: globalCutoffs.milk_evening
                })
                .in('category', ['Milk', 'Curd'])

            if (error) throw error
            toast.success('Milk & Curd cut-offs updated for all products')
            refetch()
        } catch (err) {
            toast.error(err.message)
        } finally {
            setUpdatingGlobal(false)
        }
    }

    function closeModal() {
        setShowCreate(false)
        setEditProduct(null)
        setPhotoFile(null)
        setPhotoPreview(null)
        setForm({ name: '', category: 'Milk', size_label: '', price: '', stock_qty: '', active: true, image_url: '', cutoff_morning: 15.5, cutoff_evening: 19.5 })
    }

    function openEdit(p) {
        setForm({
            name: p.name,
            category: p.category,
            size_label: p.size_label,
            price: String(p.price),
            stock_qty: String(p.stock_qty),
            active: p.active,
            image_url: p.image_url || '',
            cutoff_morning: p.cutoff_morning || 15.5,
            cutoff_evening: p.cutoff_evening || 19.5
        })
        setPhotoPreview(p.image_url || null)
        setEditProduct(p)
        setShowCreate(true)
    }

    function handlePhotoSelect(e) {
        const file = e.target.files?.[0]
        if (!file) return
        setPhotoFile(file)
        setPhotoPreview(URL.createObjectURL(file))
    }

    const deleteProduct = async (id) => {
        if (!window.confirm('Delete this product?')) return
        const { error } = await supabase.from('products').delete().eq('id', id)
        if (error) { toast.error(error.message); return }
        toast.success('Product deleted')
        refetch()
    }

    const toggleActive = async (p) => {
        const { error } = await supabase.from('products').update({ active: !p.active }).eq('id', p.id)
        if (error) { toast.error(error.message); return }
        refetch()
    }

    const categoryEmoji = { Milk: '🥛', Curd: '🫙', 'Milk Products': '🧈' }

    // Helper to open the native time picker programmatically

    // Helper to convert decimal hours (15.5) to time string ("15:30")
    const decimalToTime = (decimal) => {
        const d = parseFloat(decimal) || 0
        const hours = Math.floor(d)
        const minutes = Math.round((d - hours) * 60)
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    }

    // Helper to convert time string ("15:30") to decimal hours (15.5)
    const timeToDecimal = (timeStr) => {
        const [hours, minutes] = (timeStr || "00:00").split(':').map(Number)
        return hours + (minutes / 60)
    }

    // Helper to display decimal hours as 12h format (15.5 -> 3:30 PM)
    const format12h = (decimal) => {
        const d = parseFloat(decimal) || 0
        const hours = Math.floor(d)
        const minutes = Math.round((d - hours) * 60)
        const h12 = hours % 12 || 12
        const ampm = hours >= 12 ? 'PM' : 'AM'
        return `${h12}:${String(minutes).padStart(2, '0')} ${ampm}`
    }

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
                    <button className="btn-primary" onClick={() => setShowCreate(true)}>
                        <Plus size={16} /> Add Product
                    </button>
                </div>

                {/* Global Cutoff Settings Card */}
                <div className="card" style={{ marginBottom: '2rem', background: '#fffbeb', borderColor: '#fde68a' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#92400e', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        ⏰ Milk & Curd Cut-off Times
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: '#b45309', marginBottom: '1rem' }}>
                        These settings apply to <strong>all</strong> Milk and Curd products. Booking is required for these.
                    </p>
                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <div>
                            <label className="label" style={{ color: '#92400e' }}>Morning Cut-off</label>
                            <div
                                onClick={() => setPickerTarget({ field: 'milk_morning' })}
                                style={{
                                    padding: '0.75rem', borderRadius: 10, border: '1px solid #fde68a',
                                    background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    fontSize: '1rem', fontWeight: 700, color: '#0f172a', width: 140
                                }}
                            >
                                🕒 {format12h(globalCutoffs.milk_morning)}
                            </div>
                        </div>
                        <div>
                            <label className="label" style={{ color: '#92400e' }}>Evening Cut-off</label>
                            <div
                                onClick={() => setPickerTarget({ field: 'milk_evening' })}
                                style={{
                                    padding: '0.75rem', borderRadius: 10, border: '1px solid #fde68a',
                                    background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    fontSize: '1rem', fontWeight: 700, color: '#0f172a', width: 140
                                }}
                            >
                                🕒 {format12h(globalCutoffs.milk_evening)}
                            </div>
                        </div>
                        <button
                            className="btn-primary"
                            style={{ background: '#d97706', height: '42px' }}
                            onClick={saveGlobalCutoffs}
                            disabled={updatingGlobal}
                        >
                            {updatingGlobal ? 'Syncing...' : 'Update All Milk & Curd'}
                        </button>
                    </div>
                </div>

                {/* Product Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                    {(products || []).map(p => (
                        <div key={p.id} className="card" style={{ opacity: p.active ? 1 : 0.6, padding: 0, overflow: 'hidden' }}>
                            {/* Product Image or Placeholder */}
                            <div style={{ width: '100%', height: 160, background: '#f1f5f9', position: 'relative' }}>
                                {p.image_url ? (
                                    <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
                                        {categoryEmoji[p.category] || '📦'}
                                    </div>
                                )}
                                <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: '0.4rem' }}>
                                    <button onClick={() => openEdit(p)} style={{ width: 32, height: 32, border: 'none', background: 'white', borderRadius: 8, cursor: 'pointer', color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}><Pencil size={14} /></button>
                                    <button onClick={() => deleteProduct(p.id)} style={{ width: 32, height: 32, border: 'none', background: 'white', borderRadius: 8, cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}><Trash2 size={14} /></button>
                                </div>
                            </div>

                            <div style={{ padding: '1rem' }}>
                                <div style={{ marginBottom: '0.875rem' }}>
                                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>{p.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{p.size_label}</div>
                                    {p.category === 'Milk Products' && (
                                        <div style={{ fontSize: '0.7rem', color: '#2563eb', fontWeight: 600, marginTop: '0.25rem' }}>
                                            ⏰ Cut-off: {format12h(p.cutoff_morning)} / {format12h(p.cutoff_evening)}
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <span style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a' }}>{formatCurrency(p.price)}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <button
                                            onClick={async () => {
                                                const { error } = await supabase.from('products').update({ stock_qty: p.stock_qty > 0 ? 0 : 1 }).eq('id', p.id)
                                                if (error) toast.error(error.message)
                                                else refetch()
                                            }}
                                            style={{
                                                padding: '0.25rem 0.75rem', borderRadius: 20, border: 'none',
                                                background: p.stock_qty > 0 ? '#dcfce7' : '#fee2e2',
                                                color: p.stock_qty > 0 ? '#15803d' : '#991b1b',
                                                fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', gap: '0.25rem'
                                            }}
                                        >
                                            <Package size={12} />
                                            {p.stock_qty > 0 ? 'In Stock' : 'Out of Stock'}
                                        </button>
                                        <button
                                            onClick={() => toggleActive(p)}
                                            style={{
                                                padding: '0.25rem 0.75rem', borderRadius: 20, border: 'none',
                                                background: p.active ? '#eff6ff' : '#f1f5f9',
                                                color: p.active ? '#1e40af' : '#94a3b8',
                                                fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                                            }}
                                        >
                                            {p.active ? 'Active' : 'Archived'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Add/Edit Modal */}
            <Modal isOpen={showCreate} onClose={closeModal} title={editProduct ? 'Edit Product' : 'Add New Product'}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Image Upload Area */}
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            width: '100%', height: 180, border: '2px dashed #e2e8f0', borderRadius: 12,
                            background: photoPreview ? 'none' : '#f8fafc', overflow: 'hidden',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', position: 'relative'
                        }}
                    >
                        {photoPreview ? (
                            <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (
                            <>
                                <Camera size={32} color="#94a3b8" />
                                <span style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.5rem' }}>Click to upload product photo</span>
                            </>
                        )}
                        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoSelect} />

                        {(photoFile || (editProduct && form.image_url)) && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setPhotoFile(null)
                                    setPhotoPreview(null)
                                    setForm({ ...form, image_url: '' })
                                }}
                                style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

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
                                <label className="label">Availability Status</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => setForm({ ...form, stock_qty: '1' })}
                                        style={{
                                            flex: 1, padding: '0.75rem', borderRadius: 10, border: '2px solid',
                                            borderColor: form.stock_qty > 0 ? '#22c55e' : '#e2e8f0',
                                            background: form.stock_qty > 0 ? '#22c55e' : 'white',
                                            color: form.stock_qty > 0 ? 'white' : '#64748b',
                                            fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {form.stock_qty > 0 && <Check size={16} />}
                                        In Stock
                                    </button>
                                    <button
                                        onClick={() => setForm({ ...form, stock_qty: '0' })}
                                        style={{
                                            flex: 1, padding: '0.75rem', borderRadius: 10, border: '2px solid',
                                            borderColor: form.stock_qty === '0' || form.stock_qty === 0 ? '#ef4444' : '#e2e8f0',
                                            background: form.stock_qty === '0' || form.stock_qty === 0 ? '#ef4444' : 'white',
                                            color: form.stock_qty === '0' || form.stock_qty === 0 ? 'white' : '#64748b',
                                            fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {(form.stock_qty === '0' || form.stock_qty === 0) && <Check size={16} />}
                                        Out of Stock
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Cutoff Settings in Modal */}
                        <div style={{
                            padding: '1rem',
                            background: '#f8fafc',
                            borderRadius: 12,
                            border: '1px solid #e2e8f0',
                            marginTop: '0.5rem',
                            display: form.category === 'Milk Products' ? 'block' : 'none'
                        }}>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a', marginBottom: '0.75rem' }}>📦 Individual Cut-off Times (Ready in Stock)</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                                <div>
                                    <label className="label">Morning Cut-off</label>
                                    <div
                                        onClick={() => setPickerTarget({ field: 'cutoff_morning', isForm: true })}
                                        className="input"
                                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', fontWeight: 600 }}
                                    >
                                        🕒 {format12h(form.cutoff_morning)}
                                    </div>
                                </div>
                                <div>
                                    <label className="label">Evening Cut-off</label>
                                    <div
                                        onClick={() => setPickerTarget({ field: 'cutoff_evening', isForm: true })}
                                        className="input"
                                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', fontWeight: 600 }}
                                    >
                                        🕒 {format12h(form.cutoff_evening)}
                                    </div>
                                </div>
                            </div>
                            <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.5rem' }}>
                                For "Milk Products", the cut-off can be different as they are in stock. Select the exact time using the picker.
                            </p>
                        </div>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '-0.5rem' }}>
                        Note: If product images are not showing, ensure your Supabase storage bucket has public read access.
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                        <button className="btn-secondary" onClick={closeModal}>Cancel</button>
                        <button className="btn-primary" onClick={handleSave} disabled={saving}>
                            {saving ? <><Loader2 size={16} className="spin" /> Saving...</> : editProduct ? 'Save Changes' : 'Add Product'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Premium Clock Picker */}
            <ClockPicker
                isOpen={!!pickerTarget}
                onClose={() => setPickerTarget(null)}
                initialValue={pickerTarget?.isForm ? form[pickerTarget.field] : globalCutoffs[pickerTarget?.field]}
                onSave={(val) => {
                    if (pickerTarget.isForm) {
                        setForm({ ...form, [pickerTarget.field]: val })
                    } else {
                        setGlobalCutoffs({ ...globalCutoffs, [pickerTarget.field]: val })
                    }
                }}
            />
        </div>
    )
}
