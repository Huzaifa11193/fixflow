create table if not exists public.error_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  input text not null,
  framework text,
  analysis jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.error_analyses enable row level security;

create policy "Users can read their own analyses"
  on public.error_analyses
  for select
  using (auth.uid() = user_id);

create policy "Users can create their own analyses"
  on public.error_analyses
  for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own analyses"
  on public.error_analyses
  for delete
  using (auth.uid() = user_id);
