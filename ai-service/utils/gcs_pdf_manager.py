"""
Download NCERT PDFs from Google Cloud Storage and process them
This runs automatically on service startup
"""

import os
import logging
from pathlib import Path
from typing import Optional
from google.cloud import storage
from google.oauth2 import service_account

logger = logging.getLogger(__name__)

class GCSPDFManager:
    """Manage PDF downloads from Google Cloud Storage"""
    
    def __init__(self, bucket_name: str, local_pdf_dir: str = "./ncert_pdfs"):
        self.bucket_name = bucket_name
        self.local_pdf_dir = Path(local_pdf_dir)
        self.storage_client = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize GCS client"""
        try:
            # Google SDK will use GOOGLE_APPLICATION_CREDENTIALS env var
            self.storage_client = storage.Client()
            logger.info(f"✅ GCS client initialized for bucket: {self.bucket_name}")
        except Exception as e:
            logger.error(f"❌ Failed to initialize GCS client: {e}")
            self.storage_client = None
    
    def download_all_pdfs(self) -> bool:
        """Download all PDFs from GCS bucket"""
        if not self.storage_client:
            logger.warning("GCS client not initialized, skipping PDF download")
            return False
        
        try:
            bucket = self.storage_client.bucket(self.bucket_name)
            
            if not bucket.exists():
                logger.warning(f"Bucket '{self.bucket_name}' does not exist")
                return False
            
            logger.info(f"📥 Downloading PDFs from gs://{self.bucket_name}...")
            
            # List all PDF files in bucket
            blobs = bucket.list_blobs()
            pdf_blobs = [blob for blob in blobs if blob.name.endswith('.pdf')]
            
            if not pdf_blobs:
                logger.warning("No PDF files found in bucket")
                return False
            
            logger.info(f"Found {len(pdf_blobs)} PDF files to download")
            
            downloaded = 0
            for blob in pdf_blobs:
                local_path = self.local_pdf_dir / blob.name
                
                # Create parent directories
                local_path.parent.mkdir(parents=True, exist_ok=True)
                
                # Skip if file exists and size matches
                if local_path.exists() and local_path.stat().st_size == blob.size:
                    logger.debug(f"  ⏭️ Skipping (already exists): {blob.name}")
                    continue
                
                # Download
                blob.download_to_filename(str(local_path))
                logger.info(f"  ✅ Downloaded: {blob.name}")
                downloaded += 1
            
            logger.info(f"✅ Download complete: {downloaded} new files, {len(pdf_blobs) - downloaded} already cached")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to download PDFs from GCS: {e}")
            return False
    
    def check_local_pdfs_exist(self) -> bool:
        """Check if local PDFs directory has any files"""
        if not self.local_pdf_dir.exists():
            return False
        
        pdf_files = list(self.local_pdf_dir.rglob("*.pdf"))
        return len(pdf_files) > 0


def download_pdfs_from_gcs(bucket_name: Optional[str] = None) -> bool:
    """
    Download PDFs from GCS if bucket is configured
    Returns True if PDFs are available (either downloaded or already exist)
    """
    if not bucket_name:
        logger.info("GCS bucket not configured, skipping PDF download")
        return False
    
    manager = GCSPDFManager(bucket_name)
    
    # Check if PDFs already exist locally
    if manager.check_local_pdfs_exist():
        logger.info("📚 PDFs already exist locally, skipping download")
        return True
    
    # Download from GCS
    return manager.download_all_pdfs()
