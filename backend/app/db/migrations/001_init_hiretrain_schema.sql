create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  role text not null check (role in ('ADMIN', 'HR_MANAGER')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at before update on public.users for each row execute function public.set_updated_at();

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  jd_text text,
  status text not null default 'DRAFT' check (status in ('DRAFT', 'ACTIVE', 'CLOSED')),
  public_token text unique,
  created_by uuid references public.users(id) on delete set null,
  deadline_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists campaigns_status_idx on public.campaigns(status);
create index if not exists campaigns_created_by_idx on public.campaigns(created_by);
create index if not exists campaigns_public_token_idx on public.campaigns(public_token);
drop trigger if exists campaigns_set_updated_at on public.campaigns;
create trigger campaigns_set_updated_at before update on public.campaigns for each row execute function public.set_updated_at();

create table if not exists public.rubric_criteria (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  category text not null check (category in ('hard_skill', 'soft_skill', 'experience', 'certification')),
  name text not null,
  weight integer not null check (weight >= 0 and weight <= 100),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rubric_criteria_campaign_id_idx on public.rubric_criteria(campaign_id);
drop trigger if exists rubric_criteria_set_updated_at on public.rubric_criteria;
create trigger rubric_criteria_set_updated_at before update on public.rubric_criteria for each row execute function public.set_updated_at();

create table if not exists public.test_questions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  question_text text not null,
  question_type text not null default 'multiple_choice',
  difficulty text,
  skill_tag text,
  options jsonb not null default '[]'::jsonb,
  correct_option_id text,
  explanation text,
  status text not null default 'DRAFT' check (status in ('DRAFT', 'APPROVED', 'PUBLISHED')),
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists test_questions_campaign_id_idx on public.test_questions(campaign_id);
create index if not exists test_questions_status_idx on public.test_questions(status);
drop trigger if exists test_questions_set_updated_at on public.test_questions;
create trigger test_questions_set_updated_at before update on public.test_questions for each row execute function public.set_updated_at();

create table if not exists public.candidates (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  cv_text text,
  cv_file_name text,
  status text not null default 'APPLIED' check (status in ('APPLIED','CV_SCORED','SHORTLISTED','TEST_INVITED','TEST_IN_PROGRESS','TEST_COMPLETED','INTERVIEW_INVITED','INTERVIEW_IN_PROGRESS','INTERVIEW_COMPLETED','FINAL_REVIEW','PASSED','REJECTED','CONTACTED')),
  final_decision text check (final_decision in ('PASSED', 'REJECTED') or final_decision is null),
  final_decision_reason text,
  final_decision_by uuid references public.users(id) on delete set null,
  final_decision_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint candidates_campaign_email_unique unique (campaign_id, email)
);

create index if not exists candidates_campaign_id_idx on public.candidates(campaign_id);
create index if not exists candidates_status_idx on public.candidates(status);
create index if not exists candidates_email_idx on public.candidates(email);
drop trigger if exists candidates_set_updated_at on public.candidates;
create trigger candidates_set_updated_at before update on public.candidates for each row execute function public.set_updated_at();

create table if not exists public.candidate_scores (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  score numeric(5,2) not null check (score >= 0 and score <= 100),
  badge text check (badge in ('STRONG', 'GAP', 'HIGH_RISK')),
  ai_reasoning text,
  score_breakdown jsonb not null default '{}'::jsonb,
  risk_flags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists candidate_scores_candidate_id_idx on public.candidate_scores(candidate_id);
create index if not exists candidate_scores_campaign_id_idx on public.candidate_scores(campaign_id);
create index if not exists candidate_scores_score_idx on public.candidate_scores(score desc);
drop trigger if exists candidate_scores_set_updated_at on public.candidate_scores;
create trigger candidate_scores_set_updated_at before update on public.candidate_scores for each row execute function public.set_updated_at();

create table if not exists public.candidate_stage_events (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  from_status text,
  to_status text not null,
  reason text,
  actor_id uuid references public.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists candidate_stage_events_candidate_id_idx on public.candidate_stage_events(candidate_id);
create index if not exists candidate_stage_events_campaign_id_idx on public.candidate_stage_events(campaign_id);

create table if not exists public.test_invitations (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  status text not null default 'SENT' check (status in ('SENT', 'OPENED', 'EXPIRED', 'USED')),
  created_at timestamptz not null default now(),
  used_at timestamptz
);

create index if not exists test_invitations_candidate_id_idx on public.test_invitations(candidate_id);
create index if not exists test_invitations_token_hash_idx on public.test_invitations(token_hash);
create index if not exists test_invitations_expires_at_idx on public.test_invitations(expires_at);

create table if not exists public.test_attempts (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  test_invitation_id uuid not null references public.test_invitations(id) on delete cascade,
  status text not null default 'NOT_STARTED' check (status in ('NOT_STARTED','IN_PROGRESS','SUBMITTED','AUTO_SUBMITTED','SCORED','EXPIRED')),
  started_at timestamptz,
  submitted_at timestamptz,
  duration_seconds integer,
  score numeric(8,2),
  max_score numeric(8,2),
  percentage numeric(5,2) check (percentage >= 0 and percentage <= 100),
  answers jsonb not null default '[]'::jsonb,
  ai_feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint test_attempts_invitation_unique unique (test_invitation_id)
);

create index if not exists test_attempts_candidate_id_idx on public.test_attempts(candidate_id);
create index if not exists test_attempts_campaign_id_idx on public.test_attempts(campaign_id);
drop trigger if exists test_attempts_set_updated_at on public.test_attempts;
create trigger test_attempts_set_updated_at before update on public.test_attempts for each row execute function public.set_updated_at();

create table if not exists public.interview_invitations (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  status text not null default 'SENT' check (status in ('SENT', 'OPENED', 'EXPIRED', 'USED')),
  created_at timestamptz not null default now(),
  used_at timestamptz
);

create index if not exists interview_invitations_candidate_id_idx on public.interview_invitations(candidate_id);
create index if not exists interview_invitations_token_hash_idx on public.interview_invitations(token_hash);
create index if not exists interview_invitations_expires_at_idx on public.interview_invitations(expires_at);

create table if not exists public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  interview_invitation_id uuid not null references public.interview_invitations(id) on delete cascade,
  status text not null default 'WAITING_ROOM' check (status in ('WAITING_ROOM','READY','IN_PROGRESS','COMPLETED','ABORTED','EXPIRED')),
  started_at timestamptz,
  ended_at timestamptz,
  duration_seconds integer,
  microphone_check_passed boolean,
  network_grace_used boolean not null default false,
  customer_sentiment text default 'neutral' check (customer_sentiment in ('calm', 'neutral', 'frustrated')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint interview_sessions_invitation_unique unique (interview_invitation_id)
);

create index if not exists interview_sessions_candidate_id_idx on public.interview_sessions(candidate_id);
create index if not exists interview_sessions_campaign_id_idx on public.interview_sessions(campaign_id);
create index if not exists interview_sessions_status_idx on public.interview_sessions(status);
drop trigger if exists interview_sessions_set_updated_at on public.interview_sessions;
create trigger interview_sessions_set_updated_at before update on public.interview_sessions for each row execute function public.set_updated_at();

create table if not exists public.interview_events (
  id uuid primary key default gen_random_uuid(),
  interview_session_id uuid not null references public.interview_sessions(id) on delete cascade,
  event_type text not null check (event_type in ('candidate_speech','ai_speech','system_warning','network_disconnect','noise_detected','time_warning','session_finished')),
  speaker text check (speaker in ('candidate', 'ai', 'system') or speaker is null),
  text text,
  sentiment text check (sentiment in ('calm', 'neutral', 'frustrated') or sentiment is null),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists interview_events_session_id_idx on public.interview_events(interview_session_id);
create index if not exists interview_events_created_at_idx on public.interview_events(created_at);

create table if not exists public.interview_reports (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  interview_session_id uuid not null references public.interview_sessions(id) on delete cascade,
  transcript jsonb not null default '[]'::jsonb,
  radar_scores jsonb not null default '{}'::jsonb,
  summary text,
  strengths jsonb not null default '[]'::jsonb,
  weaknesses jsonb not null default '[]'::jsonb,
  recommendation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint interview_reports_session_unique unique (interview_session_id)
);

create index if not exists interview_reports_candidate_id_idx on public.interview_reports(candidate_id);
create index if not exists interview_reports_campaign_id_idx on public.interview_reports(campaign_id);
drop trigger if exists interview_reports_set_updated_at on public.interview_reports;
create trigger interview_reports_set_updated_at before update on public.interview_reports for each row execute function public.set_updated_at();

create table if not exists public.email_events (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid references public.candidates(id) on delete set null,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  email_type text not null check (email_type in ('TEST_INVITATION','INTERVIEW_INVITATION','PASS_RESULT','REJECT_RESULT','SECURITY_ALERT')),
  recipient_email text not null,
  subject text not null,
  body text not null,
  status text not null default 'PREVIEW' check (status in ('PREVIEW', 'SENT', 'FAILED')),
  provider text not null default 'mock',
  provider_message_id text,
  error_message text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists email_events_candidate_id_idx on public.email_events(candidate_id);
create index if not exists email_events_campaign_id_idx on public.email_events(campaign_id);
create index if not exists email_events_status_idx on public.email_events(status);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.users(id) on delete set null,
  actor_email text,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_actor_id_idx on public.audit_logs(actor_id);
create index if not exists audit_logs_action_idx on public.audit_logs(action);
create index if not exists audit_logs_created_at_idx on public.audit_logs(created_at desc);
