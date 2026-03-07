export function cn(...classes) {
    return classes.filter(Boolean).join(' ')
}

export function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2,
    }).format(amount)
}

export function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}

export function getTomorrow() {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
}

export function getToday() {
    return new Date().toISOString().split('T')[0]
}

export function getOrderStatusBadgeClass(status) {
    switch (status) {
        case 'delivered': return 'badge-success'
        case 'pending': return 'badge-warning'
        case 'confirmed': return 'badge-blue'
        case 'cancelled': return 'badge-danger'
        default: return 'badge-gray'
    }
}
