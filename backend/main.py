from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing import List
import os
import uvicorn
from dotenv import load_dotenv
load_dotenv()
from datetime import datetime
import json

from doc_parser import extract_text_from_pdf, extract_text_from_docx, extract_text_from_json
from agent_flow import run_agent_flow
from report_generator import generate_reports
from pydantic import BaseModel
from database import init_db, SessionLocal, Candidate
from sqlalchemy.orm import Session
from fastapi import Depends

# Initialize Database
init_db()

app = FastAPI(title="AI HR Shortlisting Agent API")

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the AI HR Shortlisting Agent API."}

@app.post("/api/evaluate")
async def evaluate_candidates(
    jd_text: str = Form(...),
    resumes: List[UploadFile] = File(...),
    api_key: str = Form(None),
    db: Session = Depends(get_db)
):
    if not jd_text:
        raise HTTPException(status_code=400, detail="Job Description text is required.")
    
    if not resumes:
        raise HTTPException(status_code=400, detail="At least one file must be uploaded.")

    resolved_api_key = api_key
    if not resolved_api_key:
         raise HTTPException(status_code=401, detail="Gemini API Key is mandatory. Please provide your own key in the UI to evaluate resumes.")

    # Pre-read all files (needed before streaming generator)
    file_data = []
    for file in resumes:
        filename = file.filename
        file_bytes = await file.read()
        file_data.append((filename, file_bytes))

    def generate():
        total = len(file_data)
        results = []

        for idx, (filename, file_bytes) in enumerate(file_data):
            # Send progress event
            progress = {
                "type": "progress",
                "current": idx + 1,
                "total": total,
                "filename": filename,
                "step": "parsing"
            }
            yield json.dumps(progress) + "\n"

            fn_lower = filename.lower()
            resume_text = ""
            if fn_lower.endswith('.pdf'):
                resume_text = extract_text_from_pdf(file_bytes)
            elif fn_lower.endswith('.docx'):
                resume_text = extract_text_from_docx(file_bytes)
            elif fn_lower.endswith('.json'):
                resume_text = extract_text_from_json(file_bytes)
            else:
                continue

            if not resume_text:
                results.append({
                    "candidate_name": filename,
                    "error": "Could not extract text from file.",
                    "total_score": 0
                })
                continue

            # Send scoring event
            scoring_progress = {
                "type": "progress",
                "current": idx + 1,
                "total": total,
                "filename": filename,
                "step": "scoring"
            }
            yield json.dumps(scoring_progress) + "\n"

            evaluation = run_agent_flow(jd_text, resume_text, resolved_api_key)
            evaluation["candidate_name"] = filename
            results.append(evaluation)

            # Persist to Database
            try:
                db_candidate = Candidate(
                    candidate_name=filename,
                    total_score=evaluation.get("total_score", 0),
                    recommendation=evaluation.get("recommendation", "Hold"),
                    skills_match_score=evaluation.get("skills_match", {}).get("score", 0),
                    skills_match_justification=evaluation.get("skills_match", {}).get("justification", ""),
                    experience_relevance_score=evaluation.get("experience_relevance", {}).get("score", 0),
                    experience_relevance_justification=evaluation.get("experience_relevance", {}).get("justification", ""),
                    education_certs_score=evaluation.get("education_certs", {}).get("score", 0),
                    education_certs_justification=evaluation.get("education_certs", {}).get("justification", ""),
                    project_portfolio_score=evaluation.get("project_portfolio", {}).get("score", 0),
                    project_portfolio_justification=evaluation.get("project_portfolio", {}).get("justification", ""),
                    communication_quality_score=evaluation.get("communication_quality", {}).get("score", 0),
                    communication_quality_justification=evaluation.get("communication_quality", {}).get("justification", "")
                )
                db.add(db_candidate)
                db.commit()
            except Exception as e:
                print(f"Error saving to DB: {e}")
                db.rollback()

            # Send completed event for this candidate
            done_progress = {
                "type": "progress",
                "current": idx + 1,
                "total": total,
                "filename": filename,
                "step": "done"
            }
            yield json.dumps(done_progress) + "\n"

        # Sort and generate reports
        results.sort(key=lambda x: x.get('total_score', 0), reverse=True)
        generate_reports(results)

        # Send final result
        final = {"type": "result", "shortlist": results}
        yield json.dumps(final) + "\n"

    return StreamingResponse(generate(), media_type="application/x-ndjson")

class OverrideRequest(BaseModel):
    candidate_name: str
    override_reason: str
    new_total_score: float

@app.post("/api/override")
def log_override(request: OverrideRequest, db: Session = Depends(get_db)):
    """Updates candidate in DB and logs override."""
    # Update DB
    db_candidate = db.query(Candidate).filter(Candidate.candidate_name == request.candidate_name).order_by(Candidate.created_at.desc()).first()
    if db_candidate:
        db_candidate.total_score = request.new_total_score
        db_candidate.override_reason = request.override_reason
        db_candidate.is_overridden = True
        db.commit()

    # Legacy text logging
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_entry = {
        "timestamp": timestamp,
        "candidate": request.candidate_name,
        "new_score": request.new_total_score,
        "reason": request.override_reason
    }
    with open("override_log.txt", "a") as f:
        f.write(json.dumps(log_entry) + "\n")
        
    return {"status": "success", "message": "Override saved to database."}

@app.get("/api/history")
def get_history(db: Session = Depends(get_db)):
    """Fetches all past evaluations from the database."""
    candidates = db.query(Candidate).order_by(Candidate.created_at.desc()).all()
    # Format for frontend
    history = []
    for c in candidates:
        history.append({
            "id": c.id,
            "candidate_name": c.candidate_name,
            "total_score": c.total_score,
            "recommendation": c.recommendation,
            "is_flagged": c.is_flagged,
            "is_overridden": c.is_overridden,
            "override_reason": c.override_reason,
            "created_at": c.created_at.isoformat(),
            "skills_match": {"score": c.skills_match_score, "justification": c.skills_match_justification},
            "experience_relevance": {"score": c.experience_relevance_score, "justification": c.experience_relevance_justification},
            "education_certs": {"score": c.education_certs_score, "justification": c.education_certs_justification},
            "project_portfolio": {"score": c.project_portfolio_score, "justification": c.project_portfolio_justification},
            "communication_quality": {"score": c.communication_quality_score, "justification": c.communication_quality_justification}
        })
    return history

@app.delete("/api/candidates/{candidate_id}")
def delete_candidate(candidate_id: int, db: Session = Depends(get_db)):
    """Removes a candidate record from the database."""
    db_candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not db_candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    db.delete(db_candidate)
    db.commit()
    return {"status": "success", "message": "Candidate deleted successfully"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
