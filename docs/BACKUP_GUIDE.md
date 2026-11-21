# Database Backup Guide: Orders & Customers CSV Export

This document explains how to perform manual or automated backups of your Supabase database records (orders, customer profiles, and product catalog) into standardized CSV files.

---

## 1. Quick Manual Backup Command

Run the following command from the project root directory:

```bash
npm run backup
```

Or execute directly with Node:

```bash
node scripts/backup-to-csv.js
```

---

## 2. Backup Output & Destination

The script creates timestamped CSV files in the `./backups/` directory:

| Exported File Pattern | Contents & Schema |
| :--- | :--- |
| `backups/orders_backup_<timestamp>.csv` | Complete order records, snapshots of delivery addresses, item quantities, total amount, payment status, milestone status, courier, tracking numbers, and customer notes. |
| `backups/customers_backup_<timestamp>.csv` | Registered customer profiles from `public.profiles`, contact info, role, total order count, lifetime spend (INR), and last order timestamp. |
| `backups/products_backup_<timestamp>.csv` | Full product catalog, category links, pricing, inventory stock, active/soft-deleted status. |

---

## 3. Security & Environment Configuration

The backup script securely reads database credentials from `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
- `SUPABASE_SERVICE_ROLE_KEY`: Service role secret key (never exposed to client browsers).
  *If the service role key is not defined, it safely falls back to the configured publishable key.*

---

## 4. In-App Direct CSV Downloads

Admins can also download live filtered CSV reports directly from the web browser:
1. **Orders CSV**: Go to **Admin Console** -> **Orders** -> Click **"Export Filtered CSV"**.
2. **Customers CSV**: Go to **Admin Console** -> **Customers** -> Click **"Export Customers CSV"**.

---

## 5. Automated Recurring Backups (Optional Cron)

To run daily automated backups at midnight on your server or CI, add the following cron entry:

```bash
0 0 * * * cd /path/to/loop && npm run backup >> /path/to/loop/backups/backup.log 2>&1
```
