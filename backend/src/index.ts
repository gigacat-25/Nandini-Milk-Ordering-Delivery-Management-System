import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  DB: D1Database
  ASSETS: R2Bucket
  GMAIL_CLIENT_ID: string
  GMAIL_CLIENT_SECRET: string
  GMAIL_REFRESH_TOKEN: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', cors())

/**
 * --- PRODUCTS ---
 */
app.get('/products', async (c) => {
  try {
    let query = "SELECT * FROM products ORDER BY category, name";
    const { results } = await c.env.DB.prepare(query).all();
    return c.json(results);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
})

app.post('/products', async (c) => {
  const body = await c.req.json();
  const id = crypto.randomUUID();
  try {
    await c.env.DB.prepare(`
      INSERT INTO products (id, name, category, size_label, price, stock_qty, active, image_url, cutoff_morning, cutoff_evening, visibility)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, body.name, body.category, body.size_label, body.price, 
      body.stock_qty, body.active ? 1 : 0, body.image_url, 
      body.cutoff_morning, body.cutoff_evening, body.visibility || 'both'
    ).run();
    return c.json({ id });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
})

app.put('/products/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  try {
    await c.env.DB.prepare(`
      UPDATE products SET 
        name = ?, category = ?, size_label = ?, price = ?, 
        stock_qty = ?, active = ?, image_url = ?, 
        cutoff_morning = ?, cutoff_evening = ?, visibility = ?
      WHERE id = ?
    `).bind(
      body.name, body.category, body.size_label, body.price, 
      body.stock_qty, body.active ? 1 : 0, body.image_url, 
      body.cutoff_morning, body.cutoff_evening, body.visibility || 'both', id
    ).run();
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
})

app.delete('/products/:id', async (c) => {
  const id = c.req.param('id');
  try {
    await c.env.DB.prepare("DELETE FROM products WHERE id = ?").bind(id).run();
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
})

app.put('/products/global/cutoffs', async (c) => {
  const { categories, cutoff_morning, cutoff_evening } = await c.req.json();
  try {
    const placeholders = categories.map(() => '?').join(',');
    await c.env.DB.prepare(`
      UPDATE products SET cutoff_morning = ?, cutoff_evening = ?
      WHERE category IN (${placeholders})
    `).bind(cutoff_morning, cutoff_evening, ...categories).run();
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
})

/**
 * --- USERS / PROFILE ---
 */
app.post('/users/upsert', async (c) => {
  const body = await c.req.json();
  const { id, email, phone, full_name } = body;
  console.log(`Upserting user: ${id} (${full_name})`);
  
  try {
    // SQLite Upsert syntax
    await c.env.DB.prepare(`
      INSERT INTO users (id, email, phone, full_name, role)
      VALUES (?, ?, ?, ?, 'customer')
      ON CONFLICT(id) DO UPDATE SET
        email = excluded.email,
        phone = excluded.phone,
        full_name = excluded.full_name
    `).bind(id, email, phone, full_name).run();

    const user = await c.env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(id).first();
    return c.json(user);
  } catch (e: any) {
    console.error(`Upsert failed for ${id}:`, e.message);
    return c.json({ error: e.message }, 500);
  }
})

app.get('/users/:id', async (c) => {
  const id = c.req.param('id');
  const user = await c.env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(id).first();
  if (!user) return c.json({ error: 'User not found' }, 404);
  return c.json(user);
})

/**
 * --- SUBSCRIPTIONS ---
 */
app.get('/subscriptions', async (c) => {
  const customerId = c.req.query('customerId');
  try {
    let query = `
      SELECT s.*, 
      (SELECT json_group_array(json_object('id', si.id, 'product_id', si.product_id, 'quantity', si.quantity, 'price_at_time', si.price_at_time, 'products', json_object('name', p.name, 'size_label', p.size_label, 'price', p.price)))
       FROM subscription_items si 
       JOIN products p ON si.product_id = p.id 
       WHERE si.subscription_id = s.id) as items
      FROM subscriptions s
    `;
    
    let results;
    if (customerId) {
      results = await c.env.DB.prepare(query + " WHERE s.customer_id = ? ORDER BY s.created_at DESC").bind(customerId).all();
    } else {
      results = await c.env.DB.prepare(query + " ORDER BY s.created_at DESC").all();
    }
    
    // Parse the JSON string items back into objects
    const formatted = results.results.map((r: any) => ({
      ...r,
      items: JSON.parse(r.items)
    }));
    
    return c.json(formatted);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
})

/**
 * --- DELIVERIES ---
 */
app.get('/deliveries/summary/:userId', async (c) => {
  const userId = c.req.param('userId');
  const date = c.req.query('date') || new Date().toISOString().split('T')[0];
  const slot = c.req.query('slot') || 'morning';

  try {
    // 1. Get User Details
    const user = await c.env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first();
    if (!user) return c.json({ error: 'User not found' }, 404);

    // 2. Get Subscriptions for this user
    const subQuery = `
      SELECT s.*, 
      (SELECT json_group_array(json_object('id', si.id, 'product_id', si.product_id, 'quantity', si.quantity, 'price_at_time', si.price_at_time, 'products', json_object('name', p.name, 'size_label', p.size_label, 'price', p.price)))
       FROM subscription_items si 
       JOIN products p ON si.product_id = p.id 
       WHERE si.subscription_id = s.id) as items
      FROM subscriptions s
      WHERE s.customer_id = ? AND s.status = 'active' AND s.delivery_slot = ?
    `;
    const { results: subs } = await c.env.DB.prepare(subQuery).bind(userId, slot).all();

    // 3. Get One-time Orders for this user
    const orderQuery = `
      SELECT o.*,
      (SELECT json_group_array(json_object('id', oi.id, 'product_id', oi.product_id, 'quantity', oi.quantity, 'price_at_time', oi.price_at_time, 'products', json_object('name', p.name, 'size_label', p.size_label)))
       FROM order_items oi 
       JOIN products p ON oi.product_id = p.id 
       WHERE oi.order_id = o.id) as items
      FROM orders o
      WHERE o.customer_id = ? AND o.delivery_date = ? AND o.delivery_slot = ? AND o.status != 'cancelled'
    `;
    const { results: orders } = await c.env.DB.prepare(orderQuery).bind(userId, date, slot).all();

    // 4. Get Pauses and Skips
    const { results: pauses } = await c.env.DB.prepare("SELECT * FROM subscription_pauses WHERE pause_date = ?").bind(date).all();
    const { results: skips } = await c.env.DB.prepare("SELECT * FROM partial_skips WHERE skip_date = ?").bind(date).all();
    const { results: completed } = await c.env.DB.prepare("SELECT * FROM deliveries WHERE customer_id = ? AND delivery_date = ?").bind(userId, date).all();

    return c.json({
      user,
      subscriptions: subs.map((s: any) => ({ ...s, items: JSON.parse(s.items) })),
      orders: orders.map((o: any) => ({ ...o, items: JSON.parse(o.items) })),
      pauses,
      skips,
      completed,
      date,
      slot
    });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
})

app.get('/deliveries', async (c) => {
  const date = c.req.query('date');
  if (!date) return c.json([]);
  try {
    const { results } = await c.env.DB.prepare("SELECT * FROM deliveries WHERE delivery_date = ?").bind(date).all();
    return c.json(results);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
})

/**
 * --- ORDERS ---
 */
app.get('/orders', async (c) => {
  const customerId = c.req.query('customerId');
  const date = c.req.query('date');
  try {
    let query = `
      SELECT o.*, u.full_name as customer_name, u.phone as customer_phone, u.address as customer_address, u.google_maps_url, u.delivery_instructions,
      (SELECT json_group_array(json_object('id', oi.id, 'product_id', oi.product_id, 'quantity', oi.quantity, 'price_at_time', oi.price_at_time, 'products', json_object('name', p.name, 'size_label', p.size_label)))
       FROM order_items oi 
       JOIN products p ON oi.product_id = p.id 
       WHERE oi.order_id = o.id) as items
      FROM orders o
      LEFT JOIN users u ON o.customer_id = u.id
    `;
    
    let whereClauses = [];
    let params: any[] = [];
    
    if (customerId) {
        whereClauses.push("o.customer_id = ?");
        params.push(customerId);
    }
    if (date) {
        whereClauses.push("o.delivery_date = ?");
        params.push(date);
    }
    
    if (whereClauses.length > 0) {
        query += " WHERE " + whereClauses.join(" AND ");
    }
    
    query += " ORDER BY o.created_at DESC";
    
    const { results } = await c.env.DB.prepare(query).bind(...params).all();
    
    const formatted = (results || []).map((r: any) => ({
      ...r,
      items: JSON.parse(r.items)
    }));
    
    return c.json(formatted);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
})

/**
 * --- EMAIL SERVICE (GMAIL API) ---
 */
async function getGmailAccessToken(env: Bindings) {
  const params = new URLSearchParams();
  params.append('client_id', env.GMAIL_CLIENT_ID);
  params.append('client_secret', env.GMAIL_CLIENT_SECRET);
  params.append('refresh_token', env.GMAIL_REFRESH_TOKEN);
  params.append('grant_type', 'refresh_token');

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  const data: any = await res.json();
  if (!res.ok) throw new Error(data.error_description || 'Failed to get access token');
  return data.access_token;
}

app.post('/deliveries/email-qr', async (c) => {
  const { userId, email, name, origin: frontendOrigin } = await c.req.json();
  
  if (!userId) return c.json({ error: 'User ID is required' }, 400);

  // Fallback to request origin if frontendOrigin is not provided
  const origin = frontendOrigin || new URL(c.req.url).origin;
  const qrData = `${origin}/delivery/scan/${userId}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;

  try {
    const accessToken = await getGmailAccessToken(c.env);
    
    const subject = 'Your Digital Doorstep QR Code - Nandini Milk';
    const body = `
      <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px;">
        <h2 style="color: #0f172a; margin-top: 0;">Hello ${name},</h2>
        <p style="color: #64748b; line-height: 1.6;">Here is your unique <strong>Digital Doorstep QR Code</strong> for Nandini Milk delivery.</p>
        
        <div style="text-align: center; margin: 30px 0; background: #f8fafc; padding: 20px; border-radius: 12px;">
          <img src="${qrImageUrl}" alt="Your QR Code" style="border: 4px solid white; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
          <p style="margin-top: 10px; font-weight: bold; color: #2563eb;">Customer ID: ${userId.slice(-8).toUpperCase()}</p>
        </div>

        <p style="color: #64748b; font-size: 14px;"><strong>Instructions:</strong></p>
        <ol style="color: #64748b; font-size: 14px; padding-left: 20px;">
          <li>Print this QR code or display it on your door.</li>
          <li>Our delivery partner will scan it every morning.</li>
          <li>They will see exactly what to deliver based on your subscription.</li>
        </ol>

        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 25px 0;">
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">Nandini Milk Delivery Management System</p>
      </div>
    `;

    // Construct MIME message
    const message = [
      'Content-Type: text/html; charset="UTF-8"\r\n',
      'MIME-Version: 1.0\r\n',
      `To: ${email}\r\n`,
      `Subject: ${subject}\r\n\r\n`,
      body
    ].join('');

    const encodedMessage = btoa(unescape(encodeURIComponent(message)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw: encodedMessage })
    });

    if (!gmailRes.ok) {
      const err = await gmailRes.json();
      throw new Error(JSON.stringify(err));
    }

    return c.json({ success: true });
  } catch (e: any) {
    console.error('Email failed:', e.message);
    return c.json({ error: e.message }, 500);
  }
})

/**
 * --- WALLET ---
 */
app.get('/wallet/transactions', async (c) => {
  const customerId = c.req.query('customerId');
  if (!customerId) return c.json({ error: 'Missing customerId' }, 400);
  
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM wallet_transactions WHERE customer_id = ? ORDER BY created_at DESC"
  ).bind(customerId).all();
  
  return c.json(results);
})

/**
 * --- MUTATIONS ---
 */

app.post('/orders', async (c) => {
  const { customerId, items, totalAmount, deliverySlot, deliveryDate } = await c.req.json();
  const orderId = crypto.randomUUID();
  
  try {
    await c.env.DB.batch([
      c.env.DB.prepare(`
        INSERT INTO orders (id, customer_id, status, total_amount, delivery_date, delivery_slot, order_type, payment_method)
        VALUES (?, ?, 'confirmed', ?, ?, ?, 'delivery', 'wallet')
      `).bind(orderId, customerId, totalAmount, deliveryDate, deliverySlot),
      ...items.map((item: any) => 
        c.env.DB.prepare(`
          INSERT INTO order_items (id, order_id, product_id, quantity, price_at_time)
          VALUES (?, ?, ?, ?, ?)
        `).bind(crypto.randomUUID(), orderId, item.id, item.quantity, item.price)
      )
    ]);
    return c.json({ id: orderId });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
})


app.post('/subscriptions', async (c) => {
  const { customerId, items, deliverySlot, frequency } = await c.req.json();
  const subId = crypto.randomUUID();
  
  try {
    await c.env.DB.batch([
      c.env.DB.prepare(`
        INSERT INTO subscriptions (id, customer_id, frequency, status, delivery_slot)
        VALUES (?, ?, ?, 'active', ?)
      `).bind(subId, customerId, frequency, deliverySlot),
      ...items.map((item: any) => 
        c.env.DB.prepare(`
          INSERT INTO subscription_items (id, subscription_id, product_id, quantity, price_at_time)
          VALUES (?, ?, ?, ?, ?)
        `).bind(crypto.randomUUID(), subId, item.id, item.quantity, item.price)
      )
    ]);
    return c.json({ id: subId });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
})

app.post('/wallet/add', async (c) => {
  const { customerId, amount, description } = await c.req.json();
  try {
    await c.env.DB.batch([
      c.env.DB.prepare("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?").bind(amount, customerId),
      c.env.DB.prepare("INSERT INTO wallet_transactions (id, customer_id, amount, description) VALUES (?, ?, ?, ?)").bind(crypto.randomUUID(), customerId, amount, description)
    ]);
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
})

app.post('/deliveries/mark', async (c) => {
    const { customerId, subscriptionId, orderId, dateStr, amount } = await c.req.json();
    try {
        const batch = [];
        // 1. Logic for wallet deduction if amount > 0
        if (amount > 0) {
            batch.push(c.env.DB.prepare("UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?").bind(amount, customerId));
            batch.push(c.env.DB.prepare("INSERT INTO wallet_transactions (id, customer_id, amount, description) VALUES (?, ?, ?, ?)").bind(crypto.randomUUID(), customerId, -amount, `Delivery for ${dateStr}`));
        }
        
        // 2. Insert delivery record
        batch.push(c.env.DB.prepare("INSERT INTO deliveries (id, customer_id, subscription_id, order_id, delivery_date, status) VALUES (?, ?, ?, ?, ?, 'delivered')").bind(crypto.randomUUID(), customerId, subscriptionId || null, orderId || null, dateStr));
        
        // 3. If it's a one-time order, mark order as delivered
        if (orderId) {
            batch.push(c.env.DB.prepare("UPDATE orders SET status = 'delivered' WHERE id = ?").bind(orderId));
        }

        await c.env.DB.batch(batch);
        return c.json({ success: true });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
})

app.post('/pauses', async (c) => {
    const { subscriptionId, dateStr } = await c.req.json();
    try {
        await c.env.DB.prepare("INSERT INTO subscription_pauses (id, subscription_id, pause_date) VALUES (?, ?, ?)").bind(crypto.randomUUID(), subscriptionId, dateStr).run();
        return c.json({ success: true });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
})

app.get('/pauses', async (c) => {
    const date = c.req.query('date');
    const { results } = await c.env.DB.prepare("SELECT * FROM subscription_pauses WHERE pause_date = ?").bind(date).all();
    return c.json(results);
})

app.post('/skips', async (c) => {
    const { dateStr, targetId, productId } = await c.req.json();
    try {
        await c.env.DB.prepare("INSERT INTO partial_skips (id, skip_date, target_id, product_id) VALUES (?, ?, ?, ?)").bind(crypto.randomUUID(), dateStr, targetId, productId).run();
        return c.json({ success: true });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
})

app.delete('/skips', async (c) => {
    try {
        const { dateStr, targetId, productId } = await c.req.json();
        await c.env.DB.prepare("DELETE FROM partial_skips WHERE skip_date = ? AND target_id = ? AND product_id = ?").bind(dateStr, targetId, productId).run();
        return c.json({ success: true });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
})

app.get('/skips', async (c) => {
    const date = c.req.query('date');
    const targetIds = c.req.query('targetIds');
    let results;
    if (date) {
        results = await c.env.DB.prepare("SELECT * FROM partial_skips WHERE skip_date = ?").bind(date).all();
    } else if (targetIds) {
        const ids = targetIds.split(',');
        const placeholders = ids.map(() => '?').join(',');
        results = await c.env.DB.prepare(`SELECT * FROM partial_skips WHERE target_id IN (${placeholders})`).bind(...ids).all();
    } else {
        results = { results: [] };
    }
    return c.json(results.results);
})

/**
 * --- SESSIONS ---
 */
app.get('/sessions', async (c) => {
    try {
        const date = c.req.query('date');
        const slot = c.req.query('slot');
        const session = await c.env.DB.prepare("SELECT * FROM delivery_sessions WHERE session_date = ? AND slot = ? AND active = 1").bind(date, slot).first();
        return c.json(session);
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
})

app.post('/sessions/start', async (c) => {
    try {
        const { dateStr, slot, adminId } = await c.req.json();
        const id = crypto.randomUUID();
        await c.env.DB.prepare(`
            INSERT INTO delivery_sessions (id, session_date, slot, started_by, active)
            VALUES (?, ?, ?, ?, 1)
            ON CONFLICT(session_date, slot) DO UPDATE SET active = 1, ended_at = NULL, started_at = CURRENT_TIMESTAMP
        `).bind(id, dateStr, slot, adminId).run();
        const session = await c.env.DB.prepare("SELECT * FROM delivery_sessions WHERE session_date = ? AND slot = ?").bind(dateStr, slot).first();
        return c.json(session);
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
})

app.post('/sessions/end', async (c) => {
    try {
        const { dateStr, slot } = await c.req.json();
        await c.env.DB.prepare("UPDATE delivery_sessions SET active = 0, ended_at = CURRENT_TIMESTAMP WHERE session_date = ? AND slot = ?").bind(dateStr, slot).run();
        return c.json({ success: true });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
})

/**
 * --- MISC ---
 */
app.put('/orders/:id/status', async (c) => {
    try {
        const id = c.req.param('id');
        const { status } = await c.req.json();
        await c.env.DB.prepare("UPDATE orders SET status = ? WHERE id = ?").bind(status, id).run();
        return c.json({ success: true });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
})

app.put('/subscriptions/:id/status', async (c) => {
    try {
        const id = c.req.param('id');
        const { status } = await c.req.json();
        await c.env.DB.prepare("UPDATE subscriptions SET status = ? WHERE id = ?").bind(status, id).run();
        return c.json({ success: true });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
})

app.delete('/users/:id', async (c) => {
    try {
        const id = c.req.param('id');
        await c.env.DB.prepare("DELETE FROM users WHERE id = ?").bind(id).run();
        return c.json({ success: true });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
})

app.delete('/subscriptions/:id', async (c) => {
    const id = c.req.param('id');
    try {
        await c.env.DB.prepare("DELETE FROM subscriptions WHERE id = ?").bind(id).run();
        return c.json({ success: true });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
})

app.put('/users/:id/role', async (c) => {
    try {
        const id = c.req.param('id');
        const { role } = await c.req.json();
        await c.env.DB.prepare("UPDATE users SET role = ? WHERE id = ?").bind(role, id).run();
        return c.json({ success: true });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
})

app.put('/users/:id', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();
    try {
        await c.env.DB.prepare(`
            UPDATE users SET 
                address = ?, 
                delivery_instructions = ?, 
                google_maps_url = ?, 
                phone = ?
            WHERE id = ?
        `).bind(
            body.address, 
            body.delivery_instructions, 
            body.google_maps_url, 
            body.phone, 
            id
        ).run();
        return c.json({ success: true });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
})

app.get('/users', async (c) => {
    try {
        const { results } = await c.env.DB.prepare("SELECT * FROM users ORDER BY created_at DESC").all();
        return c.json(results);
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
})

app.post('/users/:id/renew', async (c) => {
    try {
        const id = c.req.param('id');
        const nextExpiry = new Date();
        nextExpiry.setDate(nextExpiry.getDate() + 30);
        const expiryStr = nextExpiry.toISOString();
        
        await c.env.DB.prepare("UPDATE users SET app_fee_expiry = ? WHERE id = ?").bind(expiryStr, id).run();
        const user = await c.env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(id).first();
        return c.json(user);
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
})

app.post('/deliveries/unmark', async (c) => {
    const { customerId, subscriptionId, orderId, dateStr, amount } = await c.req.json();
    try {
        const batch = [];
        
        if (orderId) {
            // 1. Delete delivery record for order
            batch.push(c.env.DB.prepare("DELETE FROM deliveries WHERE customer_id = ? AND order_id = ? AND delivery_date = ?").bind(customerId, orderId, dateStr));
            // 2. Delete photo record
            batch.push(c.env.DB.prepare("DELETE FROM delivery_photos WHERE target_id = ? AND delivery_date = ?").bind(orderId, dateStr));
            // 3. Reset order status to confirmed
            batch.push(c.env.DB.prepare("UPDATE orders SET status = 'confirmed' WHERE id = ?").bind(orderId));
        } else {
            // 1. Delete delivery record for subscription
            batch.push(c.env.DB.prepare("DELETE FROM deliveries WHERE customer_id = ? AND subscription_id = ? AND delivery_date = ?").bind(customerId, subscriptionId, dateStr));
            // 2. Delete photo record
            batch.push(c.env.DB.prepare("DELETE FROM delivery_photos WHERE target_id = ? AND delivery_date = ?").bind(subscriptionId, dateStr));
        }
        
        // 2. Refund if amount > 0
        if (amount > 0) {
            batch.push(c.env.DB.prepare("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?").bind(amount, customerId));
            batch.push(c.env.DB.prepare("INSERT INTO wallet_transactions (id, customer_id, amount, description) VALUES (?, ?, ?, ?)").bind(crypto.randomUUID(), customerId, amount, `Refund: Delivery reverted for ${dateStr}`));
        }

        await c.env.DB.batch(batch);
        return c.json({ success: true });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
})

app.get('/photos', async (c) => {
    try {
        const date = c.req.query('date');
        let query = "SELECT * FROM delivery_photos";
        let params: any[] = [];
        if (date) {
            query += " WHERE delivery_date = ?";
            params.push(date);
        }
        const { results } = await c.env.DB.prepare(query).bind(...params).all();
        return c.json(results);
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
})

app.get('/assets/*', async (c) => {
  const key = c.req.path.replace('/assets/', '');
  const object = await c.env.ASSETS.get(key);
  
  if (!object) return c.notFound();
  
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  
  return new Response(object.body, { headers });
})

app.post('/upload', async (c) => {
  const body = await c.req.parseBody();
  const file = body.file as File;
  const folder = body.folder || 'misc';
  const deliveryType = body.deliveryType as string;
  const targetId = body.targetId as string;
  const dateStr = body.dateStr as string;
  
  if (!file) return c.json({ error: 'No file uploaded' }, 400);

  const key = `${folder}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
  await c.env.ASSETS.put(key, file.stream(), {
    httpMetadata: { contentType: file.type }
  });

  const origin = new URL(c.req.url).origin;
  const url = `${origin}/assets/${key}`;

  // If it's a delivery photo, save to DB
  if (folder === 'deliveries') {
    await c.env.DB.prepare(`
        INSERT INTO delivery_photos (id, delivery_type, target_id, delivery_date, photo_url)
        VALUES (?, ?, ?, ?, ?)
    `).bind(crypto.randomUUID(), deliveryType, targetId, dateStr, url).run();
  }

  return c.json({ key, url });
})

export default app
