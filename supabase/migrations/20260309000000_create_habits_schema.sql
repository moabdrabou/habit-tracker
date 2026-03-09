-- Create habits table
create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  frequency int not null default 1,
  category text not null default 'general',
  created_at timestamptz not null default now()
);

-- Create completions table
create table public.completions (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  completed_at date not null default current_date
);

-- Unique constraint: one completion per habit per day
alter table public.completions
  add constraint completions_habit_date_unique unique (habit_id, completed_at);

-- Indexes for performance
create index habits_user_id_idx on public.habits(user_id);
create index completions_user_id_idx on public.completions(user_id);
create index completions_habit_id_idx on public.completions(habit_id);
create index completions_completed_at_idx on public.completions(completed_at);

-- Enable RLS
alter table public.habits enable row level security;
alter table public.completions enable row level security;

-- RLS policies for habits
create policy "Users can view own habits"
  on public.habits for select
  using (auth.uid() = user_id);

create policy "Users can insert own habits"
  on public.habits for insert
  with check (auth.uid() = user_id);

create policy "Users can update own habits"
  on public.habits for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own habits"
  on public.habits for delete
  using (auth.uid() = user_id);

-- RLS policies for completions
create policy "Users can view own completions"
  on public.completions for select
  using (auth.uid() = user_id);

create policy "Users can insert own completions"
  on public.completions for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own completions"
  on public.completions for delete
  using (auth.uid() = user_id);
