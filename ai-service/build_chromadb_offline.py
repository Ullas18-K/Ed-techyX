"""
Offline ChromaDB Builder for EdTech RAG System

This script processes NCERT PDFs locally and creates a complete ChromaDB
that can be uploaded to GCS and downloaded by the Render service.

USAGE:
1. Place your NCERT PDFs in ./ncert_pdfs/ (same structure as before)
2. Set environment variables (copy from .env)
3. Run: python build_chromadb_offline.py
4. Upload generated chroma_db/ folder to GCS
5. Deploy service - it will download the pre-built DB

This solves the memory issue by doing heavy processing offline.
"""

import os
import sys
import logging
from pathlib import Path
from dotenv import load_dotenv
import gc

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Add ai-service to path
sys.path.insert(0, str(Path(__file__).parent))

from rag.retriever import RAGRetriever
from rag.pdf_processor import PDFProcessor

def build_vector_database_offline(pdf_directory: str = "./ncert_pdfs", output_dir: str = "./chroma_db"):
    """
    Build ChromaDB offline by processing all PDFs.
    
    Args:
        pdf_directory: Directory containing NCERT PDFs
        output_dir: Where to save the ChromaDB (will be uploaded to GCS)
    """
    try:
        logger.info("=" * 80)
        logger.info("🚀 OFFLINE CHROMADB BUILDER")
        logger.info("=" * 80)
        
        # Verify environment variables
        required_vars = ["GCP_PROJECT_ID", "GOOGLE_APPLICATION_CREDENTIALS"]
        missing = [v for v in required_vars if not os.getenv(v)]
        if missing:
            logger.error(f"❌ Missing environment variables: {missing}")
            logger.error("Please set them in .env file or environment")
            return False
        
        logger.info(f"📁 PDF Directory: {pdf_directory}")
        logger.info(f"💾 Output Directory: {output_dir}")
        logger.info("")
        
        # Initialize RAG retriever
        logger.info("🔧 Initializing RAG Retriever...")
        rag = RAGRetriever()
        logger.info("✅ RAG Retriever initialized")
        logger.info("")
        
        # Find all PDFs
        pdf_dir = Path(pdf_directory)
        if not pdf_dir.exists():
            logger.error(f"❌ Directory not found: {pdf_directory}")
            return False
        
        pdf_files = list(pdf_dir.rglob("*.pdf"))
        logger.info(f"📚 Found {len(pdf_files)} PDF files")
        logger.info("")
        
        if not pdf_files:
            logger.error("❌ No PDF files found")
            return False
        
        # Initialize processor
        processor = PDFProcessor()
        
        total_chunks = 0
        successful_pdfs = 0
        
        # Process each PDF individually
        for idx, pdf_path in enumerate(pdf_files, 1):
            try:
                logger.info(f"📖 [{idx}/{len(pdf_files)}] Processing: {pdf_path.name}")
                
                # Extract metadata from path
                parts = pdf_path.parts
                grade = None
                subject = pdf_path.stem.lower()
                
                for part in parts:
                    if "class" in part.lower():
                        try:
                            grade = int(part.lower().replace("class_", "").replace("class", ""))
                        except:
                            pass
                
                if grade is None:
                    logger.warning(f"   ⚠️ Could not determine grade, skipping")
                    continue
                
                # Process PDF
                chunks = processor.process_pdf(
                    str(pdf_path),
                    grade=grade,
                    subject=subject,
                    chapter=pdf_path.stem
                )
                
                if not chunks:
                    logger.warning(f"   ⚠️ No chunks extracted")
                    continue
                
                logger.info(f"   📦 Extracted {len(chunks)} chunks")
                
                # Add to vector store (with batching internally)
                logger.info(f"   🔄 Generating embeddings and adding to vector store...")
                rag.add_documents(chunks)
                
                total_chunks += len(chunks)
                successful_pdfs += 1
                
                logger.info(f"   ✅ Added successfully (Total: {total_chunks} chunks)")
                logger.info("")
                
                # Garbage collection
                gc.collect()
                
            except Exception as e:
                logger.error(f"   ❌ Error: {e}")
                continue
        
        # Final statistics
        logger.info("=" * 80)
        logger.info("📊 PROCESSING COMPLETE")
        logger.info("=" * 80)
        logger.info(f"✅ Successful PDFs: {successful_pdfs}/{len(pdf_files)}")
        logger.info(f"📦 Total chunks: {total_chunks}")
        
        # Get vector store stats
        stats = rag.get_stats()
        logger.info(f"🗂️  Subjects: {stats.get('subjects', [])}")
        logger.info(f"🎓 Grades: {stats.get('grades', [])}")
        logger.info(f"💾 Database location: {output_dir}")
        logger.info("")
        
        # Next steps
        logger.info("=" * 80)
        logger.info("📤 NEXT STEPS - UPLOAD TO GCS")
        logger.info("=" * 80)
        logger.info("1. Your ChromaDB is ready in: ./chroma_db/")
        logger.info("2. Upload it to GCS bucket:")
        logger.info("")
        logger.info("   Using gsutil (recommended):")
        logger.info("   gsutil -m cp -r ./chroma_db gs://YOUR-BUCKET-NAME/")
        logger.info("")
        logger.info("   Or use GCS Console:")
        logger.info("   - Go to https://console.cloud.google.com/storage")
        logger.info("   - Select your bucket")
        logger.info("   - Upload chroma_db folder")
        logger.info("")
        logger.info("3. Update your Render service:")
        logger.info("   - Set env var: GCS_CHROMADB_PATH=chroma_db")
        logger.info("   - Redeploy service")
        logger.info("")
        logger.info("✅ Done! Your service will download this pre-built database on startup.")
        logger.info("=" * 80)
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Fatal error: {e}")
        logger.exception("Traceback:")
        return False

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Build ChromaDB offline for EdTech RAG")
    parser.add_argument(
        "--pdf-dir",
        default="./ncert_pdfs",
        help="Directory containing NCERT PDFs (default: ./ncert_pdfs)"
    )
    parser.add_argument(
        "--output-dir",
        default="./chroma_db",
        help="Output directory for ChromaDB (default: ./chroma_db)"
    )
    
    args = parser.parse_args()
    
    success = build_vector_database_offline(args.pdf_dir, args.output_dir)
    
    if success:
        logger.info("🎉 SUCCESS!")
        sys.exit(0)
    else:
        logger.error("💥 FAILED!")
        sys.exit(1)
