"""
PYQ Generator - Retrieves PYQs from RAG and generates supplementary questions with Gemini
"""
import os
import logging
from typing import List, Dict, Any, Optional
import json
import vertexai
from vertexai.preview.generative_models import GenerativeModel
from google.oauth2 import service_account

from config.settings import settings
from models.pyq_schemas import PYQQuestion, PYQRequest, PYQResponse
from rag.retriever import RAGRetriever

logger = logging.getLogger(__name__)

# Simple in-memory cache for generated questions (per topic)
QUESTION_CACHE: Dict[str, List[PYQQuestion]] = {}


class PYQGenerator:
    """Generate and retrieve practice questions using RAG + Gemini hybrid approach"""
    
    def __init__(self, rag_retriever: RAGRetriever):
        self.rag_retriever = rag_retriever
        self.model = None
        
        # Initialize Gemini model
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
                    self.model = GenerativeModel(settings.GENERATION_MODEL)
                    logger.info("✅ PYQ Generator initialized with Gemini")
                else:
                    logger.error(f"Credentials file not found: {settings.GOOGLE_APPLICATION_CREDENTIALS}")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini for PYQ generation: {e}")
    
    async def get_practice_questions(self, request: PYQRequest) -> PYQResponse:
        """
        Get practice questions using hybrid approach:
        1. Retrieve from RAG (real PYQs)
        2. If <5 questions, generate supplementary questions with Gemini
        3. Return combined results
        """
        logger.info(f"📝 Fetching practice questions: {request.topic} (Grade {request.grade})")
        
        # Step 1: Retrieve from RAG
        pyq_questions = await self._retrieve_from_rag(request)
        pyq_count = len(pyq_questions)
        
        logger.info(f"📚 Retrieved {pyq_count} questions from RAG")
        
        # Step 2: Generate additional questions if needed
        generated_questions = []
        if request.include_generated and pyq_count < request.count:
            needed = request.count - pyq_count
            logger.info(f"🤖 Generating {needed} additional questions with Gemini")
            
            # Check cache first
            cache_key = f"{request.topic}_{request.grade}_{request.subject}"
            if cache_key in QUESTION_CACHE:
                logger.info(f"✅ Using cached generated questions for {cache_key}")
                generated_questions = QUESTION_CACHE[cache_key][:needed]
            else:
                generated_questions = await self._generate_questions_with_gemini(
                    topic=request.topic,
                    grade=request.grade,
                    subject=request.subject,
                    count=needed,
                    difficulty=request.difficulty
                )
                # Cache for future use
                QUESTION_CACHE[cache_key] = generated_questions
        
        # Step 3: Combine results
        all_questions = pyq_questions + generated_questions
        
        return PYQResponse(
            questions=all_questions[:request.count],
            totalCount=len(all_questions),
            pyqCount=pyq_count,
            generatedCount=len(generated_questions),
            topic=request.topic,
            grade=request.grade
        )
    
    async def _retrieve_from_rag(self, request: PYQRequest) -> List[PYQQuestion]:
        """Retrieve PYQs from vector DB"""
        try:
            # Query RAG with type filter for PYQs specifically
            logger.info(f"🔍 Searching for PYQs: topic={request.topic}, grade={request.grade}, type=pyq")
            
            results = self.rag_retriever.retrieve(
                query=f"previous year question {request.topic}",
                grade=request.grade,
                subject=None,
                doc_type="pyq",  # Filter for PYQ documents only
                top_k=request.count * 2  # Request more to account for filtering
            )
            
            logger.info(f"📊 RAG returned {len(results.get('documents', []))} total documents")
            
            # Log metadata to debug
            if results.get('metadatas'):
                sample_meta = results['metadatas'][0] if len(results['metadatas']) > 0 else {}
                logger.info(f"📋 Sample metadata: {sample_meta}")
            
            # Convert to PYQQuestion objects
            # RAG returns: {'documents': [text1, text2...], 'metadatas': [meta1, meta2...]}
            questions = []
            documents = results.get('documents', [])
            metadatas = results.get('metadatas', [])
            
            for idx, (content, metadata) in enumerate(zip(documents, metadatas)):
                # Metadata should already have doc_type='pyq' from filter, but double check
                if metadata.get('doc_type') != 'pyq':  # Changed from 'type' to 'doc_type'
                    logger.warning(f"⚠️ Skipping non-PYQ document at index {idx}")
                    continue
                
                # Extract question text from content (content is a string)
                question_text = self._extract_question_from_content(content)
                answer = self._extract_answer_from_content(content)
                
                # Parse year properly (handle string years like "All India 2014")
                year_value = self._parse_year(metadata.get('year'))
                
                # Build image URL if image exists
                image_url = None
                image_description = None
                if metadata.get('has_image') and metadata.get('image_path'):
                    image_url = f"/api/assets/pyqs/{metadata['image_path']}"
                    image_description = self._extract_image_analysis_from_content(content)
                
                # Create PYQQuestion object
                question = PYQQuestion(
                    questionId=f"pyq_{request.topic}_{idx}_{year_value or 'unknown'}",
                    questionText=question_text,
                    topic=request.topic,
                    subject=request.subject,
                    grade=request.grade,
                    year=year_value,
                    difficulty=request.difficulty or "medium",
                    hasImage=metadata.get('has_image', False),
                    imageUrl=image_url,
                    imageDescription=image_description,
                    answer=answer,
                    answerExplanation=answer,  # For PYQs, answer and explanation are same
                    correctOption=None,
                    source="pyq",
                    sourcePdf=metadata.get('source_pdf'),
                    pageNumber=metadata.get('page_number')
                )
                
                questions.append(question)
            
            # Enhance PYQ answers with Gemini if we have questions
            if questions and self.model:
                logger.info(f"🤖 Enhancing {len(questions)} PYQ answers with Gemini...")
                questions = await self._enhance_pyq_answers(questions)
            
            return questions
            
        except Exception as e:
            logger.error(f"Error retrieving PYQs from RAG: {e}")
            return []
    
    async def _generate_questions_with_gemini(
        self,
        topic: str,
        grade: int,
        subject: str,
        count: int,
        difficulty: Optional[str] = None
    ) -> List[PYQQuestion]:
        """Generate practice questions using Gemini"""
        
        if not self.model:
            logger.warning("Gemini model not available for question generation")
            return []
        
        try:
            # Get NCERT context for topic
            ncert_context = self.rag_retriever.get_context_string(
                query=f"{topic} concept explanation examples",
                grade=grade,
                subject=None,
                top_k=3
            )
            
            # Create generation prompt
            prompt = f"""You are an expert NCERT science teacher creating practice questions for Grade {grade} students.

TOPIC: {topic}
SUBJECT: {subject}
DIFFICULTY: {difficulty or 'medium'}

NCERT CONTEXT:
{ncert_context[:1500]}

Generate {count} practice questions based on NCERT curriculum for {topic}.

REQUIREMENTS:
1. Questions must be based on NCERT concepts and terminology
2. Include a mix of:
   - Short answer questions (2-3 marks)
   - Long answer questions (5 marks)
   - Application-based questions
3. Each question must have a clear, educational answer
4. Focus on conceptual understanding, not rote memorization
5. Use proper scientific terminology
6. FORMATTING: Use Markdown significantly:
   - Use **bold** for key scientific terms and concepts.
   - Use *italics* for emphasis.
   - Use `code blocks` for formulas if applicable.
   - For complex answers, use a **Step-by-step Explanation** structure inside the answer field.
   - Use bullet points or numbered lists where appropriate for clarity.

OUTPUT FORMAT (valid JSON array):
[
  {{
    "questionText": "Clear, specific question about {topic}",
    "answer": "Detailed answer with Markdown formatting. Use a step-by-step structure for explanations (e.g., Step 1: ..., Step 2: ...).",
    "difficulty": "easy/medium/hard",
    "marks": 2 or 3 or 5
  }}
]

Generate ONLY the JSON array, no extra text."""

            # Call Gemini
            response = self.model.generate_content(
                prompt,
                generation_config={
                    "temperature": 0.8,
                    "max_output_tokens": 4096,
                }
            )
            
            # Parse response (type: ignore for Vertex AI response objects)
            response_text = ""
            try:
                response_text = response.text.strip()  # type: ignore
            except (AttributeError, TypeError):
                response_text = str(response).strip()
            
            # Clean JSON
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()
            
            # Remove any text before first [ or {
            start_idx = min(
                response_text.find('[') if '[' in response_text else len(response_text),
                response_text.find('{') if '{' in response_text else len(response_text)
            )
            if start_idx > 0:
                response_text = response_text[start_idx:]
            
            # Find the last ] or }
            end_idx = max(
                response_text.rfind(']') if ']' in response_text else -1,
                response_text.rfind('}') if '}' in response_text else -1
            )
            if end_idx > 0:
                response_text = response_text[:end_idx + 1]
            
            # Log cleaned JSON for debugging
            logger.debug(f"Cleaned JSON (first 500 chars): {response_text[:500]}")
            
            # Parse JSON
            try:
                questions_data = json.loads(response_text)
            except json.JSONDecodeError as parse_error:
                logger.error(f"JSON Parse Error: {parse_error}")
                logger.error(f"Failed JSON (first 1000 chars): {response_text[:1000]}")
                return []
            
            # Convert to PYQQuestion objects
            questions = []
            for idx, q_data in enumerate(questions_data[:count]):
                question = PYQQuestion(
                    questionId=f"gen_{topic}_{grade}_{idx}",
                    questionText=q_data['questionText'],
                    topic=topic,
                    subject=subject,
                    grade=grade,
                    difficulty=q_data.get('difficulty', difficulty or 'medium'),
                    hasImage=False,
                    imageUrl=None,
                    imageDescription=None,
                    answer=q_data['answer'],
                    answerExplanation=q_data['answer'],
                    correctOption=None,
                    source="generated",
                    sourcePdf=None,
                    pageNumber=None
                )
                questions.append(question)
            
            logger.info(f"✅ Generated {len(questions)} questions with Gemini")
            return questions
            
        except Exception as e:
            logger.error(f"Error generating questions with Gemini: {e}")
            logger.exception("Full traceback:")
            return []
    
    def _extract_question_from_content(self, content: str) -> str:
        """Extract question text from stored document content"""
        if "QUESTION:" in content:
            parts = content.split("QUESTION:")
            if len(parts) > 1:
                question_part = parts[1].split("\n\n")[0]
                return question_part.strip()
        return content[:300]  # Fallback
    
    def _extract_answer_from_content(self, content: str) -> Optional[str]:
        """Extract answer from stored document content"""
        if "ANSWER:" in content:
            parts = content.split("ANSWER:")
            if len(parts) > 1:
                answer_part = parts[1].strip()
                # Remove trailing markers
                answer_part = answer_part.split("IMAGE:")[0]
                answer_part = answer_part.split("DIAGRAM ANALYSIS:")[0]
                return answer_part.strip()
        return None
    
    def _extract_image_analysis_from_content(self, content: str) -> Optional[str]:
        """Extract image analysis from stored document content"""
        if "DIAGRAM ANALYSIS:" in content:
            parts = content.split("DIAGRAM ANALYSIS:")
            if len(parts) > 1:
                analysis = parts[1].strip()
                # Remove trailing markers
                analysis = analysis.split("ANSWER:")[0]
                return analysis.strip()
        return None
    
    def _parse_year(self, year_value) -> Optional[int]:
        """Parse year from various formats (string or int)"""
        if year_value is None:
            return None
        
        # Already an int
        if isinstance(year_value, int):
            return year_value if year_value > 1900 else None
        
        # String value - extract 4-digit year
        if isinstance(year_value, str):
            import re
            # Look for 4-digit year (1900-2099)
            match = re.search(r'\b(19|20)\d{2}\b', year_value)
            if match:
                return int(match.group(0))
        
        return None
    
    async def _enhance_pyq_answers(self, questions: List[PYQQuestion]) -> List[PYQQuestion]:
        """Use Gemini to reframe questions and generate comprehensive answers"""
        if not self.model:
            logger.warning("⚠️ Gemini model not available, skipping answer enhancement")
            return questions
        
        enhanced_questions = []
        
        for question in questions:
            try:
                # First, reframe the question if it's messy from RAG
                raw_question = question.questionText
                
                # Create prompt to clean and enhance the PYQ
                prompt = f"""TASK: Extract and reframe a clean Previous Year Question, then provide a comprehensive NCERT-aligned answer.

RAW TEXT FROM PDF (may be incomplete or messy):
{raw_question[:500]}

{f'ADDITIONAL CONTEXT: {question.answer[:300]}' if question.answer else ''}

SUBJECT: {question.subject}
GRADE: Grade {question.grade}
TOPIC: {question.topic}
{f'YEAR: {question.year}' if question.year else ''}

CRITICAL OUTPUT RULES:
1. NO greetings, NO "Of course!", NO conversational intro
2. Start DIRECTLY with the cleaned question
3. Use ONLY structured format below
4. Use Markdown for formatting

OUTPUT FORMAT:

QUESTION: [Extract and reframe the question as a clear, complete exam question. If the raw text is incomplete, infer the full question based on context.]

ANSWER:
[Provide a comprehensive answer in 3-5 paragraphs. Use **bold** for key terms, *italics* for emphasis. NO conversational intro.]

EXPLANATION:
**Step 1: [Concept Name]**
[Explain the concept]

**Step 2: [Key Point]**
[Detailed explanation]

**Step 3: [Application]**
[How it applies]

{f'**Diagram Reference:** {question.imageDescription}' if question.imageDescription else ''}

**Key Formulas/Points:**
- [Formula 1 or key point]
- [Formula 2 or key point]

START YOUR RESPONSE DIRECTLY WITH "QUESTION:" - NO INTRO TEXT.

                # Call Gemini
                response = self.model.generate_content(
                    prompt,
                    generation_config={
                        "temperature": 0.7,
                        "max_output_tokens": 2048,
                    }
                )
                
                # Parse response - handle multiple parts
                response_text = ""
                try:
                    if hasattr(response, 'text') and response.text:
                        response_text = response.text.strip()
                    elif hasattr(response, 'candidates') and response.candidates:
                        candidate = response.candidates[0]
                        if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                            parts = candidate.content.parts
                            text_parts = [part.text for part in parts if hasattr(part, 'text')]
                            response_text = ''.join(text_parts).strip()
                except (AttributeError, TypeError) as e:
                    logger.error(f"Error extracting text: {e}")
                    response_text = str(response).strip()
                
                if not response_text:
                    logger.warning(f"Empty response for question: {raw_question[:50]}")
                    enhanced_questions.append(question)
                    continue
                
                # Clean up any conversational intros that slip through
                intro_phrases = ["Of course!", "Here is", "Here are", "Sure!", "Certainly!"]
                for phrase in intro_phrases:
                    if response_text.startswith(phrase):
                        # Find QUESTION: marker and start from there
                        question_idx = response_text.find('QUESTION:')
                        if question_idx > 0:
                            response_text = response_text[question_idx:]
                        break
                
                # Extract question, answer, and explanation
                cleaned_question = question.questionText
                enhanced_answer = None
                enhanced_explanation = None
                
                if "QUESTION:" in response_text:
                    parts = response_text.split("ANSWER:")
                    question_part = parts[0].replace("QUESTION:", "").strip()
                    if question_part:
                        cleaned_question = question_part
                    
                    if len(parts) > 1:
                        answer_parts = parts[1].split("EXPLANATION:")
                        enhanced_answer = answer_parts[0].strip()
                        
                        if len(answer_parts) > 1:
                            enhanced_explanation = answer_parts[1].strip()
                        else:
                            enhanced_explanation = enhanced_answer
                else:
                    # Fallback if format not followed
                    enhanced_answer = response_text
                    enhanced_explanation = response_text
                
                # Update question with cleaned data
                question.questionText = cleaned_question
                question.answer = enhanced_answer or question.answer
                question.answerExplanation = enhanced_explanation or enhanced_answer or question.answer
                
                logger.debug(f"✅ Enhanced PYQ: {cleaned_question[:60]}...")
                
            except Exception as e:
                logger.error(f"Error enhancing PYQ: {e}")
                # Keep original question if enhancement fails
            
            enhanced_questions.append(question)
        
        logger.info(f"✅ Enhanced {len(enhanced_questions)} PYQ questions and answers")
        return enhanced_questions
