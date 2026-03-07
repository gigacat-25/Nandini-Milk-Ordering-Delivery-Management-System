import { X } from 'lucide-react'
import { useEffect } from 'react'

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden'
        else document.body.style.overflow = 'auto'
        return () => { document.body.style.overflow = 'auto' }
    }, [isOpen])

    if (!isOpen) return null

    const widths = { sm: 400, md: 560, lg: 720 }

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 1000,
                background: 'rgba(15, 23, 42, 0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '1rem', backdropFilter: 'blur(2px)',
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: 'white', borderRadius: 16,
                    padding: '1.5rem', width: '100%', maxWidth: widths[size],
                    maxHeight: '90vh', overflow: 'auto',
                    boxShadow: '0 20px 60px rgb(0 0 0 / 0.15)',
                    animation: 'fadeIn 0.2s ease',
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>{title}</h2>
                    <button
                        onClick={onClose}
                        style={{
                            border: 'none', background: '#f1f5f9', cursor: 'pointer',
                            borderRadius: 8, width: 32, height: 32, display: 'flex',
                            alignItems: 'center', justifyContent: 'center', color: '#64748b',
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    )
}
