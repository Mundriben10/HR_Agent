import os
import sys

# Ensure backend path is in sys.path
sys.path.append("/Users/karanmundari/Desktop/hr_shortlisting/backend")

from llm_scorer import score_candidate
from dotenv import load_dotenv

load_dotenv("/Users/karanmundari/Desktop/hr_shortlisting/backend/.env")

jd = "We need a frontend developer with React experience."
resume = "I am a frontend developer. I know React, HTML, CSS."

try:
    print(score_candidate(jd, resume))
except Exception as e:
    print(f"Top level error: {e}")
