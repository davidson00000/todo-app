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

-- Create milestones table
create table if not exists public.milestones (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade,
  title text not null,
  deliverables text,
  start_date date,
  due_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add milestone_id to tasks
alter table public.tasks add column if not exists milestone_id uuid references public.milestones(id) on delete set null;

-- Create task_dependencies table
create table if not exists public.task_dependencies (
  id uuid default gen_random_uuid() primary key,
  blocking_task_id uuid references public.tasks(id) on delete cascade,
  dependent_task_id uuid references public.tasks(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(blocking_task_id, dependent_task_id)
);

-- Enable RLS for task_dependencies
alter table public.task_dependencies enable row level security;

-- Create policies for task_dependencies
create policy "Users can view their own task dependencies"
  on public.task_dependencies for select
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = task_dependencies.blocking_task_id
      and tasks.user_id = auth.uid()
    )
  );

create policy "Users can insert their own task dependencies"
  on public.task_dependencies for insert
  with check (
    exists (
      select 1 from public.tasks
      where tasks.id = blocking_task_id
      and tasks.user_id = auth.uid()
    )
  );

create policy "Users can delete their own task dependencies"
  on public.task_dependencies for delete
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = blocking_task_id
      and tasks.user_id = auth.uid()
    )
  );

-- Add columns to canvases table for better structure
alter table public.canvases add column if not exists type text default 'canvas';
alter table public.canvases add column if not exists nodes jsonb default '[]'::jsonb;
alter table public.canvases add column if not exists edges jsonb default '[]'::jsonb;
alter table public.canvases add column if not exists background_config jsonb default '{"color": "#ffffff", "variant": "dots"}'::jsonb;
