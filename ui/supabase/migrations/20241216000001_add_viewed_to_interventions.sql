-- Add viewed column to interventions table
alter table public.interventions 
add column viewed boolean default false;

-- Add index for efficient querying of unviewed interventions
create index idx_interventions_viewed on public.interventions(user_id, viewed, created_at desc);

-- Add comment for documentation
comment on column public.interventions.viewed is 'Tracks whether the user has viewed this intervention message';