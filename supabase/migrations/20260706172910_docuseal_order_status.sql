-- Extend orders.status to include contract_signed_deposit_paid.
--
-- The check constraint was created inline in migration 20260427000001 without
-- an explicit name; PostgreSQL auto-names it <table>_<column>_check.
-- We drop it and recreate with the new value added.

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'created',
    'paid',
    'contract_sent',
    'contract_signed_deposit_paid',
    'active',
    'completed',
    'cancelled',
    'refunded'
  ));
