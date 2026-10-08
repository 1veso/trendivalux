-- Scoping resolves the questionnaire through this order reference.
CREATE INDEX IF NOT EXISTS questionnaires_order_id_idx ON public.questionnaires(converted_to_order_id);
-- Data-rights requests are served only through the privileged backend.
DROP POLICY IF EXISTS "Service role full access" ON public.data_rights_requests;
CREATE POLICY "Service role full access" ON public.data_rights_requests FOR ALL TO service_role USING(true) WITH CHECK(true);
