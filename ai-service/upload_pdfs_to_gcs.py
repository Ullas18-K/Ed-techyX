#!/usr/bin/env python3
"""
Upload NCERT PDFs to Google Cloud Storage
Run this locally to upload your PDFs to GCS
"""

import os
from pathlib import Path
from google.cloud import storage
from google.oauth2 import service_account

# Configuration
PROJECT_ID = "ringed-enigma-482810-k8"
BUCKET_NAME = "edtech-ncert-pdfs"  # Change if you want a different name
CREDENTIALS_PATH = "./gcp-keys/service-account.json"

# Directories to upload
PDF_DIRECTORIES = [
    "./ncert_pdfs/class_9",
    "./ncert_pdfs/class_10",
    "./pyqs/pdfs"
]

def create_bucket_if_not_exists(storage_client, bucket_name, project_id):
    """Create bucket if it doesn't exist"""
    try:
        bucket = storage_client.get_bucket(bucket_name)
        print(f"✅ Bucket '{bucket_name}' already exists")
        return bucket
    except:
        print(f"📦 Creating bucket '{bucket_name}'...")
        bucket = storage_client.create_bucket(bucket_name, project=project_id, location="us-central1")
        print(f"✅ Bucket '{bucket_name}' created")
        return bucket

def upload_directory(storage_client, bucket_name, local_dir, gcs_prefix):
    """Upload all PDFs from a directory to GCS"""
    bucket = storage_client.bucket(bucket_name)
    local_path = Path(local_dir)
    
    if not local_path.exists():
        print(f"⚠️ Directory not found: {local_dir}")
        return 0
    
    pdf_files = list(local_path.rglob("*.pdf"))
    
    if not pdf_files:
        print(f"⚠️ No PDF files found in {local_dir}")
        return 0
    
    print(f"\n📤 Uploading {len(pdf_files)} PDFs from {local_dir}...")
    
    uploaded = 0
    for pdf_file in pdf_files:
        # Get relative path
        relative_path = pdf_file.relative_to(local_path)
        gcs_path = f"{gcs_prefix}/{relative_path}".replace("\\", "/")
        
        # Upload
        blob = bucket.blob(gcs_path)
        
        # Skip if already exists and same size
        if blob.exists():
            if blob.size == pdf_file.stat().st_size:
                print(f"  ⏭️ Skipping (already exists): {gcs_path}")
                continue
        
        blob.upload_from_filename(str(pdf_file))
        print(f"  ✅ Uploaded: {gcs_path}")
        uploaded += 1
    
    return uploaded

def main():
    print("🚀 NCERT PDF Uploader to Google Cloud Storage\n")
    
    # Load credentials
    if not os.path.exists(CREDENTIALS_PATH):
        print(f"❌ Credentials file not found: {CREDENTIALS_PATH}")
        print("Please download your service account key and save it to gcp-keys/service-account.json")
        return
    
    credentials = service_account.Credentials.from_service_account_file(CREDENTIALS_PATH)
    storage_client = storage.Client(credentials=credentials, project=PROJECT_ID)
    
    # Create bucket
    bucket = create_bucket_if_not_exists(storage_client, BUCKET_NAME, PROJECT_ID)
    
    # Upload directories
    total_uploaded = 0
    
    for local_dir in PDF_DIRECTORIES:
        # Extract prefix (e.g., "class_9", "class_10", "pyqs")
        dir_name = Path(local_dir).name
        parent_name = Path(local_dir).parent.name
        gcs_prefix = f"{parent_name}/{dir_name}" if parent_name != "." else dir_name
        
        uploaded = upload_directory(storage_client, BUCKET_NAME, local_dir, gcs_prefix)
        total_uploaded += uploaded
    
    print(f"\n✅ Upload Complete!")
    print(f"📊 Total files uploaded: {total_uploaded}")
    print(f"🪣 Bucket: gs://{BUCKET_NAME}")
    print(f"\n💡 Next step: Add GCS_BUCKET_NAME={BUCKET_NAME} to your Render environment variables")

if __name__ == "__main__":
    main()
