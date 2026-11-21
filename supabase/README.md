# Supabase Database Migrations & Administration Guide

## 1. Applying Migrations
Apply the migrations in numerical order using either the Supabase CLI or by copying the SQL into the Supabase Dashboard SQL Editor:

1. `supabase/migrations/0001_initial_schema.sql` (Creates all tables, foreign keys, triggers, and seed data)
2. `supabase/migrations/0002_row_level_security.sql` (Enables RLS on every table, sets security definer rules, and configures Storage buckets)

---

## 2. Setting Your First Admin Account
By security design, regular users can **never** grant themselves admin privileges. To designate your admin account:

1. Log in or sign up with your admin email via the website.
2. In the Supabase Dashboard, go to the **SQL Editor**.
3. Run the following command:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'your-email@example.com'
);
```

4. Verify that the role was set:
```sql
SELECT id, full_name, role FROM public.profiles WHERE role = 'admin';
```

---

## 3. Storage Buckets
The migration sets up two buckets under `storage.buckets`:
- **`product-images`**: Public bucket for product catalog media. Max file size: 5MB. Admin-only uploads.
- **`custom-request-refs`**: Private bucket for custom order design reference files. Max file size: 5MB. Only accessible by the owner and admins via signed URLs.
