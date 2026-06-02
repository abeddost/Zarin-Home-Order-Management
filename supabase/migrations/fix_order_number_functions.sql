-- STEP 1 OF 2: Run this file first in Supabase SQL Editor.
-- Fixes the two order-number generator functions.
-- No data changes — safe to run at any time.

-- Fix generate_order_number: exclude showroom orders from the monthly counter.
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

-- Fix generate_showroom_order_number: month-aware, SR-MM-seq format,
-- advisory lock, no ambiguous column reference.
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
