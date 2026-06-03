# HireTrain AI Monorepo

Welcome to the HireTrain AI monorepo. This repository contains the Next.js frontend, FastAPI backend, and Supabase serverless functions.

## Project Structure

- `frontend/`: Next.js 15 App Router (TypeScript, Tailwind, shadcn/ui)
- `backend/`: FastAPI (Python, SQLAlchemy, PostgreSQL)
- `supabase/`: Serverless Edge Functions (Voice AI Proxy)

## Prerequisites

- Node.js (v20+)
- Python (3.11+)
- PostgreSQL
- Supabase CLI

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file based on configuration keys defined in `config.py`.
5. Run the server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file for frontend environment variables.
4. Run the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Supabase Edge Functions

1. Install Supabase CLI.
2. Navigate to `supabase/` and start local development:
   ```bash
   supabase start
   ```
3. Deploy functions:
   ```bash
   supabase functions deploy
   ```
