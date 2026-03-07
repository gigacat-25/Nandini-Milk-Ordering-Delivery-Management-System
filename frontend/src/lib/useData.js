import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'
import { useUser } from '@clerk/clerk-react'

// Helper to handle loading/error state for async fetches
export function useSupabaseQuery(queryFn, deps = []) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchData = useCallback(async () => {
        try {
            setLoading(true)
            const { data, error } = await queryFn()
            if (error) throw error
            setData(data)
        } catch (err) {
            console.error('Supabase query error:', err)
            setError(err)
        } finally {
            setLoading(false)
        }
    }, deps)

    useEffect(() => {
        fetchData()
    }, [fetchData])

    return { data, loading, error, refetch: fetchData }
}


// --- Products ---
export function useProducts() {
    return useSupabaseQuery(() => supabase
        .from('products')
        .select('*')
        .order('category')
        .order('name')
    )
}

// --- Orders ---
export function useOrders(customerId = null) {
    return useSupabaseQuery(() => {
        let query = supabase.from('orders').select('*, items:order_items(*)').order('created_at', { ascending: false })
        if (customerId) {
            query = query.eq('customer_id', customerId)
        }
        return query
    }, [customerId])
}

// --- Subscriptions ---
export function useSubscriptions(customerId = null) {
    return useSupabaseQuery(() => {
        let query = supabase.from('subscriptions').select('*, products(*)').order('created_at', { ascending: false })
        if (customerId) {
            query = query.eq('customer_id', customerId)
        }
        return query
    }, [customerId])
}

// --- Deliveries ---
export function useDeliveries(dateStr) {
    return useSupabaseQuery(() => {
        let query = supabase.from('deliveries').select('*, subscriptions(*, products(*)), users!deliveries_customer_id_fkey(*)').order('created_at', { ascending: false })
        if (dateStr) {
            query = query.eq('delivery_date', dateStr)
        }
        return query
    }, [dateStr])
}

// --- Users / Customers ---
export function useCustomers() {
    return useSupabaseQuery(() => supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
    )
}

// --- Mutations Helpers ---
export async function createOrder(customerId, items, totalAmount) {
    // 1. Create order
    const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert([{ customer_id: customerId, status: 'confirmed', total_amount: totalAmount, delivery_date: new Date().toISOString().split('T')[0] }])
        .select()
        .single()

    if (orderErr) throw orderErr

    // 2. Create order items
    const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price_at_time: item.price
    }))

    const { error: itemsErr } = await supabase.from('order_items').insert(orderItems)
    if (itemsErr) throw itemsErr

    return order
}

export async function createSubscription(customerId, productId, quantity, frequency = 'daily') {
    const { data, error } = await supabase
        .from('subscriptions')
        .insert([{ customer_id: customerId, product_id: productId, quantity, frequency, status: 'active' }])
        .select()
        .single()

    if (error) throw error
    return data
}

export async function upsertUser(clerkUser) {
    if (!clerkUser) return null

    const email = clerkUser.primaryEmailAddress?.emailAddress || null
    const phone = clerkUser.primaryPhoneNumber?.phoneNumber || null
    let fullName = clerkUser.fullName
    if (!fullName && clerkUser.firstName) fullName = `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim()

    const { data, error } = await supabase
        .from('users')
        .upsert({
            id: clerkUser.id,
            email,
            phone,
            full_name: fullName
        }, { onConflict: 'id' })
        .select()
        .single()

    if (error) {
        console.error('Failed to upsert user to Supabase:', error)
        return null
    }
    return data
}
