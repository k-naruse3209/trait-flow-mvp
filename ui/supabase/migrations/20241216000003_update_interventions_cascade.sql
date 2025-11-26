-- Update foreign key constraint for interventions.checkin_id
-- Change from CASCADE to SET NULL to preserve interventions when checkins are deleted

-- First, drop the existing foreign key constraint
alter table public.interventions 
drop constraint interventions_checkin_id_fkey;

-- Add the new foreign key constraint with SET NULL
alter table public.interventions 
add constraint interventions_checkin_id_fkey 
foreign key (checkin_id) references public.checkins(id) on delete set null;

-- Make checkin_id nullable since it can now be set to null
alter table public.interventions 
alter column checkin_id drop not null;

-- Add comment explaining the behavior
comment on column public.interventions.checkin_id is 'References the checkin that triggered this intervention. Can be null if the original checkin was deleted.';