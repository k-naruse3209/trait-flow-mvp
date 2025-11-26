-- Create users table
create table public.users (
  id uuid primary key default auth.uid(),
  email text,
  created_at timestamptz default now()
);

-- Create baseline_traits table
create table public.baseline_traits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  traits_p01 jsonb not null, -- Big Five scores 0-1 scale
  traits_T jsonb not null,   -- Big Five T-scores 0-100 scale
  instrument text not null default 'tipi_v1',
  administered_at timestamptz not null,
  created_at timestamptz default now()
);

-- Create checkins table
create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  mood_score int not null check (mood_score between 1 and 5),
  energy_level text not null check (energy_level in ('low','mid','high')),
  free_text text check (char_length(coalesce(free_text, '')) <= 280),
  created_at timestamptz default now()
);

-- Create interventions table
create table public.interventions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  checkin_id uuid references public.checkins(id) on delete cascade,
  template_type text not null check (template_type in ('reflection','action','compassion')),
  message_payload jsonb not null,
  fallback boolean default false,
  feedback_score int check (feedback_score between 1 and 5),
  created_at timestamptz default now(),
  feedback_at timestamptz
);

-- Create indexes for better performance
create index idx_baseline_traits_user_id on public.baseline_traits(user_id);
create index idx_baseline_traits_administered_at on public.baseline_traits(administered_at desc);
create index idx_checkins_user_id on public.checkins(user_id);
create index idx_checkins_created_at on public.checkins(created_at desc);
create index idx_interventions_user_id on public.interventions(user_id);
create index idx_interventions_checkin_id on public.interventions(checkin_id);
create index idx_interventions_created_at on public.interventions(created_at desc);