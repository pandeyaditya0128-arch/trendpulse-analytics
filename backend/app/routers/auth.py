import httpx
from fastapi import APIRouter, Depends, HTTPException, Header, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Profile
from app.schemas import ProfileResponse
from app.config import SUPABASE_URL, SUPABASE_ANON_KEY

router = APIRouter(prefix="/api/auth", tags=["auth"])

from typing import Optional

async def get_current_user(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = authorization.split(" ")[1]
        
    # Standard Supabase User Info Call
    headers = {
        "Authorization": f"Bearer {token}",
        "apikey": SUPABASE_ANON_KEY
    }
    url = f"{SUPABASE_URL}/auth/v1/user"
    
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(url, headers=headers)
            if res.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session token")
                
            user_data = res.json()
            user_id = user_data.get("id")
            email = user_data.get("email")
            user_metadata = user_data.get("user_metadata", {})
            profile_name = user_metadata.get("display_name", email.split("@")[0])
            
            profile = db.query(Profile).filter(Profile.id == user_id).first()
            if not profile:
                profile = Profile(id=user_id, email=email, profile_name=profile_name, avatar="\U0001F916")
                db.add(profile)
                db.commit()
                db.refresh(profile)
                
            return profile
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Session authentication failed: {str(e)}")

@router.get("/profile", response_model=ProfileResponse)
async def get_profile(user: Profile = Depends(get_current_user)):
    return user

@router.post("/profile/update", response_model=ProfileResponse)
async def update_profile(
    profile_name: str = Form(...),
    avatar: str = Form(...),
    user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user.profile_name = profile_name
    user.avatar = avatar
    db.commit()
    db.refresh(user)
    return user

