import os
from pathlib import Path
from pydantic_settings import BaseSettings

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
    BACKEND_URL: str = "http://localhost:9000"
    FRONTEND_URL: str = "http://localhost:8080"
    CORS_ORIGINS: str = ""  # Comma-separated list of additional origins
    
    class Config:
        env_file = ".env"
        case_sensitive = True
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Set credentials path as absolute and export to environment
        if self.GOOGLE_APPLICATION_CREDENTIALS:
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
