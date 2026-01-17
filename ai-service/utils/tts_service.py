"""
Google Cloud Text-to-Speech Service
"""
import logging
import os
import re
from typing import Optional
from google.cloud import texttospeech
from google.oauth2 import service_account
from config.settings import settings

logger = logging.getLogger(__name__)

# Language code to Indian voice mapping
# Maps language codes to Google Cloud Neural2 voice names with Indian accents
# Only includes voices that are confirmed available on Google Cloud TTS
LANGUAGE_VOICE_MAP = {
    # Hindi - Indian voices (most reliably available)
    "hi": "hi-IN-Neural2-B",      # Hindi India - Natural female voice
    "hi-IN": "hi-IN-Neural2-B",
    
    # Kannada - Uses Standard voices (Neural2 not always available)
    "kn": "kn-IN-Standard-A",     # Kannada India - Standard voice (reliable)
    "kn-IN": "kn-IN-Standard-A",
    
    # Malayalam - Uses Standard voices
    "ml": "ml-IN-Standard-A",     # Malayalam India - Standard voice (reliable)
    "ml-IN": "ml-IN-Standard-A",
    
    # Tamil - Uses Standard voices
    "ta": "ta-IN-Standard-A",     # Tamil India - Standard voice (reliable)
    "ta-IN": "ta-IN-Standard-A",
    
    # Telugu - Uses Standard voices
    "te": "te-IN-Standard-A",     # Telugu India - Standard voice (reliable)
    "te-IN": "te-IN-Standard-A",
    
    # Marathi - Uses Hindi as fallback (same language family)
    "mr": "hi-IN-Neural2-B",      # Marathi → Hindi India
    "mr-IN": "hi-IN-Neural2-B",
    
    # Gujarati - Uses Hindi as fallback
    "gu": "hi-IN-Neural2-B",      # Gujarati → Hindi India
    "gu-IN": "hi-IN-Neural2-B",
    
    # Bengali - Uses Standard voice
    "bn": "bn-IN-Standard-A",     # Bengali India - Standard voice
    "bn-IN": "bn-IN-Standard-A",
    
    # Punjabi - Uses Hindi as fallback (North Indian language)
    "pa": "hi-IN-Neural2-B",      # Punjabi → Hindi India
    "pa-IN": "hi-IN-Neural2-B",
    
    # English - Default to Indian English
    "en": "en-IN-Neural2-B",      # English India - Natural female voice
    "en-IN": "en-IN-Neural2-B",
    "en-US": "en-IN-Neural2-B",   # Redirect US English to Indian English
    
    # Fallback for any other English variant
    "en-GB": "en-IN-Neural2-B",
}


def get_voice_for_language(language_code: str) -> tuple[str, str]:
    """
    Get appropriate voice name and corrected language code for TTS.
    
    Maps language codes to Indian accent voices where available.
    Falls back to English Indian voice if language not found.
    
    Args:
        language_code: Language code (e.g., 'hi', 'hi-IN', 'kn-IN')
        
    Returns:
        Tuple of (corrected_language_code, voice_name)
    """
    # Normalize language code
    lang = language_code.lower() if language_code else "en"
    
    # Try exact match first
    if lang in LANGUAGE_VOICE_MAP:
        voice = LANGUAGE_VOICE_MAP[lang]
        return (lang, voice)
    
    # Try language prefix (e.g., 'hi' from 'hi-IN')
    lang_prefix = lang.split('-')[0] if '-' in lang else lang
    if lang_prefix in LANGUAGE_VOICE_MAP:
        voice = LANGUAGE_VOICE_MAP[lang_prefix]
        return (lang_prefix + "-IN", voice)
    
    # Default to English Indian voice
    logger.warning(f"Language {language_code} not recognized, using English Indian voice")
    return ("en-IN", LANGUAGE_VOICE_MAP["en"])


def sanitize_text_for_tts(text: str) -> str:
    """
    Sanitize text by removing markdown, special characters, and formatting.
    
    Args:
        text: Raw text with potential markdown or special characters
        
    Returns:
        Cleaned text safe for TTS processing
    """
    if not text:
        return ""
    
    # Remove markdown formatting
    text = re.sub(r'#{1,6}\s', '', text)  # Remove heading markers
    text = re.sub(r'\*\*|__', '', text)   # Remove bold markers
    text = re.sub(r'[*_]', '', text)      # Remove italic markers
    text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)  # Convert links to text
    text = re.sub(r'`{1,3}[^`]*`{1,3}', '', text)  # Remove code blocks
    
    # Remove special mathematical/programming symbols
    text = re.sub(r'[\\\^{}[\]|~]', '', text)  # Remove special chars
    text = re.sub(r'\$', '', text)  # Remove dollar signs (LaTeX)
    text = re.sub(r'&lt;|&gt;|&amp;', '', text)  # Remove HTML entities
    
    # Fix numbered lists
    text = re.sub(r'(\d+)\.', r'\1', text)
    
    # Normalize whitespace
    text = re.sub(r'\n{2,}', '\n', text)  # Collapse multiple newlines
    text = re.sub(r'\s+', ' ', text)  # Normalize spaces
    text = text.strip()
    
    return text


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
    
    def _chunk_text_by_bytes(self, text: str, max_bytes: int = 4800) -> list:
        """
        Split text into chunks based on byte size (UTF-8 encoded).
        Tries to break at sentence boundaries for natural pauses.
        
        Args:
            text: Text to chunk
            max_bytes: Maximum bytes per chunk (default 4800 to be safe with 5000 limit)
            
        Returns:
            List of text chunks
        """
        chunks = []
        current_chunk = ""
        
        # First, try to split by sentences
        sentences = re.split(r'(?<=[.!?])\s+', text)
        
        for sentence in sentences:
            # Check if adding this sentence would exceed byte limit
            test_chunk = current_chunk + (" " if current_chunk else "") + sentence
            byte_size = len(test_chunk.encode('utf-8'))
            
            if byte_size <= max_bytes:
                current_chunk = test_chunk
            else:
                # This sentence pushes us over limit
                if current_chunk:
                    chunks.append(current_chunk)
                
                # If the sentence itself is larger than max, split it further
                if len(sentence.encode('utf-8')) > max_bytes:
                    # Split by words
                    words = sentence.split()
                    word_chunk = ""
                    for word in words:
                        test_word_chunk = word_chunk + (" " if word_chunk else "") + word
                        if len(test_word_chunk.encode('utf-8')) <= max_bytes:
                            word_chunk = test_word_chunk
                        else:
                            if word_chunk:
                                chunks.append(word_chunk)
                            word_chunk = word
                    if word_chunk:
                        current_chunk = word_chunk
                else:
                    current_chunk = sentence
        
        # Add any remaining text
        if current_chunk:
            chunks.append(current_chunk)
        
        return chunks if chunks else [text]
    
    async def synthesize_speech(
        self,
        text: str,
        language_code: str = "en-US",
        voice_name: Optional[str] = None,  # Optional - will be auto-selected based on language
        speaking_rate: float = 1.0,
        pitch: float = 0.0
    ) -> Optional[bytes]:
        """
        Synthesize speech from text using Google Cloud TTS.
        Automatically selects Indian-accent voices for Indian languages.
        Handles long text by chunking into multiple requests and concatenating audio.
        
        Args:
            text: Text to convert to speech
            language_code: Language code (e.g., 'hi-IN', 'kn-IN', 'en-IN')
            voice_name: Optional voice name override (if None, auto-selected based on language)
            speaking_rate: Speed (0.25 to 4.0, 1.0 is normal)
            pitch: Pitch (-20.0 to 20.0, 0 is default)
            
        Returns:
            Audio content as bytes (MP3 format)
        """
        if not self.client:
            logger.error("TTS client not initialized - check GCP credentials")
            raise Exception("TTS service not initialized")
        
        try:
            # Auto-select voice based on language if not provided
            if not voice_name:
                language_code, voice_name = get_voice_for_language(language_code)
                logger.info(f"🗣️ Auto-selected voice: {voice_name} for language: {language_code}")
            
            # Sanitize the input text
            cleaned_text = sanitize_text_for_tts(text)
            
            if not cleaned_text:
                raise ValueError("Text is empty after sanitization")
            
            text_byte_size = len(cleaned_text.encode('utf-8'))
            logger.info(f"📢 TTS Request: {len(cleaned_text)} chars, {text_byte_size} bytes, Language: {language_code}, Voice: {voice_name}")
            
            # Check if text exceeds 5000 byte limit and chunk if needed
            if text_byte_size > 5000:
                logger.info(f"⚠️ Text size {text_byte_size} bytes exceeds 5000 byte limit. Chunking into smaller pieces...")
                text_chunks = self._chunk_text_by_bytes(cleaned_text, max_bytes=4800)
                logger.info(f"Split into {len(text_chunks)} chunks: {[len(c.encode('utf-8')) for c in text_chunks]} bytes each")
                
                # Synthesize each chunk and concatenate
                audio_chunks = []
                for i, chunk in enumerate(text_chunks):
                    logger.info(f"Synthesizing chunk {i+1}/{len(text_chunks)}: {len(chunk.encode('utf-8'))} bytes")
                    
                    synthesis_input = texttospeech.SynthesisInput(text=chunk)
                    voice = texttospeech.VoiceSelectionParams(
                        language_code=language_code,
                        name=voice_name
                    )
                    audio_config = texttospeech.AudioConfig(
                        audio_encoding=texttospeech.AudioEncoding.MP3,
                        speaking_rate=speaking_rate,
                        pitch=pitch
                    )
                    
                    response = self.client.synthesize_speech(
                        input=synthesis_input,
                        voice=voice,
                        audio_config=audio_config
                    )
                    
                    if response.audio_content:
                        audio_chunks.append(response.audio_content)
                        logger.info(f"✅ Chunk {i+1} synthesized: {len(response.audio_content)} bytes")
                
                # Concatenate MP3 chunks
                # Note: Simple concatenation works for MP3 frames
                full_audio = b''.join(audio_chunks)
                logger.info(f"✅ Successfully synthesized {len(full_audio)} bytes of audio from {len(text_chunks)} chunks")
                return full_audio
            
            else:
                # Standard single request
                synthesis_input = texttospeech.SynthesisInput(text=cleaned_text)
                voice = texttospeech.VoiceSelectionParams(
                    language_code=language_code,
                    name=voice_name
                )
                audio_config = texttospeech.AudioConfig(
                    audio_encoding=texttospeech.AudioEncoding.MP3,
                    speaking_rate=speaking_rate,
                    pitch=pitch
                )
                
                response = self.client.synthesize_speech(
                    input=synthesis_input,
                    voice=voice,
                    audio_config=audio_config
                )
                
                if not response.audio_content:
                    raise Exception("No audio content in response")
                
                logger.info(f"✅ Successfully synthesized {len(response.audio_content)} bytes of audio")
                return response.audio_content
            
        except Exception as e:
            logger.error(f"❌ Error synthesizing speech: {str(e)}")
            raise


# Singleton instance
tts_service = TTSService()
