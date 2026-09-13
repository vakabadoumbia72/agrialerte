-- Autorise les signalements publics tout en conservant le contrôle RLS.
alter table public.signalements enable row level security;

drop policy if exists "Public can insert signalements" on public.signalements;
create policy "Public can insert signalements"
  on public.signalements
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Public can read signalements" on public.signalements;
create policy "Public can read signalements"
  on public.signalements
  for select
  to anon, authenticated
  using (true);
