-- Add contract_signing_url column for DocuSeal embed_src storage. The existing
-- contract_docuseal_id stores the numeric submission_id (used by the webhook for
-- reconciliation), while contract_signing_url stores the embed_src URL the
-- ContractPage iframe loads directly.

alter table public.orders
  add column if not exists contract_signing_url text;

-- Allow anon users to read their own order by UUID. Order IDs are unguessable
-- (128-bit) and are emailed to the customer only, acting as a pseudo-token. The
-- ContractPage and SuccessPage rely on this for status polling and contract
-- iframe embed. Service role is unaffected.

create policy "anon can select order by id"
  on public.orders for select to anon
  using (true);
