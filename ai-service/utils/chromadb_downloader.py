"""
Download pre-built ChromaDB from Google Cloud Storage.

This module handles downloading a complete ChromaDB database that was
built offline, avoiding the memory-intensive PDF processing on Render.
"""

import os
import logging
from pathlib import Path
from google.cloud import storage

logger = logging.getLogger(__name__)

def download_chromadb_from_gcs(bucket_name: str, remote_path: str = "chroma_db", local_path: str = "./chroma_db") -> bool:
    """
    Download pre-built ChromaDB from Google Cloud Storage.
    
    Args:
        bucket_name: GCS bucket name
        remote_path: Path to chroma_db folder in GCS bucket
        local_path: Local directory to download to
        
    Returns:
        True if successful, False otherwise
    """
    try:
        logger.info(f"📦 Downloading ChromaDB from GCS bucket: {bucket_name}")
        logger.info(f"   Remote path: {remote_path}")
        logger.info(f"   Local path: {local_path}")
        
        # Create local directory
        local_dir = Path(local_path)
        local_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize GCS client
        client = storage.Client()
        bucket = client.bucket(bucket_name)
        
        # List all files in the remote chroma_db folder
        blobs = list(bucket.list_blobs(prefix=f"{remote_path}/"))
        
        if not blobs:
            logger.warning(f"⚠️  No files found in gs://{bucket_name}/{remote_path}/")
            logger.warning("   Did you upload the ChromaDB yet?")
            return False
        
        logger.info(f"📁 Found {len(blobs)} files to download")
        
        # Download each file
        downloaded = 0
        for blob in blobs:
            # Skip directory markers
            if blob.name.endswith('/'):
                continue
            
            # Calculate local file path
            relative_path = blob.name.replace(f"{remote_path}/", "")
            local_file = local_dir / relative_path
            
            # Create parent directories
            local_file.parent.mkdir(parents=True, exist_ok=True)
            
            # Download file
            blob.download_to_filename(str(local_file))
            downloaded += 1
            
            if downloaded % 10 == 0:
                logger.info(f"   Downloaded {downloaded}/{len(blobs)} files...")
        
        logger.info(f"✅ Successfully downloaded {downloaded} files")
        logger.info(f"💾 ChromaDB ready at: {local_path}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Error downloading ChromaDB from GCS: {e}")
        logger.exception("Traceback:")
        return False

def chromadb_exists_locally(path: str = "./chroma_db") -> bool:
    """
    Check if ChromaDB already exists locally.
    
    Args:
        path: Local ChromaDB directory path
        
    Returns:
        True if ChromaDB exists and has files
    """
    chroma_dir = Path(path)
    
    if not chroma_dir.exists():
        return False
    
    # Check for chroma.sqlite3 file (main ChromaDB file)
    sqlite_file = chroma_dir / "chroma.sqlite3"
    return sqlite_file.exists()
