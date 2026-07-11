import json
import io
import pandas as pd
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import AiReport, Profile
from app.routers.auth import get_current_user
from app.routers.analytics import analyze

router = APIRouter(prefix="/api/reports", tags=["reports"])

@router.post("/save")
async def save_report(
    keyword: str = Query(...),
    report_content: str = Query(...),
    user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if a report for this keyword already exists
    existing = db.query(AiReport).filter(AiReport.user_id == user.id, AiReport.keyword == keyword).first()
    if existing:
        existing.report_json = report_content
        existing.created_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return {"message": "Report updated successfully", "id": existing.id}
        
    new_report = AiReport(
        user_id=user.id,
        keyword=keyword,
        report_json=report_content
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    return {"message": "Report saved successfully", "id": new_report.id}

@router.get("")
async def list_reports(
    user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reports = db.query(AiReport).filter(AiReport.user_id == user.id).order_by(AiReport.created_at.desc()).all()
    return [{"id": r.id, "keyword": r.keyword, "created_at": r.created_at, "report": json.loads(r.report_json) if r.report_json.startswith("{") else r.report_json} for r in reports]

@router.delete("/{report_id}")
async def delete_report(
    report_id: int,
    user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = db.query(AiReport).filter(AiReport.id == report_id, AiReport.user_id == user.id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    db.delete(report)
    db.commit()
    return {"message": "Report deleted successfully"}

@router.get("/export/csv")
async def export_csv(keyword: str, db: Session = Depends(get_db)):
    # Generate search volume data
    analysis = await analyze(keyword, user=None, db=db)
    history = analysis.get("history", [])
    
    df = pd.DataFrame(history)
    if df.empty:
        df = pd.DataFrame([{"date": datetime.now().strftime("%Y-%m-%d"), "volume": 0}])
        
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    
    response = StreamingResponse(
        iter([stream.getvalue()]),
        media_type="text/csv"
    )
    response.headers["Content-Disposition"] = f"attachment; filename=trendpulse_{keyword}_report.csv"
    return response

@router.get("/export/excel")
async def export_excel(keyword: str, db: Session = Depends(get_db)):
    # Generate search volume data
    analysis = await analyze(keyword, user=None, db=db)
    history = analysis.get("history", [])
    
    df = pd.DataFrame(history)
    if df.empty:
        df = pd.DataFrame([{"date": datetime.now().strftime("%Y-%m-%d"), "volume": 0}])
        
    # We write into a bytes buffer using standard excel format
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter' if 'xlsxwriter' in pd.io.excel._writers else None) as writer:
        df.to_excel(writer, index=False, sheet_name="Trend Data")
        
    output.seek(0)
    
    response = StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    response.headers["Content-Disposition"] = f"attachment; filename=trendpulse_{keyword}_report.xlsx"
    return response
