-- Add composite index for mood analytics queries
-- This helps with queries that need to analyze mood patterns over time
create index idx_checkins_user_mood_date on public.checkins(user_id, created_at desc, mood_score);

-- Add composite index for energy analytics queries
-- This helps with queries that analyze energy patterns
create index idx_checkins_user_energy_date on public.checkins(user_id, created_at desc, energy_level);

-- Add updated_at column for tracking modifications (if needed in future)
alter table public.checkins 
add column updated_at timestamptz default now();

-- Create trigger to automatically update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger update_checkins_updated_at
    before update on public.checkins
    for each row
    execute function update_updated_at_column();

-- Note: Daily uniqueness constraint will be handled at application level
-- to avoid function-based index issues in PostgreSQL

-- Add comments for documentation
comment on column public.checkins.updated_at is 'Timestamp when the record was last updated';
comment on index idx_checkins_user_mood_date is 'Optimizes mood analytics queries';
comment on index idx_checkins_user_energy_date is 'Optimizes energy analytics queries';