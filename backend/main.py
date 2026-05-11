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
    resumes: List[UploadFile] = File(...),
    api_key: str = Form(None)
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
