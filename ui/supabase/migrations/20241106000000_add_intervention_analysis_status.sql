-- Add analysis status columns to interventions for two-stage delivery
alter table public.interventions
  add column if not exists analysis_status text not null default 'pending' check (analysis_status in ('pending','ready')),
  add column if not exists analysis_ready_at timestamptz;
