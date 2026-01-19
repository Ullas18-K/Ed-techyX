"""
AI Service for EdTech Platform
Provides AI-powered scenario generation, conversational guidance, and RAG-based content retrieval.
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
from pathlib import Path
from typing import Optional
from datetime import datetime
import uvicorn

from config.settings import settings
from models.schemas import (
    ScenarioRequest, ScenarioResponse,
    ConversationRequest, ConversationResponse,
    QuizRequest, QuizResponse,
    UploadAndLearnResponse,
    ExamPlanRequest, ExamPlanResponse,
    LearningKitRequest, LearningKitResponse,
)
from models.pyq_schemas import PYQRequest, PYQResponse
from rag.retriever import RAGRetriever
from rag.pdf_processor import process_ncert_directory
from agents.scenario_gen import ScenarioGenerator
from agents.conversation import ConversationGuide
from agents.pyq_generator import PYQGenerator
from agents.upload_learn_agent import UploadLearnAgent
from agents.exam_planner import ExamPlannerAgent
from utils.pyq_ingestion import ingest_all_pyqs
from utils.tts_service import tts_service
from utils.ai_response_cache import build_cache_key, get_from_cache, set_cache
from fastapi.responses import FileResponse, Response
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="EdTech AI Service",
    description="AI-powered learning scenario generation and guidance",
    version="1.0.0"
)

# CORS middleware
allowed_origins = [
    settings.BACKEND_BASE_URL,
    settings.FRONTEND_BASE_URL,
    "http://localhost:5173",
    "http://localhost:8080",
    "http://localhost:8081",
    "http://localhost:9000",
]

# Add additional origins from environment variable
if settings.CORS_ORIGINS:
    allowed_origins.extend([origin.strip() for origin in settings.CORS_ORIGINS.split(',')])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
rag_retriever: Optional[RAGRetriever] = None
scenario_generator: Optional[ScenarioGenerator] = None
conversation_guide: Optional[ConversationGuide] = None
pyq_generator: Optional[PYQGenerator] = None
exam_planner: Optional[ExamPlannerAgent] = None

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    global rag_retriever, scenario_generator, conversation_guide, pyq_generator, upload_learn_agent, exam_planner
    
    logger.info("Starting AI Service...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"GCP Project: {settings.GCP_PROJECT_ID or 'Not configured'}")
    
    try:
        # Initialize RAG retriever
        rag_retriever = RAGRetriever()
        logger.info("RAG retriever initialized")
        
        # Initialize agents
        scenario_generator = ScenarioGenerator(rag_retriever)
        conversation_guide = ConversationGuide(rag_retriever)  # Pass RAG to conversation guide
        pyq_generator = PYQGenerator(rag_retriever)  # Initialize PYQ generator
        upload_learn_agent = UploadLearnAgent() # Initialize OCR agent
        conversation_guide = ConversationGuide(rag_retriever)
        pyq_generator = PYQGenerator(rag_retriever)
        exam_planner = ExamPlannerAgent(rag_retriever)
        
        logger.info("All agents initialized successfully")
        
        # Check vector store status
        stats = rag_retriever.get_stats()
        logger.info(f"Vector store stats: {stats}")
        
        if stats["total_documents"] == 0:
            logger.warning("Vector store is empty! No NCERT PDFs processed yet.")
            logger.info("To process PDFs, use: POST /admin/process-pdfs")
        
    except Exception as e:
        logger.error(f"Error during startup: {e}")
        if settings.GCP_PROJECT_ID:
            raise
        else:
            logger.warning("Continuing with mock mode (GCP not configured)")

@app.get("/")
async def root():
    """Root endpoint with service info."""
    return {
        "service": "EdTech AI Service",
        "version": "1.0.0",
        "status": "running",
        "gcp_configured": bool(settings.GCP_PROJECT_ID)
    }

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    stats = {}
    
    if rag_retriever:
        stats = rag_retriever.get_stats()
    
    return {
        "status": "healthy",
        "vector_store": stats,
        "gcp_configured": bool(settings.GCP_PROJECT_ID)
    }

@app.post("/api/scenario/generate", response_model=ScenarioResponse)
async def generate_scenario(request: ScenarioRequest):
    """
    Generate a complete learning scenario with tasks, simulation config, and quiz.
    
    Uses RAG to retrieve relevant NCERT content and Gemini to generate personalized scenario.
    """
    try:
        logger.info(f"Scenario request: Grade {request.grade}, {request.subject}, {request.topic}")
        
        if not scenario_generator:
            raise HTTPException(status_code=500, detail="Scenario generator not initialized")
        
        # Check cache first
        cache_key = build_cache_key(
            endpoint="scenario",
            grade=request.grade,
            subject=request.subject,
            topic=request.topic
        )
        
        cached_response = get_from_cache(cache_key)
        if cached_response:
            return ScenarioResponse(**cached_response)
        
        # Generate new scenario
        scenario = await scenario_generator.generate(request)
        
        # Cache the response
        set_cache(cache_key, scenario.model_dump())
        
        logger.info(f"Generated scenario: {scenario.scenario_id}")
        return scenario
        
    except Exception as e:
        logger.error(f"Error generating scenario: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/conversation/guide", response_model=ConversationResponse)
async def guide_conversation(request: ConversationRequest):
    """
    Provide conversational guidance during learning session.
    
    Analyzes student input and provides appropriate encouragement, hints, or next steps.
    """
    try:
        logger.info(f"Conversation guide: Task {request.current_task_id}, Input: '{request.student_input[:50]}...'")
        
        if not conversation_guide:
            raise HTTPException(status_code=500, detail="Conversation guide not initialized")
        
        response = await conversation_guide.guide(request)
        
        logger.info(f"Action: {response.action}, Task complete: {response.task_complete}")
        return response
        
    except Exception as e:
        logger.error(f"Error in conversation guide: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chat")
async def generic_chat(request: dict):
    """
    Generic chat endpoint for backwards compatibility.
    Redirects to appropriate specific endpoint based on context.
    
    DEPRECATED: Use specific endpoints instead:
    - /api/conversation/guide for learning guidance
    - /api/scenario/generate for scenario generation
    - /api/exam-planning/generate for exam planning
    """
    try:
        logger.warning("⚠️ /api/chat endpoint is deprecated. Please use specific endpoints.")
        
        message = request.get("message", "")
        system_prompt = request.get("systemPrompt", "")
        temperature = request.get("temperature", 0.7)
        max_tokens = request.get("maxTokens", 2000)
        
        # Use Gemini directly for generic chat
        if not message:
            raise HTTPException(status_code=400, detail="message field is required")
        
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        
        model = genai.GenerativeModel(settings.GENERATION_MODEL)
        
        full_prompt = f"{system_prompt}\n\n{message}" if system_prompt else message
        
        response = model.generate_content(
            full_prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=temperature,
                max_output_tokens=max_tokens,
            )
        )
        
        return {
            "success": True,
            "response": response.text,
            "message": response.text
        }
        
    except Exception as e:
        logger.error(f"Generic chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/rag/stats")
async def get_rag_stats():
    """Get statistics about the RAG vector store."""
    try:
        if not rag_retriever:
            return {"error": "RAG retriever not initialized"}
        
        stats = rag_retriever.get_stats()
        return stats
        
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/rag/search")
async def search_rag(query: str, grade: Optional[int] = None, subject: Optional[str] = None, top_k: int = 5):
    """
    Search the RAG vector store for relevant NCERT content.
    
    Useful for testing RAG retrieval.
    """
    try:
        if not rag_retriever:
            raise HTTPException(status_code=500, detail="RAG retriever not initialized")
        
        results = rag_retriever.retrieve(
            query=query,
            grade=grade,
            subject=subject,
            top_k=top_k
        )
        
        return {
            "query": query,
            "filters": {"grade": grade, "subject": subject},
            "results": {
                "count": len(results["documents"]),
                "documents": results["documents"],
                "metadata": results["metadatas"]
            }
        }
        
    except Exception as e:
        logger.error(f"Error searching RAG: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Admin endpoints (for managing PDFs and vector store)

@app.post("/admin/process-pdfs")
async def process_pdfs(background_tasks: BackgroundTasks, directory: str = "ncert_pdfs"):
    """
    Process NCERT PDFs from a directory and add to vector store.
    
    This is a background task that can take several minutes.
    Expected directory structure:
    ncert_pdfs/
      class_6/
        science.pdf
        maths.pdf
    """
    try:
        if not rag_retriever:
            raise HTTPException(status_code=500, detail="RAG retriever not initialized")
        
        # Check if directory exists
        pdf_dir = Path(directory)
        if not pdf_dir.exists():
            raise HTTPException(
                status_code=404,
                detail=f"Directory '{directory}' not found. Create it and add NCERT PDFs."
            )
        
        # Process in background
        background_tasks.add_task(process_pdfs_background, directory)
        
        return {
            "message": f"Processing PDFs from '{directory}' in background",
            "status": "started"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting PDF processing: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def process_pdfs_background(directory: str):
    """Background task to process PDFs."""
    try:
        logger.info(f"Starting PDF processing from {directory}")
        
        # Process all PDFs in directory
        chunks = process_ncert_directory(directory)
        
        if not chunks:
            logger.warning(f"No chunks extracted from {directory}")
            return
        
        # Add to vector store
        logger.info(f"Adding {len(chunks)} chunks to vector store...")
        if rag_retriever:
            rag_retriever.add_documents(chunks)
        
        logger.info(f"Successfully processed {len(chunks)} chunks")
        
    except Exception as e:
        logger.error(f"Error in background PDF processing: {e}")

@app.delete("/admin/clear-vector-store")
async def clear_vector_store():
    """
    Clear all documents from the vector store.
    
    USE WITH CAUTION! This deletes all processed NCERT content.
    """
    try:
        if not rag_retriever:
            raise HTTPException(status_code=500, detail="RAG retriever not initialized")
        
        rag_retriever.vector_store.delete_all()
        
        return {
            "message": "Vector store cleared successfully",
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Error clearing vector store: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================
# PYQ (Previous Year Questions) Endpoints
# =====================================================

@app.post("/api/questions/practice", response_model=PYQResponse)
async def get_practice_questions(request: PYQRequest):
    """
    Get practice questions for a topic using hybrid RAG + Gemini approach.
    
    - Retrieves real previous year questions from vector DB
    - Generates supplementary questions with Gemini if needed
    - Returns questions with images, answers, and explanations
    """
    try:
        logger.info(f"PYQ request: {request.topic} (Grade {request.grade})")
        
        if not pyq_generator:
            raise HTTPException(status_code=500, detail="PYQ generator not initialized")
        
        # Check cache first
        cache_key = build_cache_key(
            endpoint="pyq",
            grade=request.grade,
            topic=request.topic
        )
        
        cached_response = get_from_cache(cache_key)
        if cached_response:
            return PYQResponse(**cached_response)
        
        # Generate new questions
        response = await pyq_generator.get_practice_questions(request)
        
        # Cache the response
        set_cache(cache_key, response.model_dump())
        
        logger.info(f"Returning {response.total_count} questions ({response.pyq_count} PYQ, {response.generated_count} generated)")
        return response
        
    except Exception as e:
        logger.error(f"Error getting practice questions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/assets/pyqs/{file_path:path}")
async def get_pyq_image(file_path: str):
    """
    Serve PYQ images (diagrams, circuits, etc.)
    
    Example: /api/assets/pyqs/images/ray_optics_2023_p1_img0.png
    """
    try:
        # Construct full path
        full_path = os.path.join(settings.BASE_DIR, "data/pyqs", file_path)
        
        # Security check - ensure path is within pyqs directory
        if not os.path.abspath(full_path).startswith(os.path.abspath(os.path.join(settings.BASE_DIR, "data/pyqs"))):
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Check if file exists
        if not os.path.exists(full_path):
            raise HTTPException(status_code=404, detail="Image not found")
        
        # Determine media type
        if full_path.endswith('.png'):
            media_type = "image/png"
        elif full_path.endswith('.jpg') or full_path.endswith('.jpeg'):
            media_type = "image/jpeg"
        else:
            media_type = "image/png"
        
        return FileResponse(full_path, media_type=media_type)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error serving image {file_path}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/admin/ingest-pyqs")
async def ingest_pyqs(background_tasks: BackgroundTasks):
    """
    Ingest all PYQ PDFs from data/pyqs/pdfs directory.
    
    This:
    1. Extracts questions and answers from PDFs
    2. Extracts and saves images
    3. Analyzes images with Gemini Vision
    4. Stores in vector DB for retrieval
    
    Place your PDF files in: ai-service/data/pyqs/pdfs/
    """
    try:
        if not rag_retriever:
            raise HTTPException(status_code=500, detail="RAG retriever not initialized")
        
        # Check if directory exists and has PDFs
        pdf_dir = os.path.join(settings.BASE_DIR, "data/pyqs/pdfs")
        if not os.path.exists(pdf_dir):
            raise HTTPException(
                status_code=404,
                detail=f"Directory '{pdf_dir}' not found. Create it and add PYQ PDFs."
            )
        
        pdf_files = list(Path(pdf_dir).glob("*.pdf"))
        if not pdf_files:
            raise HTTPException(
                status_code=404,
                detail=f"No PDF files found in '{pdf_dir}'. Add some PYQ PDFs first."
            )
        
        # Process in background
        background_tasks.add_task(ingest_pyqs_background)
        
        return {
            "message": f"Processing {len(pdf_files)} PYQ PDFs in background",
            "status": "started",
            "pdf_count": len(pdf_files)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting PYQ ingestion: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def ingest_pyqs_background():
    """Background task to ingest PYQ PDFs."""
    try:
        logger.info("Starting PYQ ingestion...")
        results = await ingest_all_pyqs(rag_retriever)
        logger.info(f"PYQ ingestion complete: {results}")
    except Exception as e:
        logger.error(f"Error in background PYQ ingestion: {e}")


# === TEXT-TO-SPEECH ENDPOINTS ===

@app.post("/api/tts/synthesize")
async def synthesize_speech(request: dict):
    """
    Synthesize speech from text using Google Cloud TTS with Indian language support.
    
    Automatically selects Indian-accent voices for Indian languages.
    
    Request body:
    {
        "text": "Text to convert to speech",
        "language_code": "hi-IN" or "kn-IN" or "en-IN" (optional, auto-detects voice),
        "voice_name": "hi-IN-Neural2-A" (optional, auto-selected if not provided),
        "speaking_rate": 1.0 (optional),
        "pitch": 0.0 (optional)
    }
    
    Supported languages:
    - hi, hi-IN: Hindi (Indian accent)
    - kn, kn-IN: Kannada (Indian accent)
    - ml, ml-IN: Malayalam (Indian accent)
    - ta, ta-IN: Tamil (Indian accent)
    - te, te-IN: Telugu (Indian accent)
    - mr, mr-IN: Marathi (Indian accent)
    - gu, gu-IN: Gujarati (Indian accent)
    - bn, bn-IN: Bengali (Indian accent)
    - pa, pa-IN: Punjabi (Indian accent)
    - en, en-IN: English with Indian accent
    """
    try:
        text = request.get("text")
        if not text:
            raise HTTPException(status_code=400, detail="Text is required")
        
        if not isinstance(text, str):
            raise HTTPException(status_code=400, detail="Text must be a string")
        
        if len(text.strip()) == 0:
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        # Get optional parameters
        language_code = request.get("language_code", "en-IN")
        voice_name = request.get("voice_name")  # Optional - will be auto-selected
        speaking_rate = float(request.get("speaking_rate", 1.0))
        pitch = float(request.get("pitch", 0.0))
        
        # Validate parameters
        if not (0.25 <= speaking_rate <= 4.0):
            speaking_rate = 1.0
            logger.warning("Invalid speaking_rate, using default 1.0")
        
        if not (-20.0 <= pitch <= 20.0):
            pitch = 0.0
            logger.warning("Invalid pitch, using default 0.0")
        
        logger.info(f"🎤 TTS request: {text[:50]}... ({len(text)} chars, language: {language_code})")
        
        # Synthesize speech (voice_name will be auto-selected if not provided)
        audio_content = await tts_service.synthesize_speech(
            text=text,
            language_code=language_code,
            voice_name=voice_name,
            speaking_rate=speaking_rate,
            pitch=pitch
        )
        
        if not audio_content:
            raise HTTPException(status_code=500, detail="Failed to synthesize speech - no audio generated")
        
        logger.info(f"✅ TTS success: Generated {len(audio_content)} bytes of audio")
        
        # Return audio as MP3
        return Response(
            content=audio_content,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": "inline; filename=speech.mp3",
                "Cache-Control": "public, max-age=3600"
            }
        )
        
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"❌ TTS Validation Error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"❌ TTS Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Speech synthesis failed: {str(e)}")


# =====================================================
# Upload & Learn Endpoint (OCR + NCERT Answer)
# =====================================================

from fastapi import File, UploadFile

@app.post("/api/upload-and-learn", response_model=UploadAndLearnResponse)
async def upload_and_learn(image: UploadFile = File(...)):
    """
    Handle image upload, OCR extraction, and NCERT-based analysis.
    """
    try:
        if not upload_learn_agent:
            raise HTTPException(status_code=500, detail="UploadLearnAgent not initialized")
            
        # Validate format
        if not image.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
            
        # Read image bytes
        content = await image.read()
        
        logger.info(f"Received image: {image.filename} ({len(content)} bytes)")
        
        # Analyze image
        response = await upload_learn_agent.analyze_image(content)
        
        return response
        
    except Exception as e:
        logger.error(f"Error in upload-and-learn endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Error handlers
# ============================================================================
# EXAM PLANNING ENDPOINTS
# ============================================================================

@app.post("/api/exam-planning/generate", response_model=ExamPlanResponse)
async def generate_exam_plan(request: ExamPlanRequest):
    """
    Generate AI-powered exam study plan using RAG + Gemini.
    
    Uses cached responses when available (persistent across restarts).
    Generates dynamic plans based on NCERT content, exam patterns, and user inputs.
    """
    try:
        logger.info(f"""\n{'='*60}
📚 EXAM PLAN GENERATION REQUEST
{'='*60}
Exam Date: {request.exam_date}
Grade: {request.grade} | Board: {request.exam_board}
Subjects: {', '.join(request.subjects)}
Topics: {len(request.topics)} topics
Daily Hours: {request.daily_study_hours}
{'='*60}\n""")
        
        if not exam_planner:
            logger.error("❌ Exam planner not initialized!")
            raise HTTPException(status_code=500, detail="Exam planner not initialized")
        
        # Check cache first - build key with all parameters
        subjects_str = ','.join(sorted(request.subjects))
        topics_str = ','.join(sorted(request.topics))
        extra_params = f"{request.exam_date}_{request.exam_board}_{subjects_str}_{topics_str}_{request.daily_study_hours}"
        
        cache_key = build_cache_key(
            endpoint="exam_plan",
            grade=request.grade,
            subject=subjects_str[:50],  # Truncate for key
            topic=topics_str[:50],  # Truncate for key
            extra=extra_params
        )
        
        cached_response = get_from_cache(cache_key)
        if cached_response:
            logger.info(f"⚡ CACHE HIT - Returning cached exam plan ({cached_response['metadata']['totalChapters']} chapters)")
            return cached_response
        
        logger.info("🔄 Cache miss - Generating new exam plan...")
        
        # Analyze time allocation
        time_analysis = exam_planner.analyze_time_allocation(
            request.exam_date,
            request.current_date or datetime.now().isoformat()
        )
        
        logger.info(f"⏰ Time Analysis: {time_analysis['totalDays']} days ({time_analysis['studyDays']} study + {time_analysis['revisionDays']} revision)")
        
        # Prioritize chapters
        chapter_priorities = exam_planner.prioritize_chapters(
            request.subjects,
            request.topics,
            request.grade
        )
        
        logger.info(f"📊 Prioritized {len(chapter_priorities)} chapters")
        
        # Generate daily plans
        daily_plans = await exam_planner.generate_daily_plans(
            time_analysis=time_analysis,
            chapter_priorities=chapter_priorities,
            subjects=request.subjects,
            topics=request.topics,
            daily_study_hours=request.daily_study_hours,
            grade=request.grade,
            exam_board=request.exam_board
        )
        
        logger.info(f"✅ Generated {len(daily_plans)} daily plans")
        
        # Build response
        response_data = {
            "time_analysis": time_analysis,
            "chapter_priorities": chapter_priorities,
            "daily_plans": daily_plans,
            "metadata": {
                "totalChapters": len(chapter_priorities),
                "totalTopics": len(request.topics),
                "estimatedTotalHours": time_analysis["studyDays"] * request.daily_study_hours
            }
        }
        
        # Cache the response
        set_cache(cache_key, response_data)
        
        logger.info(f"""\n{'='*60}
✅ EXAM PLAN GENERATION COMPLETE
{'='*60}
Days: {time_analysis['totalDays']} | Chapters: {len(chapter_priorities)}
{'='*60}\n""")
        
        return response_data
        
    except ValueError as e:
        logger.error(f"❌ Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"""\n{'='*60}
❌ EXAM PLAN GENERATION FAILED
{'='*60}
Error: {str(e)}
Type: {type(e).__name__}
{'='*60}\n""")
        import traceback
        logger.error(f"Stack trace:\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/exam-planning/learning-kit", response_model=LearningKitResponse)
async def generate_learning_kit(request: LearningKitRequest):
    """
    Generate comprehensive learning kit for a specific day using RAG + Gemini.
    
    Includes: notes, derivations, formulas, PYQs, tips, and common mistakes.
    Uses NCERT PDF content through RAG system.
    """
    try:
        logger.info(f"""\n{'='*60}
📖 LEARNING KIT GENERATION REQUEST
{'='*60}
Day: {request.day} | Grade: {request.grade} | Board: {request.exam_board}
Subjects: {', '.join([s['name'] for s in request.subjects])}
{'='*60}\n""")
        
        if not exam_planner:
            logger.error("❌ Exam planner not initialized!")
            raise HTTPException(status_code=500, detail="Exam planner not initialized")
        
        # Build cache key
        subjects_info = ','.join([f"{s['name']}:{','.join(s['chapters'])}" for s in request.subjects])
        extra_params = f"day{request.day}_{request.exam_board}_{subjects_info}"
        
        cache_key = build_cache_key(
            endpoint="learning_kit",
            grade=request.grade,
            subject=request.subjects[0]['name'] if request.subjects else 'general',
            topic=subjects_info[:50],
            extra=extra_params
        )
        
        cached_response = get_from_cache(cache_key)
        if cached_response:
            logger.info(f"⚡ CACHE HIT - Returning cached learning kit (Day {request.day})")
            return cached_response
        
        logger.info("🔄 Cache miss - Generating new learning kit...")
        
        # Generate learning kit
        learning_kit = await exam_planner.generate_learning_kit(
            day=request.day,
            subjects=request.subjects,
            grade=request.grade,
            exam_board=request.exam_board
        )
        
        # Ensure commonMistakes field exists (for alias)
        if 'commonMistakes' not in learning_kit:
            learning_kit['commonMistakes'] = learning_kit.get('common_mistakes', [])
        
        # Cache the response
        set_cache(cache_key, learning_kit)
        
        logger.info(f"""\n{'='*60}
✅ LEARNING KIT GENERATION COMPLETE
{'='*60}
Day: {request.day}
Derivations: {len(learning_kit.get('derivations', []))}
Formulas: {len(learning_kit.get('formulas', []))}
PYQs: {len(learning_kit.get('pyqs', []))}
Tips: {len(learning_kit.get('tips', []))}
{'='*60}\n""")
        
        return learning_kit
        
    except Exception as e:
        logger.error(f"""\n{'='*60}
❌ LEARNING KIT GENERATION FAILED
{'='*60}
Error: {str(e)}
Type: {type(e).__name__}
{'='*60}\n""")
        import traceback
        logger.error(f"Stack trace:\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler."""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)}
    )

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.ENVIRONMENT == "development",
        log_level="info"
    )
