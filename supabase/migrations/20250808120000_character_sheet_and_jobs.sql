-- Character sheet + simple jobs queue schema (1-based page_number)
create extension if not exists pgcrypto;

-- === Character sheet on stories ===
alter table if exists public.stories
  add column if not exists character_sheet jsonb not null default '{}'::jsonb;

alter table if exists public.stories
  add column if not exists character_version integer not null default 1;

-- === Page provenance ===
alter table if exists public.story_pages
  add column if not exists character_version integer;

update public.story_pages sp
set character_version = s.character_version
from public.stories s
where sp.story_id = s.id and sp.character_version is null;

-- === Jobs queue ===
create table if not exists public.story_page_jobs (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  page_number integer not null,
  payload jsonb not null default '{}'::jsonb,
  character_version integer not null,
  status text not null default 'queued' check (status in ('queued','processing','done','error')),
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (story_id, page_number)
);

create index if not exists idx_story_page_jobs_story_status
  on public.story_page_jobs (story_id, status, page_number);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_story_page_jobs_updated on public.story_page_jobs;
create trigger trg_story_page_jobs_updated
before update on public.story_page_jobs
for each row execute function public.set_updated_at();

-- Keep it simple (service role functions handle access)
alter table if exists public.story_page_jobs disable row level security;

-- === Atomic claim/finish RPCs ===
create or replace function public.claim_next_story_page_job(p_story_id uuid)
returns public.story_page_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job public.story_page_jobs;
begin
  select * into v_job
    from public.story_page_jobs
   where story_id = p_story_id
     and status = 'queued'
   order by page_number
   for update skip locked
   limit 1;

  if v_job.id is null then
    return null;
  end if;

  update public.story_page_jobs
     set status = 'processing'
   where id = v_job.id
   returning * into v_job;

  return v_job;
end;
$$;

create or replace function public.finish_story_page_job(p_job_id uuid, p_success boolean, p_error text default null)
returns public.story_page_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job public.story_page_jobs;
begin
  if p_success then
    update public.story_page_jobs
       set status = 'done', last_error = null
     where id = p_job_id
     returning * into v_job;
  else
    update public.story_page_jobs
       set status = 'error',
           attempts = attempts + 1,
           last_error = p_error
     where id = p_job_id
     returning * into v_job;
  end if;

  return v_job;
end;
$$;

