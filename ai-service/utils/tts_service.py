"""
Google Cloud Text-to-Speech Service
"""
import logging
import os
from typing import Optional
from google.cloud import texttospeech
from google.oauth2 import service_account
from config.settings import settings

logger = logging.getLogger(__name__)


class TTSService:
    """Text-to-Speech service using Google Cloud TTS"""
    
    def __init__(self):
        self.client = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize Google Cloud TTS client"""
        try:
            if settings.GCP_PROJECT_ID and settings.GOOGLE_APPLICATION_CREDENTIALS:
                if os.path.exists(settings.GOOGLE_APPLICATION_CREDENTIALS):
                    credentials = service_account.Credentials.from_service_account_file(
                        settings.GOOGLE_APPLICATION_CREDENTIALS
                    )
                    self.client = texttospeech.TextToSpeechClient(credentials=credentials)
                    logger.info("✅ Google Cloud TTS client initialized")
                else:
                    logger.error(f"Credentials file not found: {settings.GOOGLE_APPLICATION_CREDENTIALS}")
        except Exception as e:
            logger.error(f"Failed to initialize TTS client: {e}")
    
    async def synthesize_speech(
        self,
        text: str,
        language_code: str = "en-US",
        voice_name: str = "en-US-Neural2-F",  # Natural female voice
        speaking_rate: float = 1.0,
        pitch: float = 0.0
    ) -> Optional[bytes]:
        """
        Synthesize speech from text using Google Cloud TTS.
        
        Args:
            text: Text to convert to speech
            language_code: Language code (e.g., 'en-US', 'en-IN')
            voice_name: Voice name (Neural2 voices are most natural)
            speaking_rate: Speed (0.25 to 4.0, 1.0 is normal)
            pitch: Pitch (-20.0 to 20.0, 0 is default)
            
        Returns:
            Audio content as bytes (MP3 format)
        """
        if not self.client:
            logger.warning("TTS client not initialized")
            return None
        
        try:
            # Set the text input to be synthesized
            synthesis_input = texttospeech.SynthesisInput(text=text)
            
            # Build the voice request
            voice = texttospeech.VoiceSelectionParams(
                language_code=language_code,
                name=voice_name
            )
            
            # Select the type of audio file
            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.MP3,
                speaking_rate=speaking_rate,
                pitch=pitch
            )
            
            # Perform the text-to-speech request
            response = self.client.synthesize_speech(
                input=synthesis_input,
                voice=voice,
                audio_config=audio_config
            )
            
            logger.info(f"✅ Synthesized speech for text: {text[:50]}...")
            return response.audio_content
            
        except Exception as e:
            logger.error(f"Error synthesizing speech: {e}")
            return None


# Singleton instance
tts_service = TTSService()
