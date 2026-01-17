import logging
import os
import json
from typing import Dict, Any, List, Optional
import vertexai
from vertexai.preview.generative_models import GenerativeModel
from google.cloud import aiplatform
from google.oauth2 import service_account

from config.settings import settings
from models.schemas import ConversationRequest, ConversationResponse, RAGSource
from prompts.templates import get_conversation_prompt, get_boundary_check_prompt, get_enhanced_conversation_prompt

logger = logging.getLogger(__name__)

class ConversationGuide:
    """
    Enhanced RAG-powered conversational AI tutor.
    
    Features:
    - Real-time RAG integration with NCERT content
    - Moderate topic boundary enforcement
    - Seamless blending of RAG + Gemini knowledge
    - Friendly teacher tone
    - Stateless (no conversation memory)
    - Privacy-first design
    """
    
    def __init__(self, rag_retriever=None):
        """
        Initialize conversation guide with Gemini and RAG.
        
        Args:
            rag_retriever: Optional RAG retriever instance for NCERT content
        """
        self.model = None
        self.rag_retriever = rag_retriever
        
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
                    logger.info(f"✅ Enhanced Conversation Guide initialized with {settings.GENERATION_MODEL}")
                    logger.info(f"✅ RAG integration: {'Enabled' if rag_retriever else 'Disabled'}")
                else:
                    logger.error(f"Credentials file not found: {settings.GOOGLE_APPLICATION_CREDENTIALS}")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini: {e}")
        else:
            logger.warning("⚠️ GCP not configured - AI assistant will not function properly")
    
    async def guide(self, request: ConversationRequest) -> ConversationResponse:
        """
        Provide intelligent, context-aware conversational guidance.
        
        This is a STATELESS function - each request is independent.
        All context comes from the request payload.
        
        Args:
            request: ConversationRequest with question, context, and simulation state
            
        Returns:
            ConversationResponse with answer, sources, and suggestions
        """
        try:
            logger.info(f"📝 Processing question: '{request.student_input[:50]}...'")
            
            # Extract context from request (not from stored memory)
            context = request.context or {}
            topic = context.get("topic", "")
            grade = context.get("grade", 10)
            subject = context.get("subject", "science")
            simulation_state = context.get("simulation_state", {})
            
            if not self.model:
                logger.error("❌ Gemini model not initialized")
                return self._fallback_response()
            
            # Step 1: Check topic boundaries (moderate strictness)
            logger.info(f"🔍 Checking boundaries for topic: {topic}")
            boundary_check = await self._check_boundaries(
                question=request.student_input,
                topic=topic,
                strictness="moderate"
            )
            
            if not boundary_check["allowed"]:
                logger.info(f"🚫 Question blocked/redirected: {boundary_check['category']}")
                return self._redirect_response(topic, boundary_check)
            
            # Step 2: Retrieve NCERT content via RAG (if available)
            rag_context = await self._get_rag_context(
                question=request.student_input,
                topic=topic,
                grade=grade,
                subject=subject
            )
            
            logger.info(f"📚 RAG retrieval: {rag_context['count']} chunks found")
            
            # Step 3: Build intelligent prompt (seamless blending)
            prompt = self._build_enhanced_prompt(
                question=request.student_input,
                topic=topic,
                grade=grade,
                subject=subject,
                rag_context=rag_context,
                simulation_state=simulation_state
            )
            
            # Step 4: Generate response from Gemini (real-time, no caching)
            logger.info("🤖 Generating Gemini response...")
            response_text = await self._generate_response(prompt)
            
            # Step 5: Generate follow-up suggestions
            follow_ups = await self._generate_follow_ups(response_text, topic, grade)
            
            # Step 6: Build enhanced response with metadata
            enhanced_response = self._build_response(
                response_text=response_text,
                rag_context=rag_context,
                follow_ups=follow_ups,
                boundary_check=boundary_check
            )
            
            logger.info(f"✅ Response generated successfully (RAG: {enhanced_response.rag_used})")
            
            return enhanced_response
            
        except Exception as e:
            logger.error(f"❌ Error in conversation guide: {e}")
            logger.exception("Full traceback:")
            return self._fallback_response()
    
    async def _check_boundaries(
        self,
        question: str,
        topic: str,
        strictness: str = "moderate"
    ) -> Dict[str, Any]:
        """
        Check if question is within acceptable educational boundaries.
        
        Moderate strictness: Allow topic + related educational concepts.
        
        Args:
            question: Student's question
            topic: Current learning topic
            strictness: "strict" | "moderate" | "flexible"
            
        Returns:
            Dict with 'allowed', 'category', 'reason', 'confidence'
        """
        try:
            prompt = get_boundary_check_prompt(question, topic, strictness)
            
            if not self.model:
                raise Exception("Model not initialized")
            
            response = self.model.generate_content(
                prompt,
                generation_config={
                    "temperature": 0.3,  # Lower temperature for classification
                    "max_output_tokens": 200
                }
            )
            
            # Parse JSON response
            if hasattr(response, 'text'):
                response_text = response.text.strip()  # type: ignore
            else:
                response_text = str(response).strip()
            
            # Clean JSON if wrapped in markdown
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()
            
            result = json.loads(response_text)
            
            return result
            
        except Exception as e:
            logger.error(f"Boundary check failed: {e}")
            # Default to allowing (fail open for better UX)
            return {
                "allowed": True,
                "category": "ALLOWED",
                "reason": "Unable to classify, allowing by default",
                "confidence": 0.5
            }
    
    async def _get_rag_context(
        self,
        question: str,
        topic: str,
        grade: int,
        subject: str
    ) -> Dict[str, Any]:
        """
        Retrieve relevant NCERT content using RAG.
        
        Args:
            question: Student's question
            topic: Current topic
            grade: Grade level
            subject: Subject area
            
        Returns:
            Dict with 'documents', 'metadatas', 'count', 'text'
        """
        if not self.rag_retriever:
            logger.warning("⚠️ RAG retriever not available")
            return {"documents": [], "metadatas": [], "count": 0, "text": ""}
        
        try:
            # Build enhanced query combining question + topic
            enhanced_query = f"{topic}: {question}"
            
            # Retrieve from vector store
            results = self.rag_retriever.retrieve(
                query=enhanced_query,
                grade=None,  # Don't filter by grade for broader context
                subject=None,  # Don't filter by subject for broader context
                top_k=3
            )
            
            # Format context text
            if results and "documents" in results and len(results["documents"]) > 0:
                context_text = "\n\n".join([
                    f"[Source {i+1}]: {doc}"
                    for i, doc in enumerate(results["documents"])
                ])
                
                return {
                    "documents": results["documents"],
                    "metadatas": results.get("metadatas", []),
                    "count": len(results["documents"]),
                    "text": context_text
                }
            
            return {"documents": [], "metadatas": [], "count": 0, "text": ""}
            
        except Exception as e:
            logger.error(f"RAG retrieval failed: {e}")
            return {"documents": [], "metadatas": [], "count": 0, "text": ""}
    
    def _build_enhanced_prompt(
        self,
        question: str,
        topic: str,
        grade: int,
        subject: str,
        rag_context: Dict[str, Any],
        simulation_state: Dict[str, Any]
    ) -> str:
        """
        Build comprehensive prompt that seamlessly blends RAG + Gemini knowledge.
        
        Args:
            question: Student's question
            topic: Current topic
            grade: Grade level
            subject: Subject area
            rag_context: Retrieved NCERT content
            simulation_state: Current simulation values
            
        Returns:
            Complete prompt for Gemini
        """
        # Determine RAG quality and strategy
        rag_count = rag_context.get("count", 0)
        
        if rag_count >= 2:
            rag_quality = "high"
            rag_instruction = """
You have excellent NCERT content available below. Use this as your primary source,
but explain it in your own words as a friendly teacher would. Don't say "according to NCERT" -
just naturally integrate the information. Feel free to add clarifications and examples.
"""
        elif rag_count == 1:
            rag_quality = "medium"
            rag_instruction = """
You have some NCERT content available. Use it where relevant, but also draw on your 
knowledge to provide a complete answer. Blend both sources seamlessly.
"""
        else:
            rag_quality = "low"
            rag_instruction = """
Limited NCERT content is available. Use your knowledge of {topic} appropriate for
Grade {grade} Indian curriculum. Ensure accuracy and educational value.
""".format(topic=topic, grade=grade)
        
        # Format simulation state
        sim_state_text = self._format_simulation_state(simulation_state)
        
        # Build complete prompt
        prompt = get_enhanced_conversation_prompt(
            question=question,
            topic=topic,
            grade=grade,
            subject=subject,
            rag_context_text=rag_context.get("text", ""),
            rag_quality=rag_quality,
            rag_instruction=rag_instruction,
            simulation_state=sim_state_text
        )
        
        return prompt
    
    def _format_simulation_state(self, simulation_state: Dict[str, Any]) -> str:
        """Format simulation state for prompt."""
        if not simulation_state:
            return "No simulation data available."
        
        formatted = []
        for key, value in simulation_state.items():
            if isinstance(value, (int, float)):
                formatted.append(f"- {key.replace('_', ' ').title()}: {value}")
            elif isinstance(value, str):
                formatted.append(f"- {key.replace('_', ' ').title()}: {value}")
        
        return "\n".join(formatted) if formatted else "No simulation data available."
    
    async def _generate_response(self, prompt: str) -> str:
        """
        Generate response using Gemini (real-time, no caching).
        
        Args:
            prompt: Complete prompt
            
        Returns:
            Generated response text
        """
        try:
            if not self.model:
                raise Exception("Model not initialized")
            
            generation_config = {
                "temperature": 0.7,  # Balanced creativity
                "top_p": 0.9,
                "top_k": 40,
                "max_output_tokens": 500,  # Concise responses
            }
            
            response = self.model.generate_content(
                prompt,
                generation_config=generation_config
            )
            
            if hasattr(response, 'text'):
                return response.text.strip()  # type: ignore
            else:
                return str(response).strip()
            
        except Exception as e:
            logger.error(f"Gemini generation failed: {e}")
            raise
    
    async def _generate_follow_ups(
        self,
        response: str,
        topic: str,
        grade: int
    ) -> List[str]:
        """
        Generate contextual follow-up questions.
        
        Args:
            response: The AI's response
            topic: Current topic
            grade: Grade level
            
        Returns:
            List of follow-up question suggestions
        """
        try:
            if not self.model:
                return []
            
            prompt = f"""
Based on this explanation about {topic}:
"{response[:200]}..."

Generate 2 short follow-up questions a Grade {grade} student might ask to deepen understanding.

Format: Return ONLY the questions, one per line. No numbering, no extra text.
Make them specific to {topic} and encourage exploration.
"""
            
            follow_up_response = self.model.generate_content(
                prompt,
                generation_config={
                    "temperature": 0.8,
                    "max_output_tokens": 100
                }
            )
            
            # Parse follow-ups
            response_text = follow_up_response.text.strip() if hasattr(follow_up_response, 'text') else str(follow_up_response).strip()  # type: ignore
            follow_ups = [
                line.strip()
                for line in response_text.split('\n')
                if line.strip() and not line.strip().startswith('#')
            ]
            
            return follow_ups[:2]  # Max 2 suggestions
            
        except Exception as e:
            logger.error(f"Follow-up generation failed: {e}")
            return []
    
    def _build_response(
        self,
        response_text: str,
        rag_context: Dict[str, Any],
        follow_ups: List[str],
        boundary_check: Dict[str, Any]
    ) -> ConversationResponse:
        """
        Build enhanced response with all metadata.
        
        Args:
            response_text: Generated response
            rag_context: RAG retrieval results
            follow_ups: Follow-up suggestions
            boundary_check: Boundary check results
            
        Returns:
            Complete ConversationResponse
        """
        # Extract RAG sources
        rag_sources = []
        if rag_context.get("count", 0) > 0:
            for i, (doc, meta) in enumerate(zip(
                rag_context.get("documents", []),
                rag_context.get("metadatas", [])
            )):
                rag_sources.append(RAGSource(
                    chapter=meta.get("chapter", ""),
                    page=meta.get("page", ""),
                    excerpt=doc[:150] + "..." if len(doc) > 150 else doc
                ))
        
        # Determine confidence based on RAG quality and boundary check
        confidence = 0.5
        if rag_context.get("count", 0) >= 2:
            confidence = 0.95
        elif rag_context.get("count", 0) == 1:
            confidence = 0.8
        elif boundary_check.get("confidence", 0) > 0.8:
            confidence = 0.75
        
        return ConversationResponse(
            response=response_text,
            action="answer",
            task_complete=False,
            rag_used=rag_context.get("count", 0) > 0,
            rag_sources=rag_sources if rag_sources else None,
            confidence=confidence,
            follow_up_suggestions=follow_ups if follow_ups else None,
            next_task_id=None
        )
    
    def _redirect_response(
        self,
        topic: str,
        boundary_check: Dict[str, Any]
    ) -> ConversationResponse:
        """
        Generate friendly redirect for off-topic or inappropriate questions.
        
        Args:
            topic: Current learning topic
            boundary_check: Boundary check results
            
        Returns:
            Redirect ConversationResponse
        """
        category = boundary_check.get("category", "OFF_TOPIC")
        
        redirect_messages = {
            "BLOCK": f"I'm here to help you learn! Let's stick to educational topics.  Do you have questions about {topic}?",
            "OFF_TOPIC": f"That's an interesting question! But right now we're exploring {topic}. Let's focus on that. Do you have questions about what you're seeing in the simulation? ",
            "REDIRECT": f"That's a great topic for another time! For now, let's dive deeper into {topic}. What would you like to know about it? "
        }
        
        message = redirect_messages.get(
            category,
            redirect_messages["OFF_TOPIC"]
        )
        
        return ConversationResponse(
            response=message,
            action="redirect",
            task_complete=False,
            rag_used=False,
            confidence=0.9
        )
    
    def _fallback_response(self) -> ConversationResponse:
        """
        Minimal fallback response when system fails.
        
        Returns:
            Basic ConversationResponse
        """
        return ConversationResponse(
            response="I'm having trouble connecting right now. Could you try asking that question again? ",
            action="error",
            task_complete=False,
            rag_used=False,
            confidence=0.0
        )
    
    def _check_task_completion(self, student_input: str, action: str) -> bool:
        """Check if task is complete based on input and action."""
        if action == "next_task":
            return True
        
        input_lower = student_input.lower()
        completion_words = ["done", "finished", "completed", "ready for next"]
        
        return any(word in input_lower for word in completion_words)
    
    def _get_mock_response(self, request: ConversationRequest) -> str:
        """Generate mock response for testing."""
        input_lower = request.student_input.lower()
        
        if any(word in input_lower for word in ["done", "finished", "complete"]):
            return "Excellent work! You've completed this task perfectly. Let's move to the next step!"
        
        elif any(word in input_lower for word in ["hint", "help", "stuck"]):
            return "No problem! Here's a hint: Try adjusting the controls one at a time and observe how each change affects the outcome."
        
        elif any(word in input_lower for word in ["yes", "ready"]):
            return "Great! Let's continue with the next task."
        
        else:
            return "I see what you're doing! Keep experimenting and observe the changes carefully. Let me know when you're ready to continue!"
