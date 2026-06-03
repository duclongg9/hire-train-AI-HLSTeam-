# HireTrain AI Backend

FastAPI backend for Module 1 of HireTrain AI. It supports the full recruitment workflow structurally: campaign creation, JD analysis, rubric editing, test question generation, candidate application, CV scoring, leaderboard, test invitation/submission, virtual interview lifecycle, final review, secure bulk result emails, and audit logs.

## Install

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Run in Mock Mode

Copy `backend/.env.example` to `backend/.env` and keep:

```env
APP_ENV=development
STORAGE_PROVIDER=mock
AI_PROVIDER=mock
INTERVIEW_PROVIDER=mock
EMAIL_PROVIDER=mock
```

Run:

```bash
uvicorn main:app --reload --port 8000
```

Open:

- Health: `http://localhost:8000/health`
- Docs: `http://localhost:8000/docs`

Mock mode includes seeded demo data for one admin, one HR manager, one active Customer Support Specialist campaign, rubric criteria, published questions, candidates, one scored candidate, and audit examples.

## Run in Supabase Mode

First run:

```txt
backend/app/db/migrations/001_init_hiretrain_schema.sql
```

Then set:

```env
APP_ENV=development
STORAGE_PROVIDER=supabase
DATABASE_URL=postgresql://...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
```

The app fails fast if required Supabase credentials are missing. It does not silently use mock storage when `STORAGE_PROVIDER=supabase` is selected.


## Supabase Smoke Test

When `backend/.env` is configured with `STORAGE_PROVIDER=supabase` and the backend server is running, test the real Supabase-backed workflow with:

```bash
cd backend
python scripts/supabase_smoke_test.py
```

This script creates real demo records in Supabase: campaign, rubric, test questions, candidate, CV score, test attempt, interview report, final decision, email event, and audit logs. It fails immediately if `/health` is not using connected Supabase storage.

## Demo Credentials

Mock login accepts:

```json
{
  "email": "hr@hiretrain.ai",
  "role": "HR_MANAGER"
}
```

Admin demo user:

```txt
admin@hiretrain.ai
```

Secure final email confirmation in development:

```txt
demo123
```

## Demo API Flow

1. `GET /health`
2. `POST /api/auth/mock-login`
3. `GET /api/campaigns`
4. `POST /api/campaigns/{campaign_id}/analyze-jd`
5. `PUT /api/campaigns/{campaign_id}/rubric`
6. `POST /api/campaigns/{campaign_id}/test-questions/generate`
7. `POST /api/campaigns/{campaign_id}/test-questions/publish`
8. `POST /api/campaigns/{campaign_id}/publish`
9. `POST /api/public/jobs/{campaign_id}/apply`
10. `POST /api/campaigns/{campaign_id}/candidates/score`
11. `GET /api/campaigns/{campaign_id}/leaderboard`
12. `POST /api/candidates/{candidate_id}/invite-test`
13. `GET /api/candidate/test/{token}`
14. `POST /api/candidate/test/{token}/start`
15. `POST /api/candidate/test/{token}/submit`
16. `POST /api/candidates/{candidate_id}/invite-interview`
17. `POST /api/candidate/interview/{token}/check-in`
18. `POST /api/candidate/interview/{token}/start`
19. `POST /api/candidate/interview/{token}/event`
20. `POST /api/candidate/interview/{token}/finish`
21. `GET /api/candidates/{candidate_id}/final-review`
22. `POST /api/candidates/{candidate_id}/final-decision`
23. `POST /api/campaigns/{campaign_id}/bulk-email`

## What Is Mocked

- AI JD/rubric/question/CV/test/interview report generation
- Email sending, stored as preview events
- Virtual interview provider and customer replies
- CV file parsing and file storage
- Real WebRTC/Gemini Live streaming
- Background queues
- FaceID

Mocked features are selected only through provider settings such as `AI_PROVIDER=mock`. Real provider modes validate required secrets and fail clearly when missing.

## Production-Ready Pieces

- Supabase-compatible relational schema
- Strict environment/provider validation
- Token hashing for candidate test/interview access
- Service boundaries: routes -> services -> repositories/providers
- Workflow validations for rubric weights, active campaigns, duplicate applications, token expiry, repeat test submission, interview lifecycle, and secure email confirmation
- Audit log and email event models

## Current Limitations

- Supabase repository data operations are not implemented yet; mock mode is the complete demo path.
- Real Gemini, Gemini Live, SMTP, file storage, and background workers are explicit stubs.
- Authentication is mock login only.
- Row Level Security policies are not included in the initial migration.

## Next Engineering Step

Implement `app/repositories/supabase_repository.py` methods against the tables created by `001_init_hiretrain_schema.sql`, then run the same tests against `STORAGE_PROVIDER=supabase`.

