"""
Schemas for Previous Year Questions (PYQ) system
"""
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class PYQQuestion(BaseModel):
    """Single PYQ question with optional image and answer"""
    model_config = ConfigDict(populate_by_name=True)
    
    question_id: str = Field(..., alias="questionId")
    question_text: str = Field(..., alias="questionText")
    topic: str
    subject: str
    grade: int
    year: Optional[int] = None
    difficulty: Optional[str] = "medium"
    
    # Image handling
    has_image: bool = Field(False, alias="hasImage")
    image_url: Optional[str] = Field(None, alias="imageUrl")
    image_description: Optional[str] = Field(None, alias="imageDescription")
    
    # Answer
    answer: Optional[str] = None
    answer_explanation: Optional[str] = Field(None, alias="answerExplanation")
    
    # MCQ specific
    options: Optional[List[str]] = None
    correct_option: Optional[str] = Field(None, alias="correctOption")
    
    # Metadata
    source: str = "pyq"  # "pyq" or "generated"
    source_pdf: Optional[str] = Field(None, alias="sourcePdf")
    page_number: Optional[int] = Field(None, alias="pageNumber")


class PYQRequest(BaseModel):
    """Request for fetching practice questions"""
    model_config = ConfigDict(populate_by_name=True)
    
    topic: str
    grade: int
    subject: str = "science"
    count: int = 5  # Number of questions to return
    difficulty: Optional[str] = None
    include_generated: bool = Field(True, alias="includeGenerated")  # Allow Gemini-generated questions


class PYQResponse(BaseModel):
    """Response containing practice questions"""
    model_config = ConfigDict(populate_by_name=True)
    
    questions: List[PYQQuestion]
    total_count: int = Field(..., alias="totalCount")
    pyq_count: int = Field(..., alias="pyqCount")  # Real PYQs from PDFs
    generated_count: int = Field(..., alias="generatedCount")  # Gemini-generated
    topic: str
    grade: int
