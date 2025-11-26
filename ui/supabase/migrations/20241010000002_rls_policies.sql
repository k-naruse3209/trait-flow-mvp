-- Enable Row Level Security on all tables
alter table public.users enable row level security;
alter table public.baseline_traits enable row level security;
alter table public.checkins enable row level security;
alter table public.interventions enable row level security;

-- Users table policies
create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.users
  for insert with check (auth.uid() = id);

-- Baseline traits table policies
create policy "Users can view own baseline traits" on public.baseline_traits
  for select using (auth.uid() = user_id);

create policy "Users can insert own baseline traits" on public.baseline_traits
  for insert with check (auth.uid() = user_id);

create policy "Users can update own baseline traits" on public.baseline_traits
  for update using (auth.uid() = user_id);

-- Checkins table policies
create policy "Users can view own checkins" on public.checkins
  for select using (auth.uid() = user_id);

create policy "Users can insert own checkins" on public.checkins
  for insert with check (auth.uid() = user_id);

create policy "Users can update own checkins" on public.checkins
  for update using (auth.uid() = user_id);

-- Interventions table policies
create policy "Users can view own interventions" on public.interventions
  for select using (auth.uid() = user_id);

create policy "Users can insert own interventions" on public.interventions
  for insert with check (auth.uid() = user_id);

create policy "Users can update own interventions" on public.interventions
  for update using (auth.uid() = user_id);