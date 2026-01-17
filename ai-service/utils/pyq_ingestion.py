"""
PDF ingestion utility for PYQs with image extraction and Gemini Vision analysis
"""
import os
import logging
import json
import re
from pathlib import Path
from typing import List, Dict, Any, Optional
import PyPDF2
from PIL import Image
import io
import base64
import hashlib

import vertexai
from vertexai.preview.generative_models import GenerativeModel, Part
from google.oauth2 import service_account

from config.settings import settings
from rag.retriever import RAGRetriever

logger = logging.getLogger(__name__)


class PYQIngestion:
    """Ingest PYQ PDFs with image extraction and Gemini Vision analysis"""
    
    def __init__(self, rag_retriever: RAGRetriever):
        self.rag_retriever = rag_retriever
        self.vision_model = None
        self.model = None  # Text model for question extraction
        
        # Initialize Gemini Vision model
        if settings.GCP_PROJECT_ID and settings.GOOGLE_APPLICATION_CREDENTIALS:
            try:
                if os.path.exists(settings.GOOGLE_APPLICATION_CREDENTIALS):
                    credentials = service_account.Credentials.from_service_account_file(
                        settings.GOOGLE_APPLICATION_CREDENTIALS
                    )
                    
                    vertexai.init(
                        project=settings.GCP_PROJECT_ID,
                        location=settings.GCP_LOCATION,
                        credentials=credentials
                    )
                    # Vision model for image analysis
                    self.vision_model = GenerativeModel("gemini-2.0-flash-exp")
                    # Text model for question extraction
                    self.model = GenerativeModel(settings.GENERATION_MODEL)
                    logger.info("✅ Gemini Vision and Text models initialized for PYQ ingestion")
                else:
                    logger.error(f"Credentials file not found: {settings.GOOGLE_APPLICATION_CREDENTIALS}")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini models: {e}")
    
    async def ingest_pdf(self, pdf_path: str, subject: str = "science", grade: int = 10) -> Dict[str, Any]:
        """
        Ingest a PYQ PDF, extract text, images, and analyze with Gemini Vision.
        
        Args:
            pdf_path: Path to PDF file
            subject: Subject name
            grade: Grade level
            
        Returns:
            Dict with ingestion statistics
        """
        logger.info(f"📚 Starting ingestion of: {pdf_path}")
        
        pdf_filename = Path(pdf_path).stem
        year = self._extract_year(pdf_filename)
        
        questions_ingested = 0
        images_extracted = 0
        
        try:
            # Open PDF
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                total_pages = len(pdf_reader.pages)
                logger.info(f"📄 PDF has {total_pages} pages")
                
                # Process each page
                for page_num in range(total_pages):
                    page = pdf_reader.pages[page_num]
                    
                    # Extract text
                    text = page.extract_text()
                    
                    if not text or len(text.strip()) < 20:
                        logger.debug(f"Skipping page {page_num + 1} - insufficient text")
                        continue
                    
                    # Split text into questions (simple heuristic)
                    questions = self._split_into_questions(text)
                    
                    # Try to extract images from page
                    images = self._extract_images_from_page(page, page_num, pdf_filename)
                    images_extracted += len(images)
                    
                    # Process each question
                    for q_idx, question_data in enumerate(questions):
                        # Check if this question has associated image
                        image_info = None
                        if images and q_idx < len(images):
                            image_info = images[q_idx]
                            
                            # Analyze image with Gemini Vision
                            if self.vision_model:
                                image_analysis = await self._analyze_image_with_gemini(
                                    image_info['path'],
                                    question_data['text']
                                )
                                image_info['analysis'] = image_analysis
                        
                        # Create document for vector DB
                        doc_content = self._create_document_content(
                            question_data,
                            image_info,
                            subject,
                            grade,
                            year,
                            pdf_filename,
                            page_num
                        )
                        
                        # Store in vector DB (ChromaDB doesn't accept None in metadata)
                        # Use year from question data if available, otherwise from filename
                        question_year = question_data.get('year') or year or 0
                        
                        metadata = {
                            "type": "pyq",
                            "subject": subject,
                            "grade": grade,
                            "year": question_year,
                            "topic": question_data.get('topic', 'general'),
                            "source_pdf": pdf_filename,
                            "page_number": page_num + 1,
                            "has_image": bool(image_info),
                            "question_text": question_data['text'][:200]  # Preview
                        }
                        
                        # Only add optional fields if they have values (not None)
                        if image_info:
                            metadata["image_path"] = image_info['relative_path']
                        
                        if question_data.get('answer'):
                            metadata["answer"] = question_data['answer'][:200]
                        
                        self.rag_retriever.add_documents(
                            chunks=[{
                                "content": doc_content,
                                "metadata": metadata
                            }]
                        )
                        
                        questions_ingested += 1
                        logger.debug(f"✅ Ingested question {questions_ingested} from page {page_num + 1}")
            
            logger.info(f"🎉 Ingestion complete: {questions_ingested} questions, {images_extracted} images from {pdf_filename}")
            
            return {
                "success": True,
                "pdf": pdf_filename,
                "questions_ingested": questions_ingested,
                "images_extracted": images_extracted,
                "pages_processed": total_pages
            }
            
        except Exception as e:
            logger.error(f"❌ Error ingesting PDF {pdf_path}: {str(e)}")
            logger.exception("Full traceback:")
            return {
                "success": False,
                "error": str(e),
                "pdf": pdf_filename
            }
    
    def _extract_year(self, filename: str) -> Optional[int]:
        """Extract year from filename (e.g., 'pyq_2023.pdf' -> 2023)"""
        match = re.search(r'20\d{2}', filename)
        return int(match.group()) if match else None
    
    def _split_into_questions(self, text: str) -> List[Dict[str, Any]]:
        """
        Use Gemini to intelligently extract questions from page text.
        This handles complex formatting better than regex.
        """
        if not self.model or not text or len(text.strip()) < 30:
            return []
        
        try:
            prompt = f"""Extract all questions from this text. This is from a Previous Year Question (PYQ) paper.

TEXT:
{text[:3000]}

Extract each complete question with its answer. Return ONLY a JSON array with this format:
[
  {{
    "text": "Full question text including all parts",
    "answer": "Answer if provided, or null",
    "topic": "Main topic of the question (e.g., 'photosynthesis', 'mirrors', 'electricity')",
    "year": Extract year if mentioned (e.g., CBSE 2011), or null
  }}
]

RULES:
1. Extract COMPLETE questions - don't cut off mid-sentence
2. Include question number and all parts (a, b, c, etc.)
3. Extract answer if present (look for "Ans:", "Answer:", "Solution:")
4. Identify the main topic/concept being tested
5. Extract year markers like [CBSE 2011], [2012], etc.
6. Skip page headers, footers, and irrelevant text
7. Return ONLY valid JSON, no extra text

Return empty array [] if no questions found."""

            response = self.model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Clean JSON
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()
            
            # Parse JSON
            questions = json.loads(response_text)
            
            logger.info(f"✅ Gemini extracted {len(questions)} questions from page")
            return questions
            
        except Exception as e:
            logger.error(f"Error extracting questions with Gemini: {e}")
            # Fallback to simple split
            return self._simple_split_fallback(text)
    
    def _simple_split_fallback(self, text: str) -> List[Dict[str, Any]]:
        """Simple fallback if Gemini extraction fails"""
    def _simple_split_fallback(self, text: str) -> List[Dict[str, Any]]:
        """Simple fallback if Gemini extraction fails"""
        questions = []
        
        # Common question patterns
        patterns = [
            r'Q\s*\d+\.?\s*',  # Q1. or Q 1
            r'Question\s+\d+\.?\s*',  # Question 1.
            r'^\d+\.?\s+',  # 1. (at line start)
        ]
        
        # Try to split by patterns
        lines = text.split('\n')
        current_question = {'text': '', 'answer': ''}
        in_answer = False
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Check if line starts a new question
            is_new_question = any(re.match(pattern, line, re.IGNORECASE) for pattern in patterns)
            
            if is_new_question:
                # Save previous question
                if current_question['text']:
                    questions.append(current_question)
                
                # Start new question
                current_question = {'text': line, 'answer': ''}
                in_answer = False
            
            # Check if answer section starts
            elif re.search(r'answer|solution|ans', line, re.IGNORECASE) and len(line) < 30:
                in_answer = True
            
            # Append to current question or answer
            elif current_question['text']:
                if in_answer:
                    current_question['answer'] += ' ' + line
                else:
                    current_question['text'] += ' ' + line
        
        # Add last question
        if current_question['text']:
            questions.append(current_question)
        
        # Clean up
        for q in questions:
            q['text'] = q['text'].strip()
            q['answer'] = q['answer'].strip() if q['answer'] else None
        
        logger.debug(f"Split text into {len(questions)} questions")
        return questions
    
    def _extract_images_from_page(
        self, 
        page: PyPDF2.PageObject, 
        page_num: int, 
        pdf_filename: str
    ) -> List[Dict[str, str]]:
        """Extract images from PDF page and save to disk"""
        images = []
        
        try:
            if '/XObject' in page['/Resources']:
                xObject = page['/Resources']['/XObject'].get_object()
                
                for obj_idx, obj in enumerate(xObject):
                    if xObject[obj]['/Subtype'] == '/Image':
                        try:
                            # Extract image data
                            size = (xObject[obj]['/Width'], xObject[obj]['/Height'])
                            data = xObject[obj].get_data()
                            
                            # Generate unique filename
                            image_hash = hashlib.md5(data).hexdigest()[:8]
                            image_filename = f"{pdf_filename}_p{page_num + 1}_img{obj_idx}_{image_hash}.png"
                            
                            # Full path
                            image_path = os.path.join(
                                settings.BASE_DIR,
                                "data/pyqs/images",
                                image_filename
                            )
                            
                            # Save image
                            image = Image.frombytes('RGB', size, data)
                            image.save(image_path, 'PNG')
                            
                            images.append({
                                'path': image_path,
                                'relative_path': f"images/{image_filename}",
                                'filename': image_filename
                            })
                            
                            logger.debug(f"📸 Extracted image: {image_filename}")
                            
                        except Exception as e:
                            logger.warning(f"Failed to extract image {obj_idx} from page {page_num + 1}: {e}")
        
        except Exception as e:
            logger.debug(f"No images on page {page_num + 1}: {e}")
        
        return images
    
    async def _analyze_image_with_gemini(self, image_path: str, question_text: str) -> str:
        """Use Gemini Vision to analyze diagram/image"""
        if not self.vision_model:
            return "Image analysis not available"
        
        try:
            logger.info(f"🔍 Analyzing image with Gemini Vision: {Path(image_path).name}")
            
            # Read image
            with open(image_path, 'rb') as img_file:
                image_bytes = img_file.read()
            
            # Create image part
            image_part = Part.from_data(image_bytes, mime_type="image/png")
            
            # Analysis prompt
            prompt = f"""Analyze this educational diagram/image for a science question.

Question context: {question_text[:200]}

Provide a detailed description including:
1. What type of diagram is this (circuit, ray diagram, graph, biological structure, etc.)?
2. What are the key labeled elements or components?
3. What physical process or concept is being illustrated?
4. What should a student observe or calculate from this diagram?
5. Any important measurements, angles, values, or relationships shown?

Be specific and educational. This description will help students understand the diagram."""
            
            # Call Gemini Vision
            response = self.vision_model.generate_content([prompt, image_part])
            
            analysis = response.text.strip()
            logger.info(f"✅ Image analyzed: {len(analysis)} characters")
            
            return analysis
            
        except Exception as e:
            logger.error(f"Error analyzing image with Gemini Vision: {e}")
            return f"Image present (analysis failed: {str(e)})"
    
    def _create_document_content(
        self,
        question_data: Dict[str, Any],
        image_info: Optional[Dict[str, str]],
        subject: str,
        grade: int,
        year: Optional[int],
        pdf_filename: str,
        page_num: int
    ) -> str:
        """Create formatted content for vector DB storage"""
        
        content_parts = [
            f"SUBJECT: {subject}",
            f"GRADE: {grade}",
            f"YEAR: {year if year else 'Unknown'}",
            f"SOURCE: {pdf_filename} (Page {page_num + 1})",
            "",
            f"QUESTION:",
            question_data['text'],
            ""
        ]
        
        # Add image information
        if image_info:
            content_parts.extend([
                f"IMAGE: {image_info['filename']}",
                "",
                "DIAGRAM ANALYSIS:",
                image_info.get('analysis', 'Image present'),
                ""
            ])
        
        # Add answer if available
        if question_data.get('answer'):
            content_parts.extend([
                "ANSWER:",
                question_data['answer'],
                ""
            ])
        
        return '\n'.join(content_parts)


async def ingest_all_pyqs(rag_retriever: RAGRetriever, pyq_dir: str = None):
    """
    Utility function to ingest all PDFs in the PYQ directory.
    
    Usage:
        from utils.pyq_ingestion import ingest_all_pyqs
        await ingest_all_pyqs(rag_retriever)
    """
    if pyq_dir is None:
        pyq_dir = os.path.join(settings.BASE_DIR, "data/pyqs/pdfs")
    
    ingester = PYQIngestion(rag_retriever)
    
    pdf_files = list(Path(pyq_dir).glob("*.pdf"))
    logger.info(f"📚 Found {len(pdf_files)} PDF files to ingest")
    
    results = []
    for pdf_file in pdf_files:
        result = await ingester.ingest_pdf(str(pdf_file))
        results.append(result)
    
    # Summary
    total_questions = sum(r.get('questions_ingested', 0) for r in results)
    total_images = sum(r.get('images_extracted', 0) for r in results)
    
    logger.info(f"🎉 INGESTION COMPLETE: {total_questions} questions, {total_images} images from {len(pdf_files)} PDFs")
    
    return results
