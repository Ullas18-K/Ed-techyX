import logging
import os
from typing import Dict, Any
import vertexai
from vertexai.preview.generative_models import GenerativeModel
from google.cloud import aiplatform
from google.oauth2 import service_account

from config.settings import settings
from models.schemas import ConversationRequest, ConversationResponse
from prompts.templates import get_conversation_prompt

logger = logging.getLogger(__name__)

class ConversationGuide:
    """Provide conversational guidance during learning sessions."""
    
    def __init__(self):
        """Initialize conversation guide with Gemini."""
        self.model = None
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
                    logger.info(f"Conversation guide initialized with {settings.GENERATION_MODEL}")
                else:
                    logger.error(f"Credentials file not found: {settings.GOOGLE_APPLICATION_CREDENTIALS}")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini: {e}")
        else:
            logger.warning("GCP not configured - using mock responses")
    
    async def guide(self, request: ConversationRequest) -> ConversationResponse:
        """
        Provide conversational guidance based on student input.
        
        Args:
            request: Conversation request with task info and student input
            
        Returns:
            Conversational response with action guidance
        """
        try:
            logger.info(f"Guiding conversation for task {request.current_task_id}")
            
            # Extract context
            task = request.context.get("task", {})
            grade = request.context.get("grade", 6)
            
            # Build prompt
            prompt = get_conversation_prompt(
                grade=grade,
                task_id=request.current_task_id,
                task_instruction=task.get("instruction", ""),
                expected_action=task.get("expectedAction", ""),
                student_input=request.student_input
            )
            
            # Call Gemini
            if self.model:
                response = self.model.generate_content(prompt, stream=False)
                response_text = response.candidates[0].content.parts[0].text.strip()
                logger.info(f"Gemini response: {response_text[:100]}...")
            else:
                # Mock response
                response_text = self._get_mock_response(request)
            
            # Determine action based on response and input
            action = self._determine_action(request.student_input, response_text)
            task_complete = self._check_task_completion(request.student_input, action)
            
            return ConversationResponse(
                response=response_text,
                action=action,
                task_complete=task_complete,
                next_task_id=request.current_task_id + 1 if task_complete else None
            )
            
        except Exception as e:
            logger.error(f"Error in conversation guide: {e}")
            # Fallback response
            return ConversationResponse(
                response="I see what you did! Keep exploring and let me know when you're ready to move on.",
                action="continue",
                task_complete=False
            )
    
    def _determine_action(self, student_input: str, ai_response: str) -> str:
        """Determine appropriate action based on conversation."""
        input_lower = student_input.lower()
        response_lower = ai_response.lower()
        
        # Check for completion indicators
        if any(word in input_lower for word in ["done", "finished", "complete", "yes", "ready", "next"]):
            if "great" in response_lower or "excellent" in response_lower or "perfect" in response_lower:
                return "next_task"
        
        # Check for hint request
        if any(word in input_lower for word in ["hint", "help", "stuck", "don't know", "confused"]):
            return "hint"
        
        # Check for repeat request
        if any(word in input_lower for word in ["repeat", "again", "what", "didn't understand"]):
            return "repeat"
        
        # Default: continue
        return "continue"
    
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
