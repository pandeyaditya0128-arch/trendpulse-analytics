from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional, Dict, Any

class ProfileBase(BaseModel):
    profile_name: str
    avatar: str

class ProfileUpdate(ProfileBase):
    pass

class ProfileResponse(ProfileBase):
    id: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True

class SearchHistoryResponse(BaseModel):
    id: int
    keyword: str
    created_at: datetime

    class Config:
        from_attributes = True

class ComparisonHistoryResponse(BaseModel):
    id: int
    keyword_1: str
    keyword_2: str
    created_at: datetime

    class Config:
        from_attributes = True

class DatasetResponse(BaseModel):
    id: int
    filename: str
    row_count: int
    columns: List[str]
    uploaded_at: datetime

    class Config:
        from_attributes = True

class ChatMessage(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    created_at: datetime

class ChatHistoryResponse(BaseModel):
    id: int
    message: str
    response: str
    created_at: datetime

    class Config:
        from_attributes = True

class CompareRequest(BaseModel):
    keyword1: str
    keyword2: str
