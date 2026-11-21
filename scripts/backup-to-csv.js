/**
 * Manual Database Backup Script for Loop & Love E-Commerce
 * Exports all Orders, Customers (Profiles), and Products from Supabase to CSV format.
 *
 * Usage:
 *   npm run backup
 *   OR
 *   node scripts/backup-to-csv.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Load environment variables from .env.local
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        if (!process.env[key]) {
          process.env[key] = value.trim();
        }
      }
    }
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Error: Supabase credentials not found in .env.local');
  console.error('Ensure NEXT_PUBLIC_SUPABASE_URL is configured.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// CSV string escaping helper
function escapeCsv(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

function writeCsvFile(filePath, headers, rows) {
  const content = [
    headers.map(escapeCsv).join(','),
    ...rows.map((row) => row.map(escapeCsv).join(',')),
  ].join('\n');
  fs.writeFileSync(filePath, content, 'utf8');
}

async function runBackup() {
  console.log('====================================================');
  console.log('🔄 Loop & Love — Supabase CSV Data Backup Utility');
  console.log('====================================================');
  console.log(`📡 Connecting to Supabase: ${supabaseUrl}`);

  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  // 1. EXPORT ORDERS
  console.log('\n📦 Exporting orders and order items...');
  const { data: orders, error: ordersErr } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false });

  if (ordersErr) {
    console.error('❌ Failed to fetch orders:', ordersErr.message);
    if (ordersErr.message.includes('permission denied')) {
      console.warn('⚠️  Tip: To read all protected orders, provide SUPABASE_SERVICE_ROLE_KEY in .env.local.');
    }
  } else {
    const orderHeaders = [
      'Order ID',
      'Order Number',
      'Created At',
      'User ID',
      'Customer Name',
      'Customer Phone',
      'Customer Email',
      'Address Line 1',
      'Address Line 2',
      'City',
      'State',
      'Pincode',
      'Subtotal',
      'Delivery Fee',
      'Total Amount',
      'Payment Status',
      'Order Status',
      'Delivery Method',
      'Courier Partner',
      'Tracking Number',
      'Customer Note',
      'Cancel Reason',
      'Cancelled At',
      'Purchased Items',
    ];

    const orderRows = (orders || []).map((o) => {
      const itemsList = (o.order_items || [])
        .map((i) => `${i.quantity}x ${i.product_name} (@₹${i.unit_price})`)
        .join('; ');

      return [
        o.id,
        o.order_number,
        o.created_at,
        o.user_id || '',
        o.shipping_full_name || '',
        o.shipping_phone || '',
        o.customer_email || '',
        o.shipping_line1 || o.shipping_street_address || '',
        o.shipping_line2 || o.shipping_apartment || '',
        o.shipping_city || '',
        o.shipping_state || '',
        o.shipping_pincode || '',
        o.subtotal || 0,
        o.delivery_fee || 0,
        o.total || 0,
        o.payment_status || '',
        o.status || '',
        o.delivery_method || 'local_own',
        o.courier_name || '',
        o.tracking_number || '',
        o.customer_note || '',
        o.cancel_reason || '',
        o.cancelled_at || '',
        itemsList,
      ];
    });

    const ordersPath = path.join(backupDir, `orders_backup_${timestamp}.csv`);
    writeCsvFile(ordersPath, orderHeaders, orderRows);
    console.log(`✅ Saved ${orderRows.length} orders -> ${ordersPath}`);
  }

  // 2. EXPORT CUSTOMERS (PROFILES)
  console.log('\n👥 Exporting customer profiles...');
  const { data: profiles, error: profilesErr } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (profilesErr) {
    console.error('❌ Failed to fetch profiles:', profilesErr.message);
  } else {
    // Build order counts and spend
    const orderCountMap = {};
    const totalSpendMap = {};
    const lastOrderDateMap = {};

    if (orders && Array.isArray(orders)) {
      for (const ord of orders) {
        if (ord.user_id) {
          orderCountMap[ord.user_id] = (orderCountMap[ord.user_id] || 0) + 1;
          if (ord.payment_status === 'paid' || ord.status !== 'cancelled') {
            totalSpendMap[ord.user_id] = (totalSpendMap[ord.user_id] || 0) + (Number(ord.total) || 0);
          }
          if (
            !lastOrderDateMap[ord.user_id] ||
            new Date(ord.created_at) > new Date(lastOrderDateMap[ord.user_id])
          ) {
            lastOrderDateMap[ord.user_id] = ord.created_at;
          }
        }
      }
    }

    const customerHeaders = [
      'Customer ID',
      'Full Name',
      'Phone',
      'Role',
      'Registered At',
      'Updated At',
      'Total Orders Placed',
      'Total Lifetime Spend (INR)',
      'Last Order Date',
    ];

    const customerRows = (profiles || []).map((p) => [
      p.id,
      p.full_name || 'Customer',
      p.phone || '',
      p.role || 'customer',
      p.created_at,
      p.updated_at,
      orderCountMap[p.id] || 0,
      totalSpendMap[p.id] || 0,
      lastOrderDateMap[p.id] || 'None',
    ]);

    const customersPath = path.join(backupDir, `customers_backup_${timestamp}.csv`);
    writeCsvFile(customersPath, customerHeaders, customerRows);
    console.log(`✅ Saved ${customerRows.length} customer profiles -> ${customersPath}`);
  }

  // 3. EXPORT PRODUCTS & CATEGORIES
  console.log('\n🧶 Exporting products catalog...');
  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select('*, categories(name)')
    .order('created_at', { ascending: false });

  if (prodErr) {
    console.error('❌ Failed to fetch products:', prodErr.message);
  } else {
    const productHeaders = [
      'Product ID',
      'Name',
      'Slug',
      'Category',
      'Price',
      'Discount Price',
      'Stock',
      'Is Active',
      'Is Featured',
      'Created At',
      'Updated At',
      'Deleted At',
    ];

    const productRows = (products || []).map((p) => [
      p.id,
      p.name,
      p.slug,
      p.categories?.name || 'Uncategorized',
      p.price,
      p.discount_price || '',
      p.stock,
      p.is_active,
      p.is_featured,
      p.created_at,
      p.updated_at,
      p.deleted_at || '',
    ]);

    const productsPath = path.join(backupDir, `products_backup_${timestamp}.csv`);
    writeCsvFile(productsPath, productHeaders, productRows);
    console.log(`✅ Saved ${productRows.length} products -> ${productsPath}`);
  }

  console.log('\n====================================================');
  console.log('🎉 Manual CSV Backup Completed Successfully!');
  console.log(`📂 Destination: ${backupDir}`);
  console.log('====================================================\n');
}

runBackup().catch((e) => {
  console.error('Backup exception:', e);
  process.exit(1);
});
