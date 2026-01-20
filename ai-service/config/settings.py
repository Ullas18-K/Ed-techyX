import os
import logging
from pathlib import Path
from pydantic_settings import BaseSettings

logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Base directory (project root)
    BASE_DIR: str = str(Path(__file__).parent.parent)
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8001
    ENVIRONMENT: str = "development"
    
    # GCP Configuration
    GCP_PROJECT_ID: str = ""  # Set this in .env
    GCP_LOCATION: str = "us-central1"
    GOOGLE_APPLICATION_CREDENTIALS: str = ""  # Path to service account JSON
    
    # Vector Database
    CHROMA_PERSIST_DIR: str = "./chroma_db"
    VECTOR_COLLECTION_NAME: str = "ncert_textbooks"
    
    # AI Model Configuration
    EMBEDDING_MODEL: str = "textembedding-gecko@003"
    GENERATION_MODEL: str = "gemini-1.5-flash"
    GEMINI_API_KEY: str = ""  # Get from https://aistudio.google.com/
    
    # RAG Configuration
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    TOP_K_RESULTS: int = 5
    
    # CORS
    BACKEND_BASE_URL: str = "https://ed-techyx.onrender.com"
    FRONTEND_BASE_URL: str = "https://ed-techy-x.vercel.app"
    CORS_ORIGINS: str = ""  # Comma-separated list of additional origins
    
    class Config:
        env_file = ".env"
        case_sensitive = True
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Handle Google credentials - accept JSON string or file path
        if self.GOOGLE_APPLICATION_CREDENTIALS:
            # Check if it's JSON content (starts with { or contains "type": "service_account")
            if self.GOOGLE_APPLICATION_CREDENTIALS.strip().startswith('{'):
                # It's JSON content - write to temp file
                import json
                import tempfile
                try:
                    # Parse to validate JSON
                    creds_dict = json.loads(self.GOOGLE_APPLICATION_CREDENTIALS)
                    # Write to temp file
                    temp_file = tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json')
                    json.dump(creds_dict, temp_file)
                    temp_file.close()
                    self.GOOGLE_APPLICATION_CREDENTIALS = temp_file.name
                    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = temp_file.name
                except json.JSONDecodeError as e:
                    logger.warning(f"Invalid JSON in GOOGLE_APPLICATION_CREDENTIALS: {e}")
            else:
                # It's a file path
                if not os.path.isabs(self.GOOGLE_APPLICATION_CREDENTIALS):
                    # Convert relative path to absolute
                    base_dir = Path(__file__).parent.parent
                    self.GOOGLE_APPLICATION_CREDENTIALS = str(base_dir / self.GOOGLE_APPLICATION_CREDENTIALS)
                # Export to OS environment variable for Google Cloud SDK
                os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = self.GOOGLE_APPLICATION_CREDENTIALS

# Global settings instance
settings = Settings()

# Ensure directories exist
Path(settings.CHROMA_PERSIST_DIR).mkdir(parents=True, exist_ok=True)
