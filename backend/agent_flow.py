import os
from pydantic import BaseModel, Field
from langchain_core.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.output_parsers import PydanticOutputParser

# 1. Structured JD Schema
class StructuredJD(BaseModel):
    required_skills: list[str] = Field(description="List of required skills")
    required_experience: str = Field(description="Summary of required experience level and domain")
    required_education: str = Field(description="Minimum education or certifications required")

# 2. Structured Profile Schema
class StructuredProfile(BaseModel):
    candidate_skills: list[str] = Field(description="List of skills the candidate possesses")
    candidate_experience: str = Field(description="Summary of the candidate's work history and seniority")
    candidate_education: str = Field(description="Education and certifications held by the candidate")
    candidate_projects: str = Field(description="Summary of portfolio or projects mentioned")

# 3. Scoring Schema
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

def get_llm(custom_api_key=None):
    api_key = custom_api_key or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is not set and no custom key provided.")
    # Using flash as it works reliably for all free tiers
    return ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=api_key, temperature=0.1)

def parse_jd(raw_jd_text: str, api_key: str = None) -> dict:
    """Step 1: Extract structured requirements from JD"""
    llm = get_llm(api_key)
    parser = PydanticOutputParser(pydantic_object=StructuredJD)
    prompt = PromptTemplate(
        template="Extract the core requirements from this Job Description.\n{format_instructions}\n\nJD:\n{jd}",
        input_variables=["jd"],
        partial_variables={"format_instructions": parser.get_format_instructions()}
    )
    chain = prompt | llm | parser
    return chain.invoke({"jd": raw_jd_text}).model_dump()

def parse_profile(raw_profile_text: str, api_key: str = None) -> dict:
    """Step 2: Parse raw resume/LinkedIn text into structured fields"""
    llm = get_llm(api_key)
    parser = PydanticOutputParser(pydantic_object=StructuredProfile)
    prompt = PromptTemplate(
        template="Extract the candidate's core details from this resume or LinkedIn profile.\n{format_instructions}\n\nProfile:\n{profile}",
        input_variables=["profile"],
        partial_variables={"format_instructions": parser.get_format_instructions()}
    )
    chain = prompt | llm | parser
    return chain.invoke({"profile": raw_profile_text}).model_dump()

def score_profile(structured_jd: dict, structured_profile: dict, raw_profile_text: str, api_key: str = None) -> dict:
    """Step 3: Compare structured profile against JD and compute rubric scores"""
    llm = get_llm(api_key)
    parser = PydanticOutputParser(pydantic_object=CandidateEvaluation)
    prompt = PromptTemplate(
        template="""You are an expert AI HR assistant evaluating a candidate against a Job Description.
        
Compare the Candidate Profile against the Job Requirements.
Evaluate on a scale of 0-10 based on this rubric:
- Skills Match (30% weight): 0 = <30% match, 5 = 50-70% match, 10 = >85% match.
- Experience Relevance (25% weight): 0 = Unrelated domain, 5 = Adjacent domain, 10 = Exact domain & seniority.
- Education & Certs (15% weight): 0 = Does not meet minimum, 5 = Meets minimum, 10 = Exceeds + extra certs.
- Project / Portfolio (20% weight): 0 = No evidence, 5 = 1-2 generic projects, 10 = Strong relevant portfolio.
- Communication Quality (10% weight): 0 = Poor structure/grammar, 5 = Adequate clarity, 10 = Crisp, structured, impactful.

Evaluate based on the original raw profile text for communication.
Provide a recommendation: 'Hire', 'No-Hire', or 'Hold'.

Job Requirements:
{jd}

Candidate Profile:
{profile}

Raw Profile (for Communication eval):
{raw_profile}

{format_instructions}
""",
        input_variables=["jd", "profile", "raw_profile"],
        partial_variables={"format_instructions": parser.get_format_instructions()}
    )
    chain = prompt | llm | parser
    evaluation = chain.invoke({
        "jd": str(structured_jd), 
        "profile": str(structured_profile),
        "raw_profile": raw_profile_text[:2000] # Pass a chunk for communication eval
    })
    
    result_dict = evaluation.model_dump()
    # Enforce exact math for weighted total
    exact_total = (
        result_dict["skills_match"]["score"] * 0.30 +
        result_dict["experience_relevance"]["score"] * 0.25 +
        result_dict["education_certs"]["score"] * 0.15 +
        result_dict["project_portfolio"]["score"] * 0.20 +
        result_dict["communication_quality"]["score"] * 0.10
    )
    result_dict["total_score"] = exact_total
    
    return result_dict

def run_agent_flow(jd_text: str, resume_text: str, api_key: str = None) -> dict:
    """Orchestrates the 3 steps of the agent flow."""
    try:
        s_jd = parse_jd(jd_text, api_key)
        s_profile = parse_profile(resume_text, api_key)
        evaluation = score_profile(s_jd, s_profile, resume_text, api_key)
        
        # Mandatory Print Output
        print("\n" + "="*50)
        print(f"EVALUATION RESULT")
        print("="*50)
        print(f"Skills Match (30%): {evaluation['skills_match']['score']}/10 - {evaluation['skills_match']['justification']}")
        print(f"Experience Relevance (25%): {evaluation['experience_relevance']['score']}/10 - {evaluation['experience_relevance']['justification']}")
        print(f"Education & Certs (15%): {evaluation['education_certs']['score']}/10 - {evaluation['education_certs']['justification']}")
        print(f"Project / Portfolio (20%): {evaluation['project_portfolio']['score']}/10 - {evaluation['project_portfolio']['justification']}")
        print(f"Communication Quality (10%): {evaluation['communication_quality']['score']}/10 - {evaluation['communication_quality']['justification']}")
        print("-" * 50)
        print(f"WEIGHTED TOTAL SCORE: {evaluation['total_score']:.1f}/10")
        print(f"RECOMMENDATION: {evaluation['recommendation']}")
        print("="*50 + "\n")
        
        return evaluation
    except Exception as e:
        print(f"Error in Agent Flow: {e}")
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
