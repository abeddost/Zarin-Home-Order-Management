-- STEP 2 OF 2: Run this file second in Supabase SQL Editor.
-- Drops the shared unique constraint and re-sequences all existing orders.
-- Everything runs inside one DO block so the constraint drop takes effect
-- before any UPDATE runs — no parsing ambiguity from dollar-quoted functions.

DO $$
BEGIN
  -- Drop the unique constraint on (order_month, monthly_sequence).
  -- It assumed a single shared pool per month, but now customer and showroom
  -- orders each have their own independent counters starting from 1.
  -- order_number itself (e.g. '06-01' vs 'SR-06-01') is already distinct.
  EXECUTE 'ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_order_month_monthly_sequence_key';

  -- Fix showroom orders that stored order_month = 'showroom' (literal string).
  UPDATE public.orders
  SET order_month = to_char(order_date::date, 'MM-YYYY')
  WHERE order_source = 'showroom';

  -- Re-sequence showroom orders per month with SR-MM-seq format.
  WITH ranked AS (
    SELECT
      id,
      order_month,
      ROW_NUMBER() OVER (PARTITION BY order_month ORDER BY created_at) AS new_seq
    FROM public.orders
    WHERE order_source = 'showroom'
  )
  UPDATE public.orders o
  SET
    monthly_sequence = r.new_seq,
    order_number = 'SR-' || split_part(o.order_month, '-', 1) || '-' || lpad(r.new_seq::text, 2, '0')
  FROM ranked r
  WHERE o.id = r.id;

  -- Re-sequence customer orders per month to close gaps.
  WITH ranked AS (
    SELECT
      id,
      order_month,
      ROW_NUMBER() OVER (PARTITION BY order_month ORDER BY created_at) AS new_seq
    FROM public.orders
    WHERE order_source IS NULL OR order_source != 'showroom'
  )
  UPDATE public.orders o
  SET
    monthly_sequence = r.new_seq,
    order_number = split_part(o.order_month, '-', 1) || '-' || lpad(r.new_seq::text, 2, '0')
  FROM ranked r
  WHERE o.id = r.id;

END;
$$;
