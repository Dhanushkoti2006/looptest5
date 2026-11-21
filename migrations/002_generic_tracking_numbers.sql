-- ====================================================================
-- LOOP & LOVE CROCHET - MIGRATION: 002_GENERIC_TRACKING_NUMBERS
-- Ensures generic tracking_number & courier_partner columns exist on orders table
-- Safely migrates any legacy shiprocket_order_id, shiprocket_shipment_id, awb, or awb_code columns
-- ====================================================================

DO $$
BEGIN
    -- 1. Ensure tracking_number column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'tracking_number'
    ) THEN
        ALTER TABLE orders ADD COLUMN tracking_number VARCHAR(100);
    END IF;

    -- 2. Ensure courier_partner column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'courier_partner'
    ) THEN
        ALTER TABLE orders ADD COLUMN courier_partner VARCHAR(100);
    END IF;

    -- 3. Safely copy data from legacy shiprocket_order_id if present
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'shiprocket_order_id'
    ) THEN
        EXECUTE 'UPDATE orders SET tracking_number = COALESCE(tracking_number, shiprocket_order_id::text) WHERE tracking_number IS NULL AND shiprocket_order_id IS NOT NULL';
        ALTER TABLE orders DROP COLUMN shiprocket_order_id;
    END IF;

    -- 4. Safely copy data from legacy shiprocket_shipment_id if present
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'shiprocket_shipment_id'
    ) THEN
        EXECUTE 'UPDATE orders SET tracking_number = COALESCE(tracking_number, shiprocket_shipment_id::text) WHERE tracking_number IS NULL AND shiprocket_shipment_id IS NOT NULL';
        ALTER TABLE orders DROP COLUMN shiprocket_shipment_id;
    END IF;

    -- 5. Safely copy data from legacy awb_code if present
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'awb_code'
    ) THEN
        EXECUTE 'UPDATE orders SET tracking_number = COALESCE(tracking_number, awb_code::text) WHERE tracking_number IS NULL AND awb_code IS NOT NULL';
        ALTER TABLE orders DROP COLUMN awb_code;
    END IF;

    -- 6. Safely copy data from legacy awb if present
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'awb'
    ) THEN
        EXECUTE 'UPDATE orders SET tracking_number = COALESCE(tracking_number, awb::text) WHERE tracking_number IS NULL AND awb IS NOT NULL';
        ALTER TABLE orders DROP COLUMN awb;
    END IF;
END $$;
