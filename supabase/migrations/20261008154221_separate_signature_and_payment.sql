-- Signing is not payment. Existing legacy paid orders retain their status.
ALTER TABLE public.orders ADD COLUMN checkout_token uuid;

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (status IN (
  'created', 'quote_requested', 'quote_ready', 'contract_sent', 'contract_signed', 'payment_failed', 'paid',
  'contract_signed_deposit_paid', 'active', 'completed', 'cancelled', 'refunded'
));

-- Questionnaires contain customer data. Reads and updates now run on the server.
DROP POLICY IF EXISTS "anon can select own questionnaire" ON public.questionnaires;
DROP POLICY IF EXISTS "anon can update own questionnaire" ON public.questionnaires;
DROP POLICY IF EXISTS "anon can insert questionnaires" ON public.questionnaires;
-- The live policy allowed every visitor to read every order. Tokens and private
-- customer details must only be resolved by server handlers.
DROP POLICY IF EXISTS "anon can select order by id" ON public.orders;

-- Persist delivery receipts so webhook retries can finish interrupted email sends.
ALTER TABLE public.orders ADD COLUMN checkout_invite_sent_at timestamptz;
ALTER TABLE public.orders ADD COLUMN deposit_confirmation_sent_at timestamptz;
ALTER TABLE public.orders ADD COLUMN founder_kickoff_sent_at timestamptz;

-- Commercial choices are frozen on the order before the agreement is sent.
ALTER TABLE public.orders ADD COLUMN service_level text CHECK (service_level IN ('lux','deluxe'));
ALTER TABLE public.orders ADD COLUMN payment_plan text CHECK (payment_plan IN ('full','split','monthly4'));
ALTER TABLE public.orders ADD COLUMN net_amount_cents integer;
ALTER TABLE public.orders ADD COLUMN vat_amount_cents integer;
ALTER TABLE public.orders ADD COLUMN payment_schedule jsonb;
ALTER TABLE public.orders ADD COLUMN stripe_schedule_id text UNIQUE;
ALTER TABLE public.orders ADD COLUMN paid_amount_cents integer NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN quote_review_token uuid;
ALTER TABLE public.orders ADD COLUMN offer_pdf_path text;
ALTER TABLE public.orders ADD COLUMN order_request_key text UNIQUE;
ALTER TABLE public.orders ADD COLUMN contract_request_started_at timestamptz;

CREATE TABLE public.order_payments (
  provider_reference text PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id),
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX order_payments_order_id_idx ON public.order_payments(order_id);
ALTER TABLE public.order_payments ENABLE ROW LEVEL SECURITY;

-- Serialize callbacks for the same order and reject duplicate invoice events.
CREATE FUNCTION public.record_order_payment(p_order_id uuid, p_reference text, p_amount integer)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE existing_order public.orders; inserted_reference text;
BEGIN
  SELECT * INTO existing_order FROM public.orders WHERE id=p_order_id FOR UPDATE;
  IF NOT FOUND OR existing_order.status IN ('cancelled','refunded') THEN RETURN false; END IF;
  IF existing_order.checkout_token IS NOT NULL AND existing_order.contract_status <> 'signed' THEN RAISE EXCEPTION 'Agreement not signed'; END IF;
  IF p_amount <= 0 OR existing_order.paid_amount_cents+p_amount > existing_order.total_price_cents THEN
    IF EXISTS (SELECT 1 FROM public.order_payments WHERE provider_reference=p_reference AND order_id=p_order_id) THEN RETURN false; END IF;
    RAISE EXCEPTION 'Payment exceeds signed order';
  END IF;
  INSERT INTO public.order_payments(provider_reference,order_id,amount_cents) VALUES(p_reference,p_order_id,p_amount)
  ON CONFLICT DO NOTHING RETURNING provider_reference INTO inserted_reference;
  IF inserted_reference IS NULL THEN RETURN false; END IF;
  UPDATE public.orders SET paid_amount_cents=paid_amount_cents+p_amount,
    status=CASE WHEN status IN ('active','completed') THEN status ELSE 'contract_signed_deposit_paid' END
    WHERE id=p_order_id;
  RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.record_order_payment(uuid,text,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.record_order_payment(uuid,text,integer) TO service_role;

-- Private offers, accessed by the server and expiring signed download links only.
INSERT INTO storage.buckets(id,name,public) VALUES('offers','offers',false) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.orders ADD COLUMN agreement_email_sent_at timestamptz;
ALTER TABLE public.orders ADD COLUMN quote_request_email_sent_at timestamptz;

ALTER TABLE public.orders ADD COLUMN stripe_balance_session_id text UNIQUE;
ALTER TABLE public.orders ADD COLUMN balance_email_sent_at timestamptz;
ALTER TABLE public.orders ADD COLUMN offer_issued_at timestamptz;

-- No existing client files were present when this change was commissioned.
UPDATE storage.buckets SET public=false WHERE id='client-assets';
GRANT SELECT, INSERT ON public.order_payments TO service_role;

-- Close direct anonymous write paths now handled by rate-limited server routes.
DROP POLICY IF EXISTS "anon can insert waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "anon can insert site_audit_leads" ON public.site_audit_leads;
ALTER FUNCTION public.set_updated_at() SET search_path=public;
DO $$ BEGIN
  IF to_regprocedure('public.rls_auto_enable()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC,anon,authenticated;
  END IF;
END $$;
