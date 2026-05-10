from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
import os
import uvicorn
from datetime import datetime
import json

from parser import extract_text_from_pdf, extract_text_from_docx, extract_text_from_json
from agent_flow import run_agent_flow
from report_generator import generate_reports
from pydantic import BaseModel

app = FastAPI(title="AI HR Shortlisting Agent API")

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
    resumes: List[UploadFile] = File(...)
):
    if not jd_text:
        raise HTTPException(status_code=400, detail="Job Description text is required.")
    
    if not resumes:
        raise HTTPException(status_code=400, detail="At least one file must be uploaded.")

    if not os.environ.get("GEMINI_API_KEY"):
         return {"error": "GEMINI_API_KEY environment variable is not set."}

    results = []
    for file in resumes:
        filename = file.filename.lower()
        file_bytes = await file.read()
        
        resume_text = ""
        if filename.endswith('.pdf'):
            resume_text = extract_text_from_pdf(file_bytes)
        elif filename.endswith('.docx'):
            resume_text = extract_text_from_docx(file_bytes)
        elif filename.endswith('.json'):
            resume_text = extract_text_from_json(file_bytes)
        else:
            continue
            
        if not resume_text:
            results.append({
                "candidate_name": file.filename,
                "error": "Could not extract text from file.",
                "total_score": 0
            })
            continue

        evaluation = run_agent_flow(jd_text, resume_text)
        evaluation["candidate_name"] = file.filename
        results.append(evaluation)
        
    results.sort(key=lambda x: x.get('total_score', 0), reverse=True)
    
    # Generate the physical reports as mandated
    generate_reports(results)
    
    return {"shortlist": results}

class OverrideRequest(BaseModel):
    candidate_name: str
    override_reason: str
    new_total_score: float

@app.post("/api/override")
def log_override(request: OverrideRequest):
    """Physically logs HR overrides to a file."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_entry = {
        "timestamp": timestamp,
        "candidate": request.candidate_name,
        "new_score": request.new_total_score,
        "reason": request.override_reason
    }
    
    with open("override_log.txt", "a") as f:
        f.write(json.dumps(log_entry) + "\n")
        
    print(f"\n[HR OVERRIDE LOGGED] {request.candidate_name}: Score changed to {request.new_total_score}. Reason: {request.override_reason}\n")
    return {"status": "success", "message": "Override logged successfully."}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

