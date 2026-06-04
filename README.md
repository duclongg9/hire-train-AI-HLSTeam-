# HireTrain AI - Intelligent Recruitment Platform

Welcome to the HireTrain AI monorepo. This repository contains the Next.js frontend and FastAPI backend for the AI-powered recruitment platform.

## Project Structure

- `frontend/`: Next.js 15 App Router (TypeScript, Tailwind, shadcn/ui)
- `backend/`: FastAPI (Python, Gemini REST API Integration)

## Prerequisites

- Node.js (v20+)
- Python (3.11+)

## Setup Instructions

### 1. Backend Setup

The backend handles AI processing (JD parsing, CV scoring) via Google Gemini.

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   # Windows
   python -m venv venv
   .\venv\Scripts\activate
   
   # Mac/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure Environment Variables:
   Create a `.env` file inside the `backend` folder and add your Google Gemini API Key:
   ```env
   # Default is mock mode (in-memory DB)
   STORAGE_PROVIDER=mock
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   *(Note: By default, the system runs with an in-memory mock database for easy local testing. To use a real Supabase database, see the "Running with Supabase" section below).*

5. Run the server:
   ```bash
   python -m uvicorn main:app --reload --port 8000
   ```
   The API will be available at `http://127.0.0.1:8000`

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to access the HR Portal.

## How to Test

1. Open `http://localhost:3000/hr-portal`
2. Create a **New Campaign** by entering a title and clicking the create button.
3. Upload a JD (PDF or DOCX) to let the AI generate a scoring Rubric.
4. Go to the Campaign Details, upload candidate CVs, and click **Score Selected** to let Gemini evaluate them based on the generated Rubric.

## Running with Supabase (Production Mode)

If you want to persist data to a real database, you can switch the backend to use Supabase (PostgreSQL).

1. In your `backend/.env` file, change the `STORAGE_PROVIDER` and add your Supabase credentials:
   ```env
   STORAGE_PROVIDER=supabase
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-SUPABASE-REF].supabase.co:5432/postgres
   SUPABASE_URL=https://[YOUR-SUPABASE-REF].supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
2. Restart the FastAPI backend server. The system will now automatically connect to your Supabase PostgreSQL instance and persist all campaigns, candidates, and AI scoring results!
