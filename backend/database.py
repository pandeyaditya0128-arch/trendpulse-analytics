import os
import json
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, Float, Text
from sqlalchemy.orm import declarative_base, sessionmaker

# Setup engine with fallback to SQLite
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./trendpulse.db")

try:
    if DATABASE_URL.startswith("postgresql"):
        # Check if psycopg exists
        import psycopg
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {})
except Exception as e:
    print(f"PostgreSQL connection failed or library missing: {e}. Falling back to SQLite.")
    DATABASE_URL = "sqlite:///./trendpulse.db"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_verified = Column(Boolean, default=False)
    profile_name = Column(String, default="User")
    avatar = Column(String, default="🤖")
    created_at = Column(DateTime, default=datetime.utcnow)

class Dataset(Base):
    __tablename__ = "datasets"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    row_count = Column(Integer, default=0)
    columns_json = Column(Text, default="[]")
    content_json = Column(Text, default="[]")
    uploaded_at = Column(DateTime, default=datetime.utcnow)

class ApiKey(Base):
    __tablename__ = "api_keys"
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True, nullable=False)
    label = Column(String, default="Default Key")
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

class TrendAlert(Base):
    __tablename__ = "trend_alerts"
    id = Column(Integer, primary_key=True, index=True)
    keyword = Column(String, index=True)
    type = Column(String)  # warning, spike, virality, decline
    message = Column(String)
    severity = Column(String)  # Low, Medium, High, Critical
    priority = Column(String)  # Low, Medium, High
    timestamp = Column(DateTime, default=datetime.utcnow)
    is_dismissed = Column(Boolean, default=False)

class TrendPrediction(Base):
    __tablename__ = "trend_predictions"
    id = Column(Integer, primary_key=True, index=True)
    keyword = Column(String, unique=True, index=True)
    score = Column(Float)
    growth = Column(Float)
    momentum = Column(Float)
    peak_probability = Column(Float)
    confidence = Column(Float)
    status = Column(String)  # Strong Rising, Moderate Rising, Stable, Declining, Critical Drop
    forecast_json = Column(Text)  # JSON representation of forecasts
    updated_at = Column(DateTime, default=datetime.utcnow)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
