import json
import io
import pandas as pd
from datetime import datetime
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Dataset, Profile
from app.routers.auth import get_current_user
from app.schemas import DatasetResponse

router = APIRouter(prefix="/api", tags=["datasets"])

@router.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    filename = file.filename
    content = await file.read()
    
    try:
        # Load and parse content
        if filename.endswith(".json"):
            parsed = json.loads(content.decode("utf-8"))
        elif filename.endswith(".csv"):
            df = pd.read_csv(io.StringIO(content.decode("utf-8")))
            
            parsed = []
            for _, row in df.iterrows():
                row_dict = row.to_dict()
                # Clean NaNs
                cleaned_dict = {k: ("" if pd.isna(v) else v) for k, v in row_dict.items()}
                
                # Standard mapping
                post = {
                    "text": cleaned_dict.get("text", cleaned_dict.get("content", cleaned_dict.get("Tweet", ""))),
                    "timestamp": cleaned_dict.get("timestamp", cleaned_dict.get("date", datetime.utcnow().isoformat())),
                    "user": cleaned_dict.get("user", cleaned_dict.get("author", "anonymous")),
                    "category": cleaned_dict.get("category", cleaned_dict.get("topic", "Technology")),
                    "keyword": cleaned_dict.get("keyword", cleaned_dict.get("hashtag", "AI")),
                    "engagement": {
                        "likes": int(cleaned_dict.get("likes", cleaned_dict.get("retweets", 0))),
                        "comments": int(cleaned_dict.get("comments", 0)),
                        "shares": int(cleaned_dict.get("shares", 0))
                    }
                }
                parsed.append(post)
        else:
            raise HTTPException(status_code=400, detail="Only CSV and JSON datasets are supported")
            
        if not parsed or not isinstance(parsed, list):
            raise HTTPException(status_code=400, detail="Invalid dataset: must be a list of records")
            
        # Detect columns
        columns = list(parsed[0].keys()) if parsed else []
        
        # Save to database
        db_dataset = Dataset(
            user_id=user.id,
            filename=filename,
            row_count=len(parsed),
            columns_json=json.dumps(columns),
            content_json=json.dumps(parsed)
        )
        db.add(db_dataset)
        db.commit()
        db.refresh(db_dataset)
        
        # Optionally load into analytics global memory
        from app.routers.analytics import GLOBAL_DATASET
        GLOBAL_DATASET.clear()
        GLOBAL_DATASET.extend(parsed)
        
        return {
            "message": "Dataset uploaded and parsed successfully",
            "id": db_dataset.id,
            "filename": db_dataset.filename,
            "rows": db_dataset.row_count,
            "columns": columns,
            "preview": parsed[:5]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process dataset: {str(e)}")

@router.get("/datasets", response_model=List[DatasetResponse])
async def list_datasets(
    user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    datasets = db.query(Dataset).filter(Dataset.user_id == user.id).order_by(Dataset.uploaded_at.desc()).all()
    
    results = []
    for d in datasets:
        results.append(DatasetResponse(
            id=d.id,
            filename=d.filename,
            row_count=d.row_count,
            columns=json.loads(d.columns_json),
            uploaded_at=d.uploaded_at
        ))
    return results

@router.delete("/datasets/{dataset_id}")
async def delete_dataset(
    dataset_id: int,
    user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ds = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == user.id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    db.delete(ds)
    db.commit()
    
    # Reload original dataset
    from app.routers.analytics import load_dataset
    load_dataset()
    
    return {"message": "Dataset deleted successfully"}
