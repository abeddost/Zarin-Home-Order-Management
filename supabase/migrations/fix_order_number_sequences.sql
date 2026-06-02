-- Fix 1: generate_order_number — exclude showroom orders from the monthly counter
-- Previously counted ALL orders in a month, so showroom orders would inflate the customer sequence.
CREATE OR REPLACE FUNCTION public.generate_order_number(p_order_date date)
RETURNS TABLE(order_number text, order_month text, monthly_sequence integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_month        text;
  v_sequence     integer;
  v_order_number text;
  v_lock_key     bigint;
begin
  v_month    := to_char(p_order_date, 'MM-YYYY');
  v_lock_key := ('x' || substr(md5(v_month), 1, 16))::bit(64)::bigint;
  perform pg_advisory_xact_lock(v_lock_key);

  select coalesce(max(t.monthly_sequence), 0) + 1
  into v_sequence
  from public.orders t
  where t.order_month = v_month
    and (t.order_source is null or t.order_source != 'showroom');

  v_order_number := to_char(p_order_date, 'MM') || '-' || lpad(v_sequence::text, 2, '0');
  return query select v_order_number, v_month, v_sequence;
end;
$function$;

-- Fix 2: generate_showroom_order_number — full rewrite
-- Old function bugs:
--   (a) "column reference is ambiguous": output param named monthly_sequence shadowed orders.monthly_sequence
--   (b) Not month-aware: counted showroom orders across all time (no monthly reset)
--   (c) Stored order_month = 'showroom' (literal) instead of real month
--   (d) No advisory lock (race condition risk)
-- New function: month-aware, SR-MM-seq format, proper lock, no column shadowing.
CREATE OR REPLACE FUNCTION public.generate_showroom_order_number()
RETURNS TABLE(order_number text, order_month text, monthly_sequence integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_month        text;
  v_sequence     integer;
  v_order_number text;
  v_lock_key     bigint;
begin
  v_month    := to_char(current_date, 'MM-YYYY');
  v_lock_key := ('x' || substr(md5('sr-' || v_month), 1, 16))::bit(64)::bigint;
  perform pg_advisory_xact_lock(v_lock_key);

  select coalesce(max(t.monthly_sequence), 0) + 1
  into v_sequence
  from public.orders t
  where t.order_month = v_month
    and t.order_source = 'showroom';

  v_order_number := 'SR-' || to_char(current_date, 'MM') || '-' || lpad(v_sequence::text, 2, '0');
  return query select v_order_number, v_month, v_sequence;
end;
$function$;

-- Fix 3: Backfill existing data

-- Step 3a: Drop the unique constraint on (order_month, monthly_sequence).
-- That constraint assumed a single sequence pool per month, but now customer
-- and showroom orders each have their own independent counters starting from 1.
-- The order_number column (e.g. '06-01' vs 'SR-06-01') is already distinct.
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_order_month_monthly_sequence_key;

-- Step 3b: Fix showroom orders that have order_month = 'showroom' (literal string).
--          Set the real month from their order_date.
UPDATE public.orders
SET order_month = to_char(order_date::date, 'MM-YYYY')
WHERE order_source = 'showroom';

-- Step 3c: Re-sequence showroom orders per month with SR-MM-seq format.
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

-- Step 3d: Re-sequence customer orders per month to close any gaps caused by
--          showroom orders that previously shared the same counter.
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
