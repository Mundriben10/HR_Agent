import os
from pydantic import BaseModel, Field
from langchain_core.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.output_parsers import PydanticOutputParser

class DimensionScore(BaseModel):
    score: int = Field(description="Score from 0 to 10")
    justification: str = Field(description="One-line justification for this score")

class CandidateEvaluation(BaseModel):
    skills_match: DimensionScore = Field(description="Skills Match (30% weight)")
    experience_relevance: DimensionScore = Field(description="Experience Relevance (25% weight)")
    education_certs: DimensionScore = Field(description="Education & Certs (15% weight)")
    project_portfolio: DimensionScore = Field(description="Project / Portfolio (20% weight)")
    communication_quality: DimensionScore = Field(description="Communication Quality (10% weight)")
    total_score: float = Field(description="Weighted total score based on the rubric weights")
    recommendation: str = Field(description="'Hire', 'No-Hire', or 'Hold' recommendation")

def score_candidate(jd_text: str, resume_text: str) -> dict:
    """Uses LLM to score the resume against the JD."""
    
    # Require GEMINI_API_KEY environment variable
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is not set. Please set it to use the scorer.")
        
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=api_key, temperature=0.1)
    parser = PydanticOutputParser(pydantic_object=CandidateEvaluation)
    
    prompt = PromptTemplate(
        template="""You are an expert AI HR assistant evaluating a candidate's resume against a Job Description.
        
Evaluate the candidate on a scale of 0-10 for each of the following dimensions based on this rubric:
- Skills Match (30% weight): 0 = <30% match, 5 = 50-70% match, 10 = >85% match.
- Experience Relevance (25% weight): 0 = Unrelated domain, 5 = Adjacent domain, 10 = Exact domain & seniority.
- Education & Certs (15% weight): 0 = Does not meet minimum, 5 = Meets minimum, 10 = Exceeds + extra certs.
- Project / Portfolio (20% weight): 0 = No evidence, 5 = 1-2 generic projects, 10 = Strong relevant portfolio.
- Communication Quality (10% weight): 0 = Poor structure/grammar, 5 = Adequate clarity, 10 = Crisp, structured, impactful.

Calculate the weighted total_score out of 10.
Provide a recommendation: 'Hire', 'No-Hire', or 'Hold'.

Job Description:
{jd_text}

Candidate Resume:
{resume_text}

{format_instructions}
""",
        input_variables=["jd_text", "resume_text"],
        partial_variables={"format_instructions": parser.get_format_instructions()}
    )
    
    chain = prompt | llm | parser
    
    try:
        result = chain.invoke({"jd_text": jd_text, "resume_text": resume_text})
        return result.model_dump()
    except Exception as e:
        print(f"Error calling LLM: {e}")
        return {
            "error": str(e),
            "skills_match": {"score": 0, "justification": "Error parsing"},
            "experience_relevance": {"score": 0, "justification": "Error parsing"},
            "education_certs": {"score": 0, "justification": "Error parsing"},
            "project_portfolio": {"score": 0, "justification": "Error parsing"},
            "communication_quality": {"score": 0, "justification": "Error parsing"},
            "total_score": 0,
            "recommendation": "Error"
        }
