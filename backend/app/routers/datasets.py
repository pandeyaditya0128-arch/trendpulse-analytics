import json
import io
import pandas as pd
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Dataset, Profile
from app.routers.auth import get_current_user
from app.schemas import DatasetResponse

router = APIRouter(prefix="/api", tags=["datasets"])

TEXT_PATTERNS  = ["text", "content", "tweet", "body", "description", "title", "review", "comment", "message", "post", "summary", "caption"]
DATE_PATTERNS  = ["date", "time", "created", "published", "timestamp", "at"]
KW_PATTERNS    = ["keyword", "hashtag", "tag", "topic", "term"]
CAT_PATTERNS   = ["category", "genre", "type", "class", "label", "sector"]

def detect_column_roles(df: pd.DataFrame) -> dict:
    text_col = None
    date_col = None
    keyword_col = None
    category_col = None
    numeric_cols = []

    for col in df.columns:
        cl = col.lower().strip()
        if any(cl == p or cl.startswith(p) for p in TEXT_PATTERNS):
            if text_col is None: text_col = col
        if any(cl == p or p in cl for p in DATE_PATTERNS):
            if date_col is None: date_col = col
        if any(cl == p or p in cl for p in KW_PATTERNS):
            if keyword_col is None: keyword_col = col
        if any(cl == p or p in cl for p in CAT_PATTERNS):
            if category_col is None: category_col = col
        if df[col].dtype in ["int64", "float64"]:
            numeric_cols.append(col)

    if not text_col:
        best = 0
        for col in df.select_dtypes(include="object").columns:
            avg = df[col].dropna().astype(str).str.len().mean() or 0
            if avg > best:
                best = avg
                text_col = col

    return {"text_col": text_col, "date_col": date_col, "keyword_col": keyword_col,
            "category_col": category_col, "numeric_cols": numeric_cols[:5]}


def df_to_records(df: pd.DataFrame, roles: dict) -> list:
    records = []
    tc = roles.get("text_col")
    dc = roles.get("date_col")
    kc = roles.get("keyword_col")
    cc = roles.get("category_col")
    nc = roles.get("numeric_cols", [])
    for _, row in df.iterrows():
        r = {k: ("" if pd.isna(v) else v) for k, v in row.to_dict().items()}
        nums = []
        for c in nc:
            try: nums.append(int(float(r.get(c, 0))))
            except: nums.append(0)
        records.append({
            "text": str(r.get(tc, "")) if tc else "",
            "timestamp": str(r.get(dc, datetime.utcnow().isoformat())) if dc else datetime.utcnow().isoformat(),
            "user": str(r.get("user", r.get("author", "anonymous"))),
            "category": str(r.get(cc, "General")) if cc else "General",
            "keyword": str(r.get(kc, "")) if kc else "",
            "engagement": {"likes": nums[0] if len(nums) > 0 else 0,
                           "comments": nums[1] if len(nums) > 1 else 0,
                           "shares": nums[2] if len(nums) > 2 else 0}
        })
    return records


@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...), user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    filename = file.filename or "upload.csv"
    raw = await file.read()
    file_size_kb = round(len(raw) / 1024, 1)
    try:
        if filename.lower().endswith(".json"):
            parsed = json.loads(raw.decode("utf-8"))
            df = pd.DataFrame(parsed if isinstance(parsed, list) else [parsed])
        elif filename.lower().endswith(".csv"):
            df = pd.read_csv(io.StringIO(raw.decode("utf-8", errors="replace")))
        else:
            raise HTTPException(status_code=400, detail="Only CSV and JSON supported")
        if df.empty:
            raise HTTPException(status_code=400, detail="File is empty")
        df.columns = [str(c).strip() for c in df.columns]
        roles = detect_column_roles(df)
        records = df_to_records(df, roles)
        db_ds = Dataset(user_id=user.id, filename=filename, row_count=len(df),
                        columns_json=json.dumps(list(df.columns)),
                        content_json=json.dumps(records[:500]))
        db.add(db_ds); db.commit(); db.refresh(db_ds)
        try:
            from app.routers.analytics import GLOBAL_DATASET
            GLOBAL_DATASET.clear(); GLOBAL_DATASET.extend(records)
        except: pass
        return {"id": db_ds.id, "filename": filename, "rows": len(df), "columns": len(df.columns),
                "file_size_kb": file_size_kb, "all_columns": list(df.columns),
                "text_col": roles["text_col"], "date_col": roles["date_col"],
                "keyword_col": roles["keyword_col"], "category_col": roles["category_col"],
                "numeric_cols": roles["numeric_cols"],
                "preview": df.head(10).fillna("").to_dict(orient="records"),
                "uploaded_at": db_ds.uploaded_at.isoformat(),
                "message": "Dataset uploaded and processed successfully"}
    except HTTPException: raise
    except Exception as e: raise HTTPException(status_code=400, detail=f"Processing failed: {str(e)}")


@router.get("/datasets", response_model=List[DatasetResponse])
async def list_datasets(user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    dss = db.query(Dataset).filter(Dataset.user_id == user.id).order_by(Dataset.uploaded_at.desc()).all()
    return [DatasetResponse(id=d.id, filename=d.filename, row_count=d.row_count,
                            columns=json.loads(d.columns_json), uploaded_at=d.uploaded_at) for d in dss]


@router.get("/datasets/{dataset_id}/preview")
async def preview_dataset(dataset_id: int, user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    ds = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == user.id).first()
    if not ds: raise HTTPException(status_code=404, detail="Not found")
    content = json.loads(ds.content_json)
    return {"columns": json.loads(ds.columns_json), "rows": content[:20], "total": ds.row_count}


@router.post("/datasets/{dataset_id}/reanalyze")
async def reanalyze_dataset(dataset_id: int, user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    ds = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == user.id).first()
    if not ds: raise HTTPException(status_code=404, detail="Not found")
    content = json.loads(ds.content_json)
    try:
        from app.routers.analytics import GLOBAL_DATASET
        GLOBAL_DATASET.clear(); GLOBAL_DATASET.extend(content)
    except: pass
    return {"message": f"Dataset '{ds.filename}' re-loaded into analytics engine", "rows_loaded": len(content)}


@router.get("/datasets/{dataset_id}/search")
async def search_dataset(dataset_id: int, keyword: str, user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    ds = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == user.id).first()
    if not ds: raise HTTPException(status_code=404, detail="Not found")
    content = json.loads(ds.content_json)
    kl = keyword.lower()
    matches = [r for r in content if kl in str(r.get("text","")).lower() or kl in str(r.get("keyword","")).lower()]
    return {"keyword": keyword, "matches": len(matches), "results": matches[:20]}


@router.delete("/datasets/{dataset_id}")
async def delete_dataset(dataset_id: int, user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    ds = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == user.id).first()
    if not ds: raise HTTPException(status_code=404, detail="Not found")
    db.delete(ds); db.commit()
    try:
        from app.routers.analytics import load_dataset
        load_dataset()
    except: pass
    return {"message": "Deleted"}
