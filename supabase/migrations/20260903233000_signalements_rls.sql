-- Autorise les signalements publics tout en conservant le contrôle RLS.
alter table public.signalisations enable row level security;

drop policy if exists "Public can insert signalements" on public.signalisations;
create policy "Public can insert signalements"
  on public.signalisations
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Public can read signalements" on public.signalisations;
create policy "Public can read signalements"
  on public.signalisations
  for select
  to anon, authenticated
  using (true);
