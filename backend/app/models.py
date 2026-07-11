from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, Float
from app.database import Base

class Profile(Base):
    __tablename__ = "profiles"
    id = Column(String, primary_key=True, index=True) # UUID from Supabase Auth
    email = Column(String, unique=True, index=True, nullable=False)
    profile_name = Column(String, default="User")
    avatar = Column(String, default="??")
    created_at = Column(DateTime, default=datetime.utcnow)

class Dataset(Base):
    __tablename__ = "datasets"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=True) # Linked to profile
    filename = Column(String, nullable=False)
    row_count = Column(Integer, default=0)
    columns_json = Column(Text, default="[]")
    content_json = Column(Text, default="[]")
    uploaded_at = Column(DateTime, default=datetime.utcnow)

class SearchHistory(Base):
    __tablename__ = "search_history"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=True)
    keyword = Column(String, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class ComparisonHistory(Base):
    __tablename__ = "comparison_history"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=True)
    keyword_1 = Column(String, nullable=False)
    keyword_2 = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class AiReport(Base):
    __tablename__ = "ai_reports"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=True)
    keyword = Column(String, index=True, nullable=False)
    report_json = Column(Text, default="{}") # Store structured Gemini response
    created_at = Column(DateTime, default=datetime.utcnow)

class ChatHistory(Base):
    __tablename__ = "chat_history"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=True)
    message = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
