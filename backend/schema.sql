-- D1 Schema for Nandini Milk Delivery
-- Standard SQLite syntax for Cloudflare D1

DROP TABLE IF EXISTS wallet_transactions;
DROP TABLE IF EXISTS deliveries;
DROP TABLE IF EXISTS delivery_photos;
DROP TABLE IF EXISTS partial_skips;
DROP TABLE IF EXISTS delivery_sessions;
DROP TABLE IF EXISTS subscription_pauses;
DROP TABLE IF EXISTS subscription_items;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;

-- 1. Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY, 
  phone TEXT,
  email TEXT,
  full_name TEXT,
  address TEXT,
  delivery_instructions TEXT,
  google_maps_url TEXT,
  app_fee_expiry TEXT,
  wallet_balance REAL DEFAULT 0,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'delivery')),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 2. Products table
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Milk', 'Curd', 'Milk Products')),
  size_label TEXT NOT NULL,
  price REAL NOT NULL CHECK (price >= 0),
  stock_qty INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1,
  image_url TEXT,
  cutoff_morning REAL DEFAULT 15.5,
  cutoff_evening REAL DEFAULT 19.5,
  visibility TEXT DEFAULT 'both' CHECK (visibility IN ('both', 'delivery')),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 3. Orders table
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'delivered', 'cancelled')),
  total_amount REAL NOT NULL DEFAULT 0,
  delivery_date TEXT,
  delivery_slot TEXT NOT NULL DEFAULT 'morning' CHECK (delivery_slot IN ('morning', 'evening')),
  order_type TEXT DEFAULT 'delivery',
  payment_method TEXT DEFAULT 'wallet' CHECK (payment_method IN ('wallet', 'cash', 'upi')),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 4. Order Items table
CREATE TABLE order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_at_time REAL NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 5. Subscriptions table
CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  frequency TEXT NOT NULL DEFAULT 'daily',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  delivery_slot TEXT NOT NULL DEFAULT 'morning' CHECK (delivery_slot IN ('morning', 'evening')),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 6. Subscription Items table
CREATE TABLE subscription_items (
  id TEXT PRIMARY KEY,
  subscription_id TEXT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_at_time REAL NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 7. Subscription Pauses table
CREATE TABLE subscription_pauses (
  id TEXT PRIMARY KEY,
  subscription_id TEXT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  pause_date TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(subscription_id, pause_date)
);

-- 8. Partial Skips table
CREATE TABLE partial_skips (
  id TEXT PRIMARY KEY,
  skip_date TEXT NOT NULL,
  target_id TEXT NOT NULL, -- can be order_id or subscription_id
  product_id TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(skip_date, target_id, product_id)
);

-- 9. Deliveries table
CREATE TABLE deliveries (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id TEXT REFERENCES subscriptions(id) ON DELETE SET NULL,
  order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
  delivery_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'delivered',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 10. Delivery Photos table
CREATE TABLE delivery_photos (
  id TEXT PRIMARY KEY,
  delivery_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  delivery_date TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 11. Delivery Sessions table
CREATE TABLE delivery_sessions (
  id TEXT PRIMARY KEY,
  session_date TEXT NOT NULL,
  slot TEXT NOT NULL CHECK (slot IN ('morning', 'evening')),
  started_by TEXT NOT NULL,
  started_at TEXT DEFAULT CURRENT_TIMESTAMP,
  ended_at TEXT,
  active INTEGER DEFAULT 1,
  UNIQUE(session_date, slot)
);

-- 12. Wallet Transactions table
CREATE TABLE wallet_transactions (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  description TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Products
INSERT INTO products (id, name, category, size_label, price, stock_qty) VALUES
('p1', 'Nandini Toned Milk', 'Milk', '1L Packet', 40.00, 100),
('p2', 'Nandini Toned Milk', 'Milk', '500ml Packet', 21.00, 150),
('p3', 'Nandini Full Cream Milk', 'Milk', '500ml Packet', 26.00, 80),
('p4', 'Nandini Curd', 'Curd', '500g Packet', 25.00, 50),
('p5', 'Nandini Thick Curd', 'Curd', '1kg Bucket', 60.00, 30),
('p6', 'Nandini Pure Ghee', 'Milk Products', '200ml Jar', 140.00, 20),
('p7', 'Nandini Fresh Paneer', 'Milk Products', '200g Block', 105.00, 40);
