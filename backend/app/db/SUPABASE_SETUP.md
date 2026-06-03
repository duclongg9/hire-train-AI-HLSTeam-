# Supabase Setup

This backend is designed for Supabase/PostgreSQL as the real persistence layer, with mock storage available only for local development and hackathon preparation.

## 1. Create a Supabase Project

1. Go to the Supabase dashboard.
2. Create a new project.
3. Save the database password securely.
4. Wait until the project status is ready.

## 2. Run the SQL Migration

1. Open the project.
2. Go to SQL Editor.
3. Open `backend/app/db/migrations/001_init_hiretrain_schema.sql`.
4. Paste the full SQL into Supabase SQL Editor.
5. Run it.
6. Verify tables with:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
```

Expected tables include `users`, `campaigns`, `rubric_criteria`, `test_questions`, `candidates`, `candidate_scores`, `test_invitations`, `test_attempts`, `interview_sessions`, `interview_reports`, `email_events`, and `audit_logs`.

## 3. Credentials to Copy

From Supabase project settings, copy:

- Project URL -> `SUPABASE_URL`
- Service role key -> `SUPABASE_SERVICE_ROLE_KEY`
- Anon key -> `SUPABASE_ANON_KEY` if the frontend later needs direct Supabase access
- Direct PostgreSQL connection string -> `DATABASE_URL`

Use the backend service role key only on the backend. Do not expose it in the frontend.

## 4. Mock Mode

Use this for development without Supabase:

```env
APP_ENV=development
STORAGE_PROVIDER=mock
AI_PROVIDER=mock
INTERVIEW_PROVIDER=mock
EMAIL_PROVIDER=mock
```

The backend logs:

```txt
Running with mock storage. Supabase is not active.
```

## 5. Supabase Mode

Use this when real database persistence is required:

```env
APP_ENV=development
STORAGE_PROVIDER=supabase
DATABASE_URL=postgresql://...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
```

If these values are missing, startup fails. The backend does not silently fall back to mock storage.

Current implementation note: Supabase connection validation is wired through `/health`. The full repository method implementation is intentionally left as the next step after mock-mode API workflow validation.

## 6. Verify Health

Mock mode:

```json
{
  "status": "ok",
  "app_env": "development",
  "storage_provider": "mock",
  "database_connected": false,
  "ai_provider": "mock",
  "interview_provider": "mock",
  "email_provider": "mock"
}
```

Supabase mode with valid DB:

```json
{
  "status": "ok",
  "app_env": "development",
  "storage_provider": "supabase",
  "database_connected": true,
  "ai_provider": "mock",
  "interview_provider": "mock",
  "email_provider": "mock"
}
```

## 7. Common Errors

- `DATABASE_URL required`: set `STORAGE_PROVIDER=mock` or provide a real Supabase database URL.
- `database is unavailable`: verify password, host, SSL requirement, and network access.
- `relation does not exist`: run `001_init_hiretrain_schema.sql` in SQL Editor.
- `duplicate key value violates unique constraint`: candidate email already exists in that campaign.
- `Mock storage is not allowed in production`: set `STORAGE_PROVIDER=supabase` for production.

## 8. Secrets Needed for Real Integrations

```txt
NEED_SECRET:
- Variable name: DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
- Where to get it: Supabase Project Settings > API and Database settings
- Why it is needed: Real PostgreSQL persistence
- Feature blocked without it: Supabase storage mode
- Can continue with mock fallback in development: yes
```

```txt
NEED_SECRET:
- Variable name: GEMINI_API_KEY or GEMINI_LIVE_API_KEY
- Where to get it: Google AI Studio / Gemini API credentials
- Why it is needed: Real AI generation or live interview integration
- Feature blocked without it: Real Gemini provider modes
- Can continue with mock fallback in development: yes
```

```txt
NEED_SECRET:
- Variable name: SMTP_HOST, SMTP_USER, SMTP_PASSWORD, SMTP_FROM
- Where to get it: SMTP/email provider dashboard
- Why it is needed: Real email delivery
- Feature blocked without it: EMAIL_PROVIDER=smtp
- Can continue with mock fallback in development: yes
```
