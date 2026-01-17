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
import uvicorn

from config.settings import settings
from models.schemas import (
    ScenarioRequest, ScenarioResponse,
    ConversationRequest, ConversationResponse,
    QuizRequest, QuizResponse
)
from models.pyq_schemas import PYQRequest, PYQResponse
from rag.retriever import RAGRetriever
from rag.pdf_processor import process_ncert_directory
from agents.scenario_gen import ScenarioGenerator
from agents.conversation import ConversationGuide
from agents.pyq_generator import PYQGenerator
from agents.visual_flashcards import VisualFlashcardGenerator
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
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.BACKEND_URL,
        settings.FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:8081",
        "http://localhost:4000",
        "http://localhost:8080",
        "http://localhost:9000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
rag_retriever: Optional[RAGRetriever] = None
scenario_generator: Optional[ScenarioGenerator] = None
conversation_guide: Optional[ConversationGuide] = None
pyq_generator: Optional[PYQGenerator] = None
visual_flashcard_generator: Optional[VisualFlashcardGenerator] = None

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    global rag_retriever, scenario_generator, conversation_guide, pyq_generator, visual_flashcard_generator
    
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
        visual_flashcard_generator = VisualFlashcardGenerator(rag_retriever)  # Initialize flashcard generator
        
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


# Visual Flashcards Endpoint
@app.post("/api/visual-flashcards/generate")
async def generate_visual_flashcards(
    background_tasks: BackgroundTasks,
    grade: int,
    subject: str,
    topic: str
):
    """
    Generate visual flashcards asynchronously.
    Returns immediately, flashcards generated in background.
    """
    try:
        logger.info(f"""\n{'='*60}
🎨 VISUAL FLASHCARD GENERATION REQUEST
{'='*60}
Grade: {grade}
Subject: {subject}
Topic: {topic}
{'='*60}""")
        
        if not visual_flashcard_generator:
            logger.error("❌ Visual flashcard generator not initialized!")
            raise HTTPException(status_code=500, detail="Visual flashcard generator not initialized")
        
        # Check cache first
        cache_key = build_cache_key(
            endpoint="flashcards",
            grade=grade,
            subject=subject,
            topic=topic
        )
        
        cached_response = get_from_cache(cache_key)
        if cached_response:
            logger.info(f"✅ Returning cached flashcards: {len(cached_response['flashcards'])} cards")
            return cached_response
        
        # Generate flashcards (this will run synchronously for now)
        # In production, you might want true async/background processing
        logger.info("🔄 Starting flashcard generation...")
        
        flashcards = await visual_flashcard_generator.generate_flashcards(
            grade=grade,
            subject=subject,
            topic=topic
        )
        
        # Cache the response
        response_data = {
            "success": True,
            "flashcards": flashcards,
            "count": len(flashcards)
        }
        set_cache(cache_key, response_data)
        
        logger.info(f"✅ Successfully generated {len(flashcards)} flashcards")
        logger.info(f"""\n{'='*60}
✅ FLASHCARD GENERATION COMPLETE
{'='*60}
Count: {len(flashcards)}
Flashcards: {[f['name'] for f in flashcards]}
{'='*60}\n""")
        
        return response_data
        
    except Exception as e:
        logger.error(f"""\n{'='*60}
❌ FLASHCARD GENERATION FAILED
{'='*60}
Error: {str(e)}
Type: {type(e).__name__}
{'='*60}\n""")
        import traceback
        logger.error(f"Stack trace:\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


# Error handlers

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
