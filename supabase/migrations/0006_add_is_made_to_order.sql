-- Migration 0006: Add is_made_to_order flag to products table
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_made_to_order BOOLEAN NOT NULL DEFAULT false;
