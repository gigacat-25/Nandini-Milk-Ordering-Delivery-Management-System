// Mock data for development (replace with real Supabase calls)

export const PRODUCTS = [
    {
        id: 'prod-1',
        name: 'Nandini Toned Milk',
        category: 'Milk',
        size_label: '500ml Packet',
        price: 24,
        unit: 'packet',
        stock_qty: 200,
        active: true,
        image: '🥛',
        description: 'Fresh toned milk, 3.5% fat. Delivered daily from Karnataka Co-operative.',
    },
    {
        id: 'prod-2',
        name: 'Nandini Toned Milk',
        category: 'Milk',
        size_label: '1L Packet',
        price: 46,
        unit: 'packet',
        stock_qty: 150,
        active: true,
        image: '🥛',
        description: 'Fresh toned milk 1 litre pack. Best value for families.',
    },
    {
        id: 'prod-3',
        name: 'Nandini Full Cream Milk',
        category: 'Milk',
        size_label: '500ml Packet',
        price: 28,
        unit: 'packet',
        stock_qty: 100,
        active: true,
        image: '🥛',
        description: 'Rich full cream milk with 6% fat. Great for children and tea.',
    },
    {
        id: 'prod-4',
        name: 'Nandini Curd',
        category: 'Curd',
        size_label: '500g Cup',
        price: 36,
        unit: 'cup',
        stock_qty: 80,
        active: true,
        image: '🫙',
        description: 'Thick, creamy Nandini curd with live cultures. No preservatives.',
    },
    {
        id: 'prod-5',
        name: 'Nandini Curd',
        category: 'Curd',
        size_label: '1kg Cup',
        price: 68,
        unit: 'cup',
        stock_qty: 60,
        active: true,
        image: '🫙',
        description: 'Family size Nandini curd. Pro-biotic, farm fresh.',
    },
    {
        id: 'prod-6',
        name: 'Nandini Ghee',
        category: 'Ghee',
        size_label: '200ml Jar',
        price: 120,
        unit: 'jar',
        stock_qty: 40,
        active: true,
        image: '🧈',
        description: 'Pure cow ghee, prepared by traditional creamery method.',
    },
    {
        id: 'prod-7',
        name: 'Nandini Ghee',
        category: 'Ghee',
        size_label: '500ml Jar',
        price: 295,
        unit: 'jar',
        stock_qty: 30,
        active: true,
        image: '🧈',
        description: 'Premium Nandini cow ghee 500ml. Rich aroma, pure taste.',
    },
]

export const MOCK_ORDERS = [
    { id: 'ORD-001', customer_name: 'Priya Sharma', products: 'Toned Milk 1L × 2', total_amount: 92, status: 'delivered', delivery_date: '2026-03-06', created_at: '2026-03-05' },
    { id: 'ORD-002', customer_name: 'Ravi Kumar', products: 'Full Cream 500ml × 1, Curd 500g × 1', total_amount: 64, status: 'confirmed', delivery_date: '2026-03-08', created_at: '2026-03-07' },
    { id: 'ORD-003', customer_name: 'Meena Nair', products: 'Ghee 200ml × 1', total_amount: 120, status: 'pending', delivery_date: '2026-03-08', created_at: '2026-03-07' },
    { id: 'ORD-004', customer_name: 'Suresh Babu', products: 'Toned Milk 500ml × 4', total_amount: 96, status: 'delivered', delivery_date: '2026-03-07', created_at: '2026-03-06' },
    { id: 'ORD-005', customer_name: 'Kavitha Reddy', products: 'Curd 1kg × 1, Toned Milk 1L × 1', total_amount: 114, status: 'pending', delivery_date: '2026-03-08', created_at: '2026-03-07' },
    { id: 'ORD-006', customer_name: 'Anand Murthy', products: 'Ghee 500ml × 1', total_amount: 295, status: 'confirmed', delivery_date: '2026-03-09', created_at: '2026-03-07' },
]

export const MOCK_SUBSCRIPTIONS = [
    { id: 'SUB-001', product_name: 'Nandini Toned Milk', size: '1L Packet', quantity: 2, price_per_unit: 46, frequency: 'Daily', start_date: '2026-02-01', status: 'active', next_delivery: '2026-03-08' },
    { id: 'SUB-002', product_name: 'Nandini Curd', size: '500g Cup', quantity: 1, price_per_unit: 36, frequency: 'Daily', start_date: '2026-02-15', status: 'paused', next_delivery: 'Paused' },
]

export const MOCK_CUSTOMERS = [
    { id: 'C001', name: 'Priya Sharma', phone: '9876543210', email: 'priya@gmail.com', address: 'B-12, Vaderhalli Main Road', subscriptions: 2, total_orders: 48, total_spent: 4320, joined: '2026-01-15' },
    { id: 'C002', name: 'Ravi Kumar', phone: '9845012345', email: 'ravi@gmail.com', address: '3rd Cross, Vaderhalli', subscriptions: 1, total_orders: 32, total_spent: 2980, joined: '2026-01-22' },
    { id: 'C003', name: 'Meena Nair', phone: '9901234567', email: 'meena@gmail.com', address: 'Flat 4A, Sunrise Apts', subscriptions: 0, total_orders: 12, total_spent: 1200, joined: '2026-02-10' },
    { id: 'C004', name: 'Suresh Babu', phone: '9988776655', email: 'suresh@gmail.com', address: '7, Nehru Street, Vaderhalli', subscriptions: 3, total_orders: 60, total_spent: 5680, joined: '2025-12-20' },
    { id: 'C005', name: 'Kavitha Reddy', phone: '9123456789', email: 'kavitha@gmail.com', address: 'No.14, 2nd Block, Vaderhalli', subscriptions: 1, total_orders: 24, total_spent: 2100, joined: '2026-02-01' },
]

export const MOCK_DELIVERY_LIST = [
    { id: 1, customer: 'Priya Sharma', address: 'B-12, Vaderhalli Main Road', phone: '9876543210', items: 'Toned Milk 1L × 2', amount: 92, status: 'pending' },
    { id: 2, customer: 'Suresh Babu', address: '7, Nehru Street, Vaderhalli', phone: '9988776655', items: 'Toned Milk 500ml × 4, Curd 500g × 1', amount: 132, status: 'pending' },
    { id: 3, customer: 'Kavitha Reddy', address: 'No.14, 2nd Block, Vaderhalli', phone: '9123456789', items: 'Toned Milk 1L × 1, Curd 1kg × 1', amount: 114, status: 'delivered' },
    { id: 4, customer: 'Ravi Kumar', address: '3rd Cross, Vaderhalli', phone: '9845012345', items: 'Full Cream Milk 500ml × 2', amount: 56, status: 'pending' },
    { id: 5, customer: 'Anand Murthy', address: '5/A, 4th Cross', phone: '9345678901', items: 'Toned Milk 1L × 1, Ghee 200ml × 1', amount: 166, status: 'pending' },
]

export const SALES_DATA = [
    { month: 'Oct', revenue: 18400, orders: 312 },
    { month: 'Nov', revenue: 21200, orders: 368 },
    { month: 'Dec', revenue: 24800, orders: 421 },
    { month: 'Jan', revenue: 26500, orders: 458 },
    { month: 'Feb', revenue: 28900, orders: 492 },
    { month: 'Mar', revenue: 31200, orders: 520 },
]

export const PRODUCT_SALES = [
    { name: 'Toned Milk 1L', value: 42 },
    { name: 'Toned Milk 500ml', value: 28 },
    { name: 'Full Cream 500ml', value: 14 },
    { name: 'Curd 500g', value: 10 },
    { name: 'Ghee', value: 6 },
]

export const MOCK_BILLING = [
    { month: 'March 2026', deliveries: 7, amount: 644, status: 'pending', due_date: '2026-04-05' },
    { month: 'February 2026', deliveries: 28, amount: 2576, status: 'paid', due_date: '2026-03-05' },
    { month: 'January 2026', deliveries: 31, amount: 2852, status: 'paid', due_date: '2026-02-05' },
]
