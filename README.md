# TrendPulse AI - AI-Powered Trend Intelligence Platform

TrendPulse AI is a professional, commercial-grade SaaS web application designed for a final-year college project. It offers real-time keyword intelligence, search history logging, dataset management (CSV/JSON uploading), side-by-side keyword comparisons, conversational AI copilot sessions, and generated reports exportable in PDF, CSV, and Excel formats.

## Key Features

1. **Premium SaaS UI**: Vibrant dark and light themes, dynamic layouts, custom glassmorphism widgets, and smooth Framer Motion animations.
2. **Supabase Authentication**: Secure user management (Sign Up, Login, Forgot Password, Logout, email verification) handled client-side using Supabase Auth.
3. **Analytics Dashboard**: High-level KPIs, overall sentiment distributions, trend volume charts, regional heatmaps, and trending hashtags.
4. **CSV Upload Engine**: Interactive file uploader, schema detection, row previews, active file history, and database mapping.
5. **Keyword Search**: Retrieves news headlines, YouTube engagement metadata, and detailed AI analysis concurrently.
6. **Gemini AI Deep Analysis**: Structured summaries, market sentiment scores, future predictions, content strategies, and conversational AI chatbot sessions.
7. **Multi-term Comparison**: Compares two keywords side-by-side with dual line charts, comparative news lists, and AI reports.
8. **Exportable Reports**: PDF downloads generated client-side, and Excel/CSV sheets streamed from the backend.

---

## Technology Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS (v4), Recharts, Framer Motion, React Router, jsPDF, html2canvas
- **Backend**: FastAPI (Python), SQLAlchemy ORM, psycopg (PostgreSQL client), Pandas, Scikit-learn
- **Database**: Supabase PostgreSQL / Local SQLite fallback
- **Authentication**: Supabase Auth

---

## Directory Structure

```text
iridescent-lunar/                  <-- Project Workspace Root
+-- .gitignore
+-- README.md                      <-- Global README file
+-- .env.example                   <-- Global environment configurations example
+-- backend/                       <-- FastAPI Python Backend
¦   +-- app/                       <-- Modular App Folder
¦   ¦   +-- routers/               <-- API Route Routers
¦   ¦   ¦   +-- auth.py            <-- Supabase JWT verification & Profiles
¦   ¦   ¦   +-- analytics.py       <-- Searches, forecasts, and history
¦   ¦   ¦   +-- datasets.py        <-- CSV parser and history
¦   ¦   ¦   +-- chatbot.py         <-- Gemini Chatbot
¦   ¦   ¦   +-- reports.py         <-- PDF, CSV, Excel exports
¦   ¦   +-- services/              <-- Integrations & Business Logic
¦   ¦   ¦   +-- gemini_service.py  <-- Gemini AI integration
¦   ¦   ¦   +-- ml_service.py      <-- RF forecasts and clustering
¦   ¦   ¦   +-- news_service.py    <-- NewsAPI client
¦   ¦   ¦   +-- youtube_service.py <-- YouTube Data API client
¦   ¦   +-- config.py              <-- Configuration & Env loader
¦   ¦   +-- database.py            <-- SQLAlchemy ORM Engine
¦   ¦   +-- models.py              <-- Database Tables
¦   ¦   +-- schemas.py             <-- Pydantic validation schemas
¦   +-- main.py                    <-- Backend Entry point
¦   +-- requirements.txt           <-- Python requirements
¦   +-- trendpulse.db              <-- Local fallback SQLite DB
+-- frontend/                      <-- React + TypeScript + Vite Frontend
    +-- public/                    <-- Static assets
    +-- src/                       <-- React source code
    ¦   +-- components/            <-- Layout shell and guards
    ¦   +-- context/               <-- Supabase Auth Context
    ¦   +-- lib/                   <-- Supabase client configuration
    ¦   +-- pages/                 <-- SaaS application views
    ¦   +-- App.tsx                <-- Router configuration
    ¦   +-- main.tsx               <-- Render entry
    +-- package.json               <-- Node.js package configurations
    +-- vite.config.ts
```

---

## Setup and Installation

### Backend Setup

1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Create a virtual environment and install packages:
   ```bash
   python -m venv .venv
   source .venv/bin/activate   # Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. Copy environment variables:
   Create a `.env` file inside `backend/` and copy variables from `.env.example`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   NEWS_API_KEY=your_news_api_key_here
   YOUTUBE_API_KEY=your_youtube_api_key_here
   DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
   ```
4. Start the server:
   ```bash
   python main.py
   ```
   The backend server runs on `http://localhost:8000`.

### Frontend Setup

1. Navigate to the `frontend` folder:
   ```bash
   cd ../frontend
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Configure environment variables:
   Create a `.env` file inside `frontend/` and add:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   VITE_API_URL=http://localhost:8000
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## Production Readiness

- **Vercel Deployment**: The frontend is completely configured for Vercel static routing.
- **Render Deployment**: The backend is configured as a standalone ASGI application using `uvicorn app.main:app` or `python main.py`.
- **Database Fallback**: In the absence of a `DATABASE_URL` PostgreSQL string, the backend automatically provisions a local SQLite DB (`trendpulse.db`) to keep the system fully functional.
