# TrendPulse AI – Social Media Trend Prediction Platform

TrendPulse AI is a modern, production-quality SaaS analytics platform that predicts emerging social media trends using Natural Language Processing (NLP), Machine Learning, sentiment analysis, engagement metrics, and real-time visualization.

Designed like an enterprise business intelligence tool (comparable to Tableau, Power BI, or Hootsuite), the application features a futuristic dark UI, premium glassmorphism effects, smooth animations, and fully responsive layouts.

---

## Key Features

* **SaaS Analytics Dashboard**: High-impact metrics including Trend Strength, Total Mentions, Positive/Negative/Neutral sentiment ratios, Virality, and Growth Rate.
* **Auto-Regressive ML Forecasting**: Integrates a `scikit-learn` Random Forest regressor to analyze historical mention lags and generate 30-day dotted trajectory lines with confidence intervals.
* **Smart Sentiment Analysis**: Evaluates raw text logs using natural language preprocessing, tokenization, stopword removal, and lexicon scoring.
* **Live Trending Pipeline**: Live ticker panel feeding emerging hashtags and explosive keyword movements.
* **Geographical & Time Slices**: Displays region popularity wireframes (USA, India, UK, Canada, Germany, Japan, Australia) and hourly/daily/weekly timeline trends.
* **Topic Clustering & Word Cloud**: Interactive floating bubble charts for category grouping and hashtag frequency word clouds.
* **ML Pipeline Flowchart**: An interactive, animated SVG diagram visualizing data flow from raw ingestion to model prediction.
* **Dataset Manager**: Upload CSV/JSON logs, preview schemas, validate structures, and auto-detect columns.
* **Security & Admin Controls**: Expose JWT authentication (Signup, Login, Verify), generate API access keys, inspect system health monitors, and view live gateway logs.

---

## Tech Stack

**Frontend:**
* React (v19)
* TypeScript (v6)
* TailwindCSS (v4)
* Framer Motion (v12)
* Recharts (v3)
* Lucide Icons

**Backend & ML:**
* FastAPI (Python v3.13)
* SQLAlchemy (v2)
* Scikit-Learn (v1.8)
* Pandas & NumPy
* PyJWT (Token Validation)

**Database & Cache:**
* PostgreSQL (with transparent local `SQLite3` database file fallback for zero-config startup)
* Redis (with in-memory dictionary-based key-value cache layer fallback)

---

## Project Structure

```text
├── backend/
│   ├── cache.py          # Redis/Memory Cache Layer
│   ├── database.py       # SQL Database Engine & Schemas
│   ├── data_gen.py       # Synthetic Dataset Generator
│   ├── dataset.json      # Mock Ingestion Data (5,000 entries)
│   ├── main.py           # FastAPI Core Application Router
│   └── ml_engine.py      # ML Regressor, NLP Cleaners & Clustering
│   └── requirements.txt  # Python Dependency Manifesto
├── frontend/
│   ├── public/           # Static assets
│   ├── src/
│   │   ├── assets/       # Media files
│   │   ├── App.tsx       # Main React Component
│   │   ├── main.tsx      # React DOM bootstrap
│   │   └── index.css     # CSS Custom rules & Tailwind v4
│   ├── index.html        # HTML Template wrapper
│   ├── package.json      # Node Packages & Scripts
│   ├── tsconfig.json     # Typescript root configuration
│   └── tsconfig.app.json # Typescript App build configuration
└── .gitignore            # Root repository file filters
```

---

## Installation & Setup

### Prerequisites
* [Node.js](https://nodejs.org/) (v20+ recommended)
* [Python](https://www.python.org/) (v3.10+ recommended)
* PostgreSQL & Redis (Optional - falls back to SQLite & in-memory cache automatically)

### 1. Backend Configuration
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install Python packages:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the FastAPI server:
   ```bash
   python main.py
   ```
   The backend will bootstrap, load/generate default mock data, and run on `http://localhost:8001`.

### 2. Frontend Configuration
1. Navigate to the `frontend` folder:
   ```bash
   cd ../frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```
   The application will start on `http://localhost:5173`. Open this URL in your web browser.

---

## Screenshots Placeholder

*Insert beautiful screenshots of the Dashboard, Dataset Manager, and Admin console here.*

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.
