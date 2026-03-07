-- Nandini Milk Ordering & Delivery Management System
-- Supabase PostgreSQL Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES (extends Supabase Auth)
-- ============================================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Milk', 'Curd', 'Ghee', 'Other')),
  size_label TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'packet',
  stock_qty INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'delivered', 'cancelled')),
  total_amount DECIMAL(10,2) NOT NULL,
  delivery_address TEXT,
  delivery_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
CREATE TABLE subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  frequency TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'alternate', 'weekly')),
  start_date DATE NOT NULL,
  end_date DATE,
  active BOOLEAN DEFAULT TRUE,
  delivery_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SUBSCRIPTION PAUSES (skip days)
-- ============================================================
CREATE TABLE subscription_pauses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE NOT NULL,
  pause_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DELIVERIES
-- ============================================================
CREATE TABLE deliveries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  delivery_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed', 'skipped')),
  delivered_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE TABLE payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  method TEXT DEFAULT 'upi' CHECK (method IN ('upi', 'cash', 'card', 'netbanking')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'delivery')),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_pauses ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Products: anyone can read, only admin can write
CREATE POLICY "products_read_all" ON products FOR SELECT USING (true);
CREATE POLICY "products_admin_write" ON products FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Profiles: users can see own, admin can see all
CREATE POLICY "profiles_own" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "profiles_admin" ON profiles FOR SELECT USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Orders: customers see own, admin sees all
CREATE POLICY "orders_customer" ON orders FOR ALL USING (customer_id = auth.uid());
CREATE POLICY "orders_admin" ON orders FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Subscriptions: customers see own, admin sees all
CREATE POLICY "subs_customer" ON subscriptions FOR ALL USING (customer_id = auth.uid());
CREATE POLICY "subs_admin" ON subscriptions FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Deliveries: customers see own, admin sees all
CREATE POLICY "del_customer" ON deliveries FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "del_admin" ON deliveries FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Payments: customers see own, admin sees all
CREATE POLICY "pay_customer" ON payments FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "pay_admin" ON payments FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Notifications: users see own only
CREATE POLICY "notif_own" ON notifications FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- SAMPLE DATA
-- ============================================================
INSERT INTO products (name, category, size_label, price, unit, stock_qty, description) VALUES
  ('Nandini Toned Milk', 'Milk', '500ml Packet', 24.00, 'packet', 200, 'Fresh toned milk 3.5% fat.'),
  ('Nandini Toned Milk', 'Milk', '1L Packet', 46.00, 'packet', 150, 'Fresh toned milk 1 litre pack.'),
  ('Nandini Full Cream Milk', 'Milk', '500ml Packet', 28.00, 'packet', 100, 'Rich full cream milk 6% fat.'),
  ('Nandini Curd', 'Curd', '500g Cup', 36.00, 'cup', 80, 'Thick creamy Nandini curd.'),
  ('Nandini Curd', 'Curd', '1kg Cup', 68.00, 'cup', 60, 'Family size Nandini curd.'),
  ('Nandini Ghee', 'Ghee', '200ml Jar', 120.00, 'jar', 40, 'Pure cow ghee.'),
  ('Nandini Ghee', 'Ghee', '500ml Jar', 295.00, 'jar', 30, 'Premium Nandini cow ghee 500ml.');
