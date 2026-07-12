from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
from app.database import get_db
from app.models import ChatHistory, Profile
from app.schemas import ChatMessage, ChatResponse, ChatHistoryResponse
from app.routers.auth import get_current_user
from app.services import gemini_service

router = APIRouter(prefix="/api/query-bot", tags=["query-bot"])

@router.post("", response_model=ChatResponse)
async def chat_with_bot(
    chat_msg: ChatMessage,
    user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch recent history for context
    db_history = db.query(ChatHistory).filter(ChatHistory.user_id == user.id).order_by(ChatHistory.created_at.desc()).limit(6).all()
    
    # Map to schema required by service
    history_context = []
    for h in reversed(db_history):
        history_context.append({
            "message": h.message,
            "response": h.response
        })
        
    # Generate bot response using Gemini
    response_text = await gemini_service.generate_chatbot_response(chat_msg.message, history_context)
    
    # Save to history
    new_chat = ChatHistory(
        user_id=user.id,
        message=chat_msg.message,
        response=response_text
    )
    db.add(new_chat)
    db.commit()
    db.refresh(new_chat)
    
    return ChatResponse(
        response=new_chat.response,
        created_at=new_chat.created_at
    )

@router.get("/history", response_model=List[ChatHistoryResponse])
async def get_chat_history(
    user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    history = db.query(ChatHistory).filter(ChatHistory.user_id == user.id).order_by(ChatHistory.created_at.asc()).all()
    return history

