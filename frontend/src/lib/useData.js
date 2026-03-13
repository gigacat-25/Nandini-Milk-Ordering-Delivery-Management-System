import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/clerk-react'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

// Helper to handle API calls with Clerk Auth
async function apiFetch(path, options = {}, clerkToken = null) {
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    }

    if (clerkToken) {
        headers['Authorization'] = `Bearer ${clerkToken}`
    }

    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers
    })

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(err.error || 'Request failed')
    }

    return res.json()
}

// Hook for fetching data
export function useApiQuery(path, deps = [], clerkToken = null, options = {}) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchData = useCallback(async () => {
        if (options.skip) {
            setLoading(false)
            return
        }
        try {
            setLoading(true)
            const result = await apiFetch(path, {}, clerkToken)
            setData(result)
        } catch (err) {
            console.error('API request error:', err)
            setError(err)
        } finally {
            setLoading(false)
        }
    }, [path, ...deps, clerkToken, options.skip])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    return { data, loading, error, refetch: fetchData }
}


// --- Products ---
export function useProducts() {
    return useApiQuery('/products')
}

export async function createProduct(productData) {
    return apiFetch('/products', {
        method: 'POST',
        body: JSON.stringify(productData)
    })
}

export async function updateProduct(id, productData) {
    return apiFetch(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(productData)
    })
}

export async function deleteProduct(id) {
    return apiFetch(`/products/${id}`, {
        method: 'DELETE'
    })
}

export async function updateGlobalCutoffs(categories, morning, evening) {
    return apiFetch('/products/global/cutoffs', {
        method: 'PUT',
        body: JSON.stringify({ categories, cutoff_morning: morning, cutoff_evening: evening })
    })
}

// --- Orders ---
export function useOrders(customerId = null) {
    return useApiQuery(customerId ? `/orders?customerId=${customerId}` : '/orders', [customerId], null, { skip: customerId === null && false }) // Admin might want all orders, so we only skip if specifically handled. Wait, let's keep it simple.
}

export function useOrdersByDate(dateStr) {
    return useApiQuery(`/orders?date=${dateStr}`, [dateStr], null, { skip: !dateStr })
}

// --- Subscriptions ---
export function useSubscriptions(customerId = null) {
    return useApiQuery(customerId ? `/subscriptions?customerId=${customerId}` : '/subscriptions', [customerId], null, { skip: customerId === null && false })
}

// --- Deliveries ---
export function useDeliveries(dateStr) {
    return useApiQuery(`/deliveries?date=${dateStr}`, [dateStr])
}

// --- Subscription Pauses ---
export function useSubscriptionPauses(dateStr) {
    return useApiQuery(`/pauses?date=${dateStr}`, [dateStr])
}

// --- Partial Delivery Skips ---
export function usePartialSkips(dateStr) {
    return useApiQuery(`/skips?date=${dateStr}`, [dateStr])
}

export function usePartialSkipsForTargets(targetIds) {
    const idString = (targetIds || []).join(',')
    return useApiQuery(`/skips?targetIds=${idString}`, [idString])
}

export async function skipDeliveryItem(dateStr, target_id, product_id) {
    return apiFetch('/skips', {
        method: 'POST',
        body: JSON.stringify({ dateStr, targetId: target_id, productId: product_id })
    })
}

export async function unskipDeliveryItem(dateStr, target_id, product_id) {
    return apiFetch('/skips', {
        method: 'DELETE',
        body: JSON.stringify({ dateStr, targetId: target_id, productId: product_id })
    })
}

export async function updateOrderStatus(orderId, status) {
    return apiFetch(`/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
    })
}

// --- Users / Customers ---
export function useCustomers() {
    return useApiQuery('/users')
}

export function useUserProfile(userId) {
    return useApiQuery(`/users/${userId}`, [userId], null, { skip: !userId })
}

export async function updateUserProfile(userId, profileData) {
    return apiFetch(`/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(profileData)
    })
}

// --- Wallet ---
export function useWalletTransactions(customerId) {
    return useApiQuery(`/wallet/transactions?customerId=${customerId}`, [customerId])
}

// --- Mutations Helpers ---
export async function createOrder(customerId, items, totalAmount, deliverySlot = 'morning', deliveryDate) {
    return apiFetch('/orders', {
        method: 'POST',
        body: JSON.stringify({ customerId, items, totalAmount, deliverySlot, deliveryDate })
    })
}

export async function createSubscription(customerId, items, deliverySlot = 'morning', frequency = 'daily') {
    return apiFetch('/subscriptions', {
        method: 'POST',
        body: JSON.stringify({ customerId, items, deliverySlot, frequency })
    })
}

export async function deleteSubscription(id) {
    return apiFetch(`/subscriptions/${id}`, {
        method: 'DELETE'
    })
}

export async function pauseSubscriptionDate(subscriptionId, dateStr) {
    return apiFetch('/pauses', {
        method: 'POST',
        body: JSON.stringify({ subscriptionId, dateStr })
    })
}

export async function markOrderDelivered(orderId, customerId, amount, dateStr) {
    return apiFetch('/deliveries/mark', {
        method: 'POST',
        body: JSON.stringify({ orderId, customerId, amount, dateStr })
    })
}

export async function markSubscriptionDelivered(customerId, subscriptionId, dateStr, amount) {
    return apiFetch('/deliveries/mark', {
        method: 'POST',
        body: JSON.stringify({ customerId, subscriptionId, dateStr, amount })
    })
}

export async function unmarkOrderDelivered(customerId, orderId, dateStr, amount) {
    return apiFetch('/deliveries/unmark', {
        method: 'POST',
        body: JSON.stringify({ customerId, orderId, dateStr, amount })
    })
}

// --- Delivery Photos ---
export async function uploadDeliveryPhoto(file, deliveryType, targetId, dateStr) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'deliveries')
    formData.append('deliveryType', deliveryType)
    formData.append('targetId', targetId)
    formData.append('dateStr', dateStr)

    const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData
    })

    if (!res.ok) throw new Error('Upload failed')
    const data = await res.json()
    return data.url
}

export function useDeliveryPhotos(dateStr) {
    return useApiQuery(`/photos?date=${dateStr}`, [dateStr])
}

// --- Product Photos ---
export async function uploadProductPhoto(file, productId) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'products')
    formData.append('productId', productId)

    const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData
    })

    if (!res.ok) throw new Error('Upload failed')
    const data = await res.json()
    return data.url
}

export async function unmarkSubscriptionDelivered(customerId, subscriptionId, dateStr, amount) {
    return apiFetch('/deliveries/unmark', {
        method: 'POST',
        body: JSON.stringify({ customerId, subscriptionId, dateStr, amount })
    })
}

export async function addWalletFunds(customerId, amount, description = 'Funds Added via App') {
    return apiFetch('/wallet/add', {
        method: 'POST',
        body: JSON.stringify({ customerId, amount, description })
    })
}

export async function deleteCustomerAccount(customerId) {
    return apiFetch(`/users/${customerId}`, {
        method: 'DELETE'
    })
}

export async function upsertUser(clerkUser) {
    if (!clerkUser) return null

    const email = clerkUser.primaryEmailAddress?.emailAddress || null
    const phone = clerkUser.primaryPhoneNumber?.phoneNumber || null
    let fullName = clerkUser.fullName
    if (!fullName && clerkUser.firstName) fullName = `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim()

    return apiFetch('/users/upsert', {
        method: 'POST',
        body: JSON.stringify({ id: clerkUser.id, email, phone, full_name: fullName })
    })
}

export async function renewAppAccess(userId) {
    return apiFetch(`/users/${userId}/renew`, {
        method: 'POST'
    })
}

// --- Delivery Sessions ---
export function useDeliverySession(dateStr, slot) {
    return useApiQuery(`/sessions?date=${dateStr}&slot=${slot}`, [dateStr, slot])
}

export async function startDeliverySession(dateStr, slot, adminId) {
    return apiFetch('/sessions/start', {
        method: 'POST',
        body: JSON.stringify({ dateStr, slot, adminId })
    })
}

export async function endDeliverySession(dateStr, slot) {
    return apiFetch('/sessions/end', {
        method: 'POST',
        body: JSON.stringify({ dateStr, slot })
    })
}

export async function toggleSubscriptionStatus(subscriptionId, customerId, newStatus) {
    return apiFetch(`/subscriptions/${subscriptionId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
    })
}
