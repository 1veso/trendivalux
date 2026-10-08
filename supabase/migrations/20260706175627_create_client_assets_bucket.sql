-- Recovered from the already-applied remote migration history.
insert into storage.buckets (id, name, public)
values ('client-assets', 'client-assets', true)
on conflict (id) do nothing;
