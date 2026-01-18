import json
import logging
import os
from typing import Dict, Any, Optional
import vertexai
from vertexai.preview.generative_models import GenerativeModel
from google.cloud import vision
from google.oauth2 import service_account

from config.settings import settings
from models.schemas import UploadAndLearnResponse
from prompts.templates import get_upload_learn_prompt

logger = logging.getLogger(__name__)

class UploadLearnAgent:
    """Agent for uploading images, OCR extraction, and NCERT-based answering."""
    
    def __init__(self):
        """Initialize OCR and Gemini clients."""
        self.vision_client = None
        self.model = None
        
        if settings.GCP_PROJECT_ID and settings.GOOGLE_APPLICATION_CREDENTIALS:
            try:
                if os.path.exists(settings.GOOGLE_APPLICATION_CREDENTIALS):
                    credentials = service_account.Credentials.from_service_account_file(
                        settings.GOOGLE_APPLICATION_CREDENTIALS
                    )
                    
                    # Initialize Vision Client
                    self.vision_client = vision.ImageAnnotatorClient(credentials=credentials)
                    
                    # Initialize Vertex AI
                    vertexai.init(
                        project=settings.GCP_PROJECT_ID,
                        location=settings.GCP_LOCATION,
                        credentials=credentials
                    )
                    self.model = GenerativeModel(settings.GENERATION_MODEL)
                    logger.info("UploadLearnAgent initialized with GCP clients")
                else:
                    logger.error(f"Credentials file not found: {settings.GOOGLE_APPLICATION_CREDENTIALS}")
            except Exception as e:
                logger.error(f"Failed to initialize UploadLearnAgent clients: {e}")
        else:
            logger.warning("GCP credentials not fully set - UploadLearnAgent will be limited")

    async def analyze_image(self, image_content: bytes) -> UploadAndLearnResponse:
        """
        Perform OCR and NCERT-based analysis on an image.
        
        Steps:
        1. OCR Extraction using Google Cloud Vision
        2. NCERT Validation and Answer Generation using Vertex AI
        """
        try:
            # 1. OCR Extraction
            if not self.vision_client:
                raise Exception("Vision client not initialized")
                
            image = vision.Image(content=image_content)
            response = self.vision_client.text_detection(image=image)
            
            if response.error.message:
                raise Exception(f"Vision API Error: {response.error.message}")
                
            texts = response.text_annotations
            if not texts:
                return UploadAndLearnResponse(
                    is_ncert=False,
                    extracted_question="No text found in image.",
                    status="unsupported",
                    message="I couldn't find any text in this image. Please upload a clearer photo."
                )
                
            full_text = texts[0].description
            logger.info(f"Extracted OCR text: {full_text[:100]}...")
            
            # 2. Vertex AI Reasoning
            if not self.model:
                # Fallback if AI not available
                return UploadAndLearnResponse(
                    is_ncert=False,
                    extracted_question=full_text,
                    status="error",
                    message="AI analysis is currently unavailable."
                )
            
            prompt = get_upload_learn_prompt(full_text)
            
            ai_response = self.model.generate_content(
                prompt,
                generation_config={
                    "temperature": 0.2, # Lower temperature for factual accuracy
                    "max_output_tokens": 2048,
                }
            )
            
            if not ai_response or not ai_response.text:
                raise Exception("Empty response from Vertex AI")
                
            response_text = ai_response.text.strip()
            
            # Clean JSON markdown if present
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()
            
            try:
                data = json.loads(response_text)
                
                if not data.get("is_ncert", False):
                    return UploadAndLearnResponse(
                        is_ncert=False,
                        extracted_question=data.get("extracted_question", full_text),
                        status="unsupported",
                        message="This question appears to be outside the NCERT syllabus. I only focus on Class 1-12 curriculum."
                    )
                
                # Valid NCERT question
                return UploadAndLearnResponse(
                    is_ncert=True,
                    grade=data.get("class"),
                    subject=data.get("subject"),
                    chapter=data.get("chapter"),
                    answer=data.get("answer"),
                    extracted_question=data.get("extracted_question", full_text),
                    status="success"
                )
                
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse AI JSON: {response_text}")
                return UploadAndLearnResponse(
                    is_ncert=False,
                    extracted_question=full_text,
                    status="error",
                    message="I had trouble processing the answer. Please try again."
                )
                
        except Exception as e:
            logger.error(f"Error in UploadAndLearn analysis: {e}")
            return UploadAndLearnResponse(
                is_ncert=False,
                extracted_question="Error during analysis",
                status="error",
                message=f"Something went wrong: {str(e)}"
            )
