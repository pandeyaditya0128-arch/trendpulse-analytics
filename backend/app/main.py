from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.routers import auth, analytics, datasets, chatbot, reports

# Create tables
init_db()

app = FastAPI(title="TrendPulse AI API", version="1.0.0")

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(analytics.router)
app.include_router(datasets.router)
app.include_router(chatbot.router)
app.include_router(reports.router)

@app.get("/")
async def root():
    return {"message": "TrendPulse AI API is running!"}

@app.get("/api/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
