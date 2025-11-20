-- Create canvases table
create table if not exists public.canvases (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.canvases enable row level security;

-- Create policies
create policy "Users can view their own canvases"
  on public.canvases for select
  using (auth.uid() = user_id);

create policy "Users can insert their own canvases"
  on public.canvases for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own canvases"
  on public.canvases for update
  using (auth.uid() = user_id);

create policy "Users can delete their own canvases"
  on public.canvases for delete
  using (auth.uid() = user_id);
