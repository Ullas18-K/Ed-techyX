from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from enum import Enum

# Enums
class TaskPhase(str, Enum):
    INSTRUCTION = "instruction"
    CHECK_QUESTION = "check_question"
    ENCOURAGEMENT = "encouragement"
    HINT = "hint"

# Request Models
class ScenarioRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    grade: int = Field(..., ge=1, le=12, description="Student grade level (1-12)")
    subject: str = Field(..., description="Subject name (science, maths, etc.)")
    topic: str = Field(..., description="Specific topic to learn")
    student_id: str = Field(..., description="Unique student identifier")
    difficulty: Optional[str] = Field("medium", description="easy, medium, hard")

class ConversationRequest(BaseModel):
    scenario_id: str
    current_task_id: int
    student_input: str
    context: Optional[Dict[str, Any]] = None
    session_history: Optional[List[str]] = []

class QuizRequest(BaseModel):
    topic: str
    grade: int
    subject: str
    count: int = Field(5, ge=1, le=10)
    difficulty: Optional[str] = "medium"

# Response Models
class LearningStep(BaseModel):
    """Individual learning step with description and completion status"""
    model_config = ConfigDict(populate_by_name=True)
    
    step_number: int = Field(..., alias="stepNumber")
    title: str
    description: str
    is_completed: bool = Field(False, alias="isCompleted")

class ConceptStep(BaseModel):
    """Key concept broken down into steps"""
    model_config = ConfigDict(populate_by_name=True)
    
    step_number: int = Field(..., alias="stepNumber")
    description: str
    details: Optional[str] = ""

class SimulationControl(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    name: str
    label: str
    min: Optional[float] = None  # For numeric controls (sliders)
    max: Optional[float] = None  # For numeric controls (sliders)
    default: Optional[Any] = None  # Can be float (for sliders) or string (for selections)
    unit: Optional[str] = ""
    step: Optional[float] = 1.0
    description: Optional[str] = ""
    effect: Optional[str] = ""
    options: Optional[List[str]] = None  # For dropdown/selection controls (e.g., reactant choices)
    control_type: Optional[str] = Field("slider", alias="controlType")  # "slider" or "dropdown"

class SimulationConfig(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    type: str  # Changed from SimulationType enum to allow any topic
    title: str
    description: str
    controls: List[SimulationControl]
    outputs: List[str]
    visualElements: List[str]
    instructions: Optional[str] = ""
    control_guide: Optional[str] = Field("", alias="controlGuide")

class Task(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    id: int
    instruction: str
    checkQuestion: str
    hint: str
    encouragement: str
    expectedAction: Optional[str] = ""

class QuizQuestion(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    question: str
    options: List[str]
    correctAnswer: str
    explanation: str

class Derivation(BaseModel):
    """Derivation or explanation for a formula/equation."""
    model_config = ConfigDict(populate_by_name=True)
    
    formula: str  # The formula being derived/explained
    derivation: str  # Step-by-step derivation or explanation

class ScenarioResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    scenario_id: str = Field(..., alias="scenarioId")
    title: str
    subject: str
    grade_level: int = Field(..., alias="gradeLevel")
    greeting: str
    
    scenario_description: str = Field(..., alias="scenarioDescription")
    key_concepts: List[ConceptStep] = Field(..., alias="keyConcepts")
    learning_objectives: List[ConceptStep] = Field(..., alias="learningObjectives")
    interaction_types: List[str] = Field(..., alias="interactionTypes")
    quiz: List[QuizQuestion]
    
    notes: Optional[str] = ""
    formulas: Optional[List[str]] = []
    formulas_and_derivations_markdown: Optional[str] = Field("", alias="formulasAndDerivationsMarkdown")
    estimated_duration: str = Field("15-20 minutes", alias="estimatedDuration")
    difficulty_level: str = Field("medium", alias="difficultyLevel")
    ncert_chapter: Optional[str] = Field("", alias="ncertChapter")
    ncert_page_refs: Optional[List[str]] = Field([], alias="ncertPageRefs")

class RAGSource(BaseModel):
    """NCERT source reference for RAG-based responses."""
    chapter: Optional[str] = ""
    page: Optional[str] = ""
    excerpt: str = ""

# class ConversationResponse(BaseModel):
#     response: str
#     action: str  # "continue", "next_task", "hint", "repeat"
#     task_complete: bool = False
#     next_task_id: Optional[int] = None

class ConversationResponse(BaseModel):
    response: str
    action: str
    task_complete: bool = False
    next_task_id: Optional[int] = None

    # --- RAG + Tutor metadata ---
    rag_used: bool = False
    rag_sources: Optional[List[RAGSource]] = None
    confidence: Optional[float] = None
    follow_up_suggestions: Optional[List[str]] = None
    
class QuizResponse(BaseModel):
    quiz_id: str
    questions: List[QuizQuestion]

# Document Processing Models
class DocumentChunk(BaseModel):
    content: str
    metadata: Dict[str, Any]
    chunk_index: int

class RAGResult(BaseModel):
    documents: List[str]
    metadatas: List[Dict[str, Any]]
    distances: List[float]
