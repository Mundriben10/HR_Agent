from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, Text
 doctrines = {
    "sqlite": "sqlite:///./hr_agent.db"
}
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

SQLALCHEMY_DATABASE_URL = "sqlite:///./hr_agent.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    candidate_name = Column(String, index=True)
    total_score = Column(Float)
    recommendation = Column(String)
    is_flagged = Column(Boolean, default=False)
    override_reason = Column(Text, nullable=True)
    is_overridden = Column(Boolean, default=False)
    
    # Dimension scores
    skills_match_score = Column(Float)
    skills_match_justification = Column(Text)
    
    experience_relevance_score = Column(Float)
    experience_relevance_justification = Column(Text)
    
    education_certs_score = Column(Float)
    education_certs_justification = Column(Text)
    
    project_portfolio_score = Column(Float)
    project_portfolio_justification = Column(Text)
    
    communication_quality_score = Column(Float)
    communication_quality_justification = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)

def init_db():
    Base.metadata.create_all(bind=engine)
