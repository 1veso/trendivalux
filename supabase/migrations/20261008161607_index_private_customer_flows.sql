-- Scoping resolves the questionnaire through this order reference.
CREATE INDEX IF NOT EXISTS questionnaires_order_id_idx ON public.questionnaires(converted_to_order_id);
-- Retain the existing private queue policy; restrict its role explicitly.
ALTER POLICY "Service role full access" ON public.data_rights_requests TO service_role USING(true) WITH CHECK(true);
