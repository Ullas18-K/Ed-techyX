from typing import List, Dict, Any
import os
import logging
from pathlib import Path
from PyPDF2 import PdfReader

logger = logging.getLogger(__name__)

class PDFProcessor:
    """Process NCERT PDF files into chunks for RAG."""
    
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        """
        Initialize PDF processor.
        
        Args:
            chunk_size: Target size of each text chunk (characters)
            chunk_overlap: Overlap between chunks (characters)
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
    
    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """
        Extract all text from a PDF file.
        
        Args:
            pdf_path: Path to PDF file
            
        Returns:
            Extracted text as string
        """
        try:
            reader = PdfReader(pdf_path)
            text = ""
            
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            
            logger.info(f"Extracted {len(text)} characters from {pdf_path}")
            return text
            
        except Exception as e:
            logger.error(f"Error extracting text from {pdf_path}: {e}")
            raise
    
    def create_chunks(self, text: str, metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Split text into overlapping chunks.
        
        Args:
            text: Full text to chunk
            metadata: Metadata to attach to each chunk (grade, subject, etc.)
            
        Returns:
            List of chunk dicts with 'content' and 'metadata'
        """
        chunks = []
        text_length = len(text)
        
        start = 0
        chunk_id = 0
        
        while start < text_length:
            # Calculate end position
            end = min(start + self.chunk_size, text_length)
            
            # Extract chunk
            chunk_text = text[start:end].strip()
            
            if chunk_text:
                chunks.append({
                    "content": chunk_text,
                    "metadata": {
                        **metadata,
                        "chunk_id": chunk_id,
                        "start_char": start,
                        "end_char": end
                    }
                })
                chunk_id += 1
            
            # Move start position with overlap
            start += self.chunk_size - self.chunk_overlap
        
        logger.info(f"Created {len(chunks)} chunks from text")
        return chunks
    
    def process_pdf(
        self,
        pdf_path: str,
        grade: int,
        subject: str,
        chapter: str = ""
    ) -> List[Dict[str, Any]]:
        """
        Process a PDF file into chunks with metadata.
        
        Args:
            pdf_path: Path to PDF file
            grade: Grade level (e.g., 6, 7, 8)
            subject: Subject name (e.g., "science", "mathematics")
            chapter: Chapter name/number (optional)
            
        Returns:
            List of chunk dicts ready for embedding
        """
        try:
            # Extract filename
            filename = os.path.basename(pdf_path)
            
            # Extract text
            text = self.extract_text_from_pdf(pdf_path)
            
            # Create metadata
            metadata = {
                "grade": grade,
                "subject": subject,
                "chapter": chapter,
                "filename": filename,
                "source": pdf_path
            }
            
            # Create chunks
            chunks = self.create_chunks(text, metadata)
            
            logger.info(f"Processed {filename}: {len(chunks)} chunks created")
            return chunks
            
        except Exception as e:
            logger.error(f"Error processing PDF {pdf_path}: {e}")
            raise
    
    def process_directory(
        self,
        directory: str,
        grade: int,
        subject: str
    ) -> List[Dict[str, Any]]:
        """
        Process all PDFs in a directory.
        
        Args:
            directory: Path to directory containing PDFs
            grade: Grade level
            subject: Subject name
            
        Returns:
            List of all chunks from all PDFs
        """
        all_chunks = []
        
        try:
            # Get all PDF files
            pdf_files = [f for f in os.listdir(directory) if f.lower().endswith('.pdf')]
            
            logger.info(f"Found {len(pdf_files)} PDF files in {directory}")
            
            # Process each PDF
            for pdf_file in pdf_files:
                pdf_path = os.path.join(directory, pdf_file)
                
                # Extract chapter from filename (if numbered)
                chapter = pdf_file.replace('.pdf', '')
                
                chunks = self.process_pdf(pdf_path, grade, subject, chapter)
                all_chunks.extend(chunks)
            
            logger.info(f"Processed {len(pdf_files)} PDFs: {len(all_chunks)} total chunks")
            return all_chunks
            
        except Exception as e:
            logger.error(f"Error processing directory {directory}: {e}")
            raise

def process_ncert_directory(directory: str) -> List[Dict[str, Any]]:
    """
    Process all PDF files in a directory.
    
    Expected directory structure:
    ncert_pdfs/
      class_6/
        science.pdf
        maths.pdf
      class_7/
        science.pdf
    
    Args:
        directory: Path to directory containing NCERT PDFs
        
    Returns:
        List of all chunks from all PDFs
    """
    import gc  # Import garbage collector for memory management
    
    processor = PDFProcessor()
    all_chunks = []
    
    pdf_dir = Path(directory)
    
    if not pdf_dir.exists():
        logger.warning(f"Directory {directory} does not exist")
        return all_chunks
    
    # Find all PDF files
    pdf_files = list(pdf_dir.rglob("*.pdf"))
    
    logger.info(f"📚 Found {len(pdf_files)} PDF files in {directory}")
    
    for idx, pdf_path in enumerate(pdf_files, 1):
        try:
            logger.info(f"📄 Processing {idx}/{len(pdf_files)}: {pdf_path.name}")
            
            # Extract grade and subject from path
            # Example: ncert_pdfs/class_6/science.pdf
            parts = pdf_path.parts
            
            # Try to extract grade from parent directory
            grade = None
            subject = pdf_path.stem.lower()  # filename without extension
            
            for part in parts:
                if "class" in part.lower():
                    try:
                        grade = int(part.lower().replace("class_", "").replace("class", ""))
                    except:
                        pass
            
            if grade is None:
                logger.warning(f"⚠️  Could not determine grade for {pdf_path}, skipping")
                continue
            
            metadata = {
                "grade": grade,
                "subject": subject,
                "source": str(pdf_path),
                "book_name": pdf_path.stem
            }
            
            # Process PDF
            chunks = processor.process_pdf(
                str(pdf_path),
                grade=metadata["grade"],
                subject=metadata["subject"],
                chapter=metadata.get("book_name", "")
            )
            all_chunks.extend(chunks)
            
            logger.info(f"✅ {pdf_path.name}: {len(chunks)} chunks created (Total: {len(all_chunks)})")
            
            # Force garbage collection after each PDF to free memory
            gc.collect()
            
        except Exception as e:
            logger.error(f"❌ Error processing {pdf_path}: {e}")
            continue
    
    logger.info(f"🎉 Processed {len(pdf_files)} PDFs into {len(all_chunks)} total chunks")
    
    return all_chunks
