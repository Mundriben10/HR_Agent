# AI HR Shortlisting Agent

This project is an AI-powered HR Shortlisting Agent that efficiently evaluates candidates by comparing their resumes against a Job Description. 

## Technology Stack
- **Frontend**: Built with **React** (Vite) and Vanilla CSS, featuring a bold, dark-themed glassmorphism UI for a professional "enterprise intelligence platform" aesthetic.
- **Backend**: Built with **FastAPI** (Python), providing a robust, high-performance JSON API.
- **AI/LLM**: Google Gemini 1.5 Pro (via free tier API) and LangChain for structured evaluation scoring.
- **PDF Parsing**: PyMuPDF (`fitz`) for accurate text extraction from resumes.

## Prerequisites
1. Python 3.9+
2. Node.js 18+
3. A Google Gemini API Key (get one for free from Google AI Studio)

## Setup & Running

### 1. Backend (FastAPI)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt # (or install dependencies manually if not present)

# Set your API key
export GEMINI_API_KEY="your_api_key_here"

# Run the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
The backend API will be running at `http://localhost:8000`. You can view the docs at `http://localhost:8000/docs`.

### 2. Frontend (React)
```bash
cd frontend
npm install
npm run dev
```
The frontend will be running at `http://localhost:5173`. Open this in your browser to use the platform.

## Features
- Upload a Job Description and multiple PDF resumes.
- The backend extracts text and uses LangChain + Gemini to score each candidate on a 5-dimension rubric (Skills Match, Experience Relevance, Education & Certs, Project/Portfolio, Communication Quality).
- The frontend displays a beautiful, ranked list with visual score bars and expandable justifications.
