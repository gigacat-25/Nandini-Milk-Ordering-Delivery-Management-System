import { create } from 'zustand'

// Cart store
export const useCartStore = create((set, get) => ({
    items: [],
    addItem: (product, quantity = 1) => {
        const items = get().items
        const existing = items.find((i) => i.id === product.id)
        if (existing) {
            set({ items: items.map((i) => i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i) })
        } else {
            set({ items: [...items, { ...product, quantity }] })
        }
    },
    removeItem: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
    updateQty: (id, quantity) => {
        if (quantity <= 0) {
            set({ items: get().items.filter((i) => i.id !== id) })
        } else {
            set({ items: get().items.map((i) => i.id === id ? { ...i, quantity } : i) })
        }
    },
    clearCart: () => set({ items: [] }),
    get total() {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    },
}))

// PWA Store
export const usePWAStore = create((set) => ({
    deferredPrompt: null,
    setDeferredPrompt: (prompt) => set({ deferredPrompt: prompt }),
    clearPrompt: () => set({ deferredPrompt: null }),
}))
