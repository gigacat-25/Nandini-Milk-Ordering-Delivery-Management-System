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
        let query = supabase.from('orders').select('*, items:order_items(*, products(*))').order('created_at', { ascending: false })
        if (customerId) {
            query = query.eq('customer_id', customerId)
        }
        return query
    }, [customerId])
}

export function useOrdersByDate(dateStr) {
    return useSupabaseQuery(() => {
        let query = supabase.from('orders').select('*, items:order_items(*, products(*)), users!orders_customer_id_fkey(*)').order('created_at', { ascending: false })
        if (dateStr) {
            query = query.eq('delivery_date', dateStr).neq('status', 'cancelled')
        }
        return query
    }, [dateStr])
}

// --- Subscriptions ---
export function useSubscriptions(customerId = null) {
    return useSupabaseQuery(() => {
        let query = supabase.from('subscriptions').select('*, items:subscription_items(*, products(*))').order('created_at', { ascending: false })
        if (customerId) {
            query = query.eq('customer_id', customerId)
        }
        return query
    }, [customerId])
}

// --- Deliveries ---
export function useDeliveries(dateStr) {
    return useSupabaseQuery(() => {
        let query = supabase.from('deliveries').select('*, subscriptions(*, items:subscription_items(*, products(*))), users!deliveries_customer_id_fkey(*)').order('created_at', { ascending: false })
        if (dateStr) {
            query = query.eq('delivery_date', dateStr)
        }
        return query
    }, [dateStr])
}

// --- Subscription Pauses ---
export function useSubscriptionPauses(dateStr) {
    return useSupabaseQuery(() => {
        let query = supabase.from('subscription_pauses').select('*')
        if (dateStr) query = query.eq('pause_date', dateStr)
        return query
    }, [dateStr])
}

// --- Partial Delivery Skips ---
export function usePartialSkips(dateStr) {
    return useSupabaseQuery(() => {
        let query = supabase.from('partial_skips').select('*')
        if (dateStr) query = query.eq('skip_date', dateStr)
        return query
    }, [dateStr])
}

export function usePartialSkipsForTargets(targetIds) {
    // We sort the IDs directly inside a useMemo string representation or assume stable ordering
    const idString = (targetIds || []).join(',')
    return useSupabaseQuery(() => {
        let query = supabase.from('partial_skips').select('*')
        if (targetIds && targetIds.length > 0) {
            query = query.in('target_id', targetIds)
        } else {
            query = query.eq('id', '00000000-0000-0000-0000-000000000000') // fetch none
        }
        return query
    }, [idString])
}

export async function skipDeliveryItem(dateStr, target_id, product_id) {
    const { error } = await supabase
        .from('partial_skips')
        .insert([{ skip_date: dateStr, target_id, product_id }])
    if (error) throw error
    return true
}

export async function unskipDeliveryItem(dateStr, target_id, product_id) {
    const { error } = await supabase
        .from('partial_skips')
        .delete()
        .match({ skip_date: dateStr, target_id, product_id })
    if (error) throw error
    return true
}

export async function updateOrderStatus(orderId, status) {
    const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
    if (error) throw error
    return true
}

// --- Users / Customers ---
export function useCustomers() {
    return useSupabaseQuery(() => supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
    )
}

export function useUserProfile(userId) {
    return useSupabaseQuery(() => {
        let query = supabase.from('users').select('*')
        if (userId) query = query.eq('id', userId).single()
        return query
    }, [userId])
}

// --- Wallet ---
export function useWalletTransactions(customerId) {
    return useSupabaseQuery(() => {
        let query = supabase.from('wallet_transactions').select('*').order('created_at', { ascending: false })
        if (customerId) query = query.eq('customer_id', customerId)
        return query
    }, [customerId])
}

// --- Mutations Helpers ---
export async function createOrder(customerId, items, totalAmount, deliverySlot = 'morning', deliveryDate) {
    // 1. Create order
    const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert([{
            customer_id: customerId,
            status: 'confirmed',
            total_amount: totalAmount,
            delivery_date: deliveryDate || new Date().toISOString().split('T')[0],
            delivery_slot: deliverySlot
        }])
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

export async function createSubscription(customerId, items, deliverySlot = 'morning', frequency = 'daily') {
    const { data: subscription, error: subErr } = await supabase
        .from('subscriptions')
        .insert([{
            customer_id: customerId,
            frequency,
            status: 'active',
            delivery_slot: deliverySlot
        }])
        .select()
        .single()

    if (subErr) throw subErr

    const subscriptionItems = items.map(item => ({
        subscription_id: subscription.id,
        product_id: item.id,
        quantity: item.quantity,
        price_at_time: item.price
    }))

    const { error: itemsErr } = await supabase.from('subscription_items').insert(subscriptionItems)
    if (itemsErr) throw itemsErr

    return subscription
}

export async function pauseSubscriptionDate(subscriptionId, dateStr) {
    const { error } = await supabase
        .from('subscription_pauses')
        .insert([{ subscription_id: subscriptionId, pause_date: dateStr }])

    if (error) throw error
    return true
}

export async function markOrderDelivered(orderId) {
    const { error } = await supabase
        .from('orders')
        .update({ status: 'delivered' })
        .eq('id', orderId)

    if (error) throw error
    return true
}

export async function markSubscriptionDelivered(customerId, subscriptionId, dateStr, amount) {
    // 1. Get current wallet balance
    const { data: user, error: userErr } = await supabase
        .from('users')
        .select('wallet_balance')
        .eq('id', customerId)
        .single()
    if (userErr) throw userErr

    if (amount > 0 && (Number(user.wallet_balance) || 0) < amount) {
        throw new Error('Insufficient wallet balance')
    }

    // 2. Deduct from wallet if there is an amount
    if (amount > 0) {
        const newBalance = (Number(user.wallet_balance) || 0) - Number(amount)
        const { error: updateErr } = await supabase
            .from('users')
            .update({ wallet_balance: newBalance })
            .eq('id', customerId)
        if (updateErr) throw updateErr

        const { error: txnErr } = await supabase
            .from('wallet_transactions')
            .insert([{
                customer_id: customerId,
                amount: -Number(amount),
                description: `Subscription delivery for ${dateStr}`
            }])
        if (txnErr) throw txnErr
    }

    // 3. Record delivery
    const { error } = await supabase
        .from('deliveries')
        .insert([{
            customer_id: customerId,
            subscription_id: subscriptionId,
            delivery_date: dateStr,
            status: 'delivered'
        }])

    if (error) throw error
    return true
}

export async function unmarkOrderDelivered(orderId) {
    const { error } = await supabase
        .from('orders')
        .update({ status: 'confirmed' })
        .eq('id', orderId)

    if (error) throw error
    return true
}

// --- Delivery Photos ---
export async function uploadDeliveryPhoto(file, deliveryType, targetId, dateStr) {
    const ext = (file.name || 'photo.jpg').split('.').pop() || 'jpg'
    const path = `${dateStr}/${deliveryType}/${targetId}.${ext}`
    const { error: uploadErr } = await supabase.storage
        .from('delivery-photos')
        .upload(path, file, { upsert: true, contentType: file.type })
    if (uploadErr) throw uploadErr

    const { data: { publicUrl } } = supabase.storage
        .from('delivery-photos')
        .getPublicUrl(path)

    const { error: dbErr } = await supabase
        .from('delivery_photos')
        .insert([{ delivery_type: deliveryType, target_id: targetId, delivery_date: dateStr, photo_url: publicUrl }])
    if (dbErr) throw dbErr

    return publicUrl
}

export function useDeliveryPhotos(dateStr) {
    return useSupabaseQuery(() => {
        let query = supabase.from('delivery_photos').select('*')
        if (dateStr) query = query.eq('delivery_date', dateStr)
        return query
    }, [dateStr])
}

export async function unmarkSubscriptionDelivered(customerId, subscriptionId, dateStr, amount) {
    // 1. Delete the delivery record
    const { error: delErr } = await supabase
        .from('deliveries')
        .delete()
        .eq('subscription_id', subscriptionId)
        .eq('delivery_date', dateStr)

    if (delErr) throw delErr

    // 2. Refund wallet if there was a charge
    if (amount > 0) {
        const { data: user, error: userErr } = await supabase
            .from('users')
            .select('wallet_balance')
            .eq('id', customerId)
            .single()
        if (userErr) throw userErr

        const newBalance = (Number(user.wallet_balance) || 0) + Number(amount)
        const { error: updateErr } = await supabase
            .from('users')
            .update({ wallet_balance: newBalance })
            .eq('id', customerId)
        if (updateErr) throw updateErr

        const { error: txnErr } = await supabase
            .from('wallet_transactions')
            .insert([{
                customer_id: customerId,
                amount: Number(amount),
                description: `Refund: Delivery reverted for ${dateStr} (Admin)`
            }])
        if (txnErr) throw txnErr
    }

    return true
}

export async function addWalletFunds(customerId, amount, description = 'Funds Added via App') {
    // 1. Get current balance
    const { data: user, error: userErr } = await supabase
        .from('users')
        .select('wallet_balance')
        .eq('id', customerId)
        .single()
    if (userErr) throw userErr

    const newBalance = (Number(user.wallet_balance) || 0) + Number(amount)
    const { error: updateErr } = await supabase
        .from('users')
        .update({ wallet_balance: newBalance })
        .eq('id', customerId)
    if (updateErr) throw updateErr

    const { error: txnErr } = await supabase
        .from('wallet_transactions')
        .insert([{
            customer_id: customerId,
            amount: Number(amount),
            description: description
        }])
    if (txnErr) throw txnErr
    return true
}

export async function deleteCustomerAccount(customerId) {
    // 1. Delete user from supabase (cascade handles cleanup of linked data)
    const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', customerId)

    if (error) throw error
    return true
}

export async function upsertUser(clerkUser) {
    if (!clerkUser) return null

    const email = clerkUser.primaryEmailAddress?.emailAddress || null
    const phone = clerkUser.primaryPhoneNumber?.phoneNumber || null
    let fullName = clerkUser.fullName
    if (!fullName && clerkUser.firstName) fullName = `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim()

    // True upsert — if a row with this Clerk ID already exists, do nothing (don't overwrite profile data)
    const { data, error } = await supabase
        .from('users')
        .upsert(
            { id: clerkUser.id, email, phone, full_name: fullName },
            { onConflict: 'id', ignoreDuplicates: true }
        )
        .select()
        .single()

    if (error && error.code !== 'PGRST116') {
        // PGRST116 = "no rows returned" which happens when ignoreDuplicates skips the insert — that's fine
        console.error('Failed to upsert user in Supabase:', error)
    }
    return data || null
}

export async function renewAppAccess(userId) {
    const nextExpiry = new Date()
    nextExpiry.setDate(nextExpiry.getDate() + 30)

    const { data, error } = await supabase
        .from('users')
        .update({ app_fee_expiry: nextExpiry.toISOString() })
        .eq('id', userId)
        .select()
        .single()

    if (error) throw error
    return data
}

// --- Delivery Sessions ---
// Hook: fetch the active session for a given date + slot
export function useDeliverySession(dateStr, slot) {
    return useSupabaseQuery(() =>
        supabase
            .from('delivery_sessions')
            .select('*')
            .eq('session_date', dateStr)
            .eq('slot', slot)
            .eq('active', true)
            .maybeSingle()
        , [dateStr, slot])
}

// Mutation: Admin starts a delivery run
export async function startDeliverySession(dateStr, slot, adminId) {
    // If a session already exists for this date+slot, just reactivate it
    const { data: existing } = await supabase
        .from('delivery_sessions')
        .select('id')
        .eq('session_date', dateStr)
        .eq('slot', slot)
        .maybeSingle()

    if (existing) {
        const { data, error } = await supabase
            .from('delivery_sessions')
            .update({ active: true, ended_at: null, started_at: new Date().toISOString() })
            .eq('id', existing.id)
            .select()
            .single()
        if (error) throw error
        return data
    }

    const { data, error } = await supabase
        .from('delivery_sessions')
        .insert({ session_date: dateStr, slot, started_by: adminId, active: true })
        .select()
        .single()
    if (error) throw error
    return data
}

// Mutation: Admin ends a delivery run
export async function endDeliverySession(dateStr, slot) {
    const { data, error } = await supabase
        .from('delivery_sessions')
        .update({ active: false, ended_at: new Date().toISOString() })
        .eq('session_date', dateStr)
        .eq('slot', slot)
        .select()
        .single()
    if (error) throw error
    return data
}
