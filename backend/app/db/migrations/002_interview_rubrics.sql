create table if not exists public.interview_rubrics (
  id uuid primary key default gen_random_uuid(),
  position_id uuid not null references public.positions(id) on delete cascade,
  groups jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint interview_rubrics_position_unique unique (position_id)
);

create index if not exists interview_rubrics_position_id_idx on public.interview_rubrics(position_id);

drop trigger if exists interview_rubrics_set_updated_at on public.interview_rubrics;
create trigger interview_rubrics_set_updated_at
before update on public.interview_rubrics
for each row execute function public.set_updated_at();
