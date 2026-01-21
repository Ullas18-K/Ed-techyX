from typing import List, Dict, Any, Optional
import logging
import os
import time
import vertexai
from google.cloud import aiplatform
from google.oauth2 import service_account
from vertexai.language_models import TextEmbeddingModel

from config.settings import settings
from rag.vector_store import VectorStore

logger = logging.getLogger(__name__)

class RAGRetriever:
    """Retrieve relevant context from NCERT documents using RAG."""
    
    def __init__(self):
        """Initialize Vertex AI and vector store."""
        try:
            # Initialize Vertex AI with explicit credentials
            self.embedding_model = None
            
            logger.info(f"Initializing RAG Retriever...")
            logger.info(f"GCP_PROJECT_ID: {settings.GCP_PROJECT_ID}")
            logger.info(f"GOOGLE_APPLICATION_CREDENTIALS: {settings.GOOGLE_APPLICATION_CREDENTIALS}")
            
            if settings.GCP_PROJECT_ID and settings.GOOGLE_APPLICATION_CREDENTIALS:
                # Load credentials explicitly
                if os.path.exists(settings.GOOGLE_APPLICATION_CREDENTIALS):
                    logger.info(f"Loading credentials from: {settings.GOOGLE_APPLICATION_CREDENTIALS}")
                    credentials = service_account.Credentials.from_service_account_file(
                        settings.GOOGLE_APPLICATION_CREDENTIALS
                    )
                    
                    # Initialize Vertex AI with credentials
                    logger.info("Initializing Vertex AI...")
                    vertexai.init(
                        project=settings.GCP_PROJECT_ID,
                        location=settings.GCP_LOCATION,
                        credentials=credentials
                    )
                    logger.info(f"Vertex AI initialized: {settings.GCP_PROJECT_ID}")
                    
                    # Initialize embedding model
                    try:
                        logger.info(f"Loading embedding model: {settings.EMBEDDING_MODEL}")
                        self.embedding_model = TextEmbeddingModel.from_pretrained(
                            settings.EMBEDDING_MODEL
                        )
                        logger.info(f"✅ Loaded embedding model: {settings.EMBEDDING_MODEL}")
                    except Exception as e:
                        logger.error(f"❌ Failed to load embedding model: {e}")
                        logger.exception("Full traceback:")
                else:
                    logger.error(f"❌ Credentials file not found: {settings.GOOGLE_APPLICATION_CREDENTIALS}")
            else:
                logger.warning("⚠️ GCP_PROJECT_ID or credentials not set - embeddings will use mock mode")
            
            # Initialize vector store
            self.vector_store = VectorStore()
            
        except Exception as e:
            logger.error(f"Error initializing RAG retriever: {e}")
            logger.exception("Full traceback:")
            raise
    
    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Get embeddings for a list of texts using Vertex AI.
        
        Args:
            texts: List of text strings to embed
            
        Returns:
            List of embedding vectors
        """
        if not self.embedding_model:
            raise ValueError("Embedding model not initialized - check GCP_PROJECT_ID")
        
        try:
            # Adaptive rate limiting - process one at a time, adjust delay based on quota errors
            batch_size = 1
            all_embeddings = []
            current_delay = 1.0  # Start with 1 second delay (quota-aware)
            
            logger.info(f"Processing {len(texts)} texts with adaptive rate limiting...")
            logger.info(f"⏱️ Estimated time: ~{len(texts) * current_delay // 60} minutes (will adjust if quota hit)")
            
            for i in range(0, len(texts), batch_size):
                batch = texts[i:i + batch_size]
                
                # Only delay after first request
                if i > 0:
                    time.sleep(current_delay)
                
                # Retry logic with quota-aware backoff
                max_retries = 5
                quota_hit = False
                
                for attempt in range(max_retries):
                    try:
                        # Get embeddings
                        embeddings = self.embedding_model.get_embeddings(batch)  # type: ignore
                        
                        # Extract values
                        batch_embeddings = [emb.values for emb in embeddings]
                        all_embeddings.extend(batch_embeddings)
                        
                        # Success! Gradually speed up if no quota errors
                        if not quota_hit and current_delay > 1.0:
                            current_delay = max(1.0, current_delay * 0.9)  # Reduce delay by 10%
                        
                        # Progress update every 10 texts
                        if (i + 1) % 10 == 0 or i == 0:
                            logger.info(f"✅ Progress: {len(all_embeddings)}/{len(texts)} (delay: {current_delay:.1f}s)")
                        break  # Success, exit retry loop
                        
                    except Exception as e:
                        if "429" in str(e) or "Quota exceeded" in str(e):
                            quota_hit = True
                            if attempt < max_retries - 1:
                                # Exponential backoff for retries
                                wait_time = (attempt + 1) * 30  # 30, 60, 90, 120, 150 seconds
                                logger.warning(f"⚠️ Quota exceeded at {len(all_embeddings)}/{len(texts)}")
                                logger.warning(f"   Waiting {wait_time}s before retry {attempt + 2}/{max_retries}...")
                                time.sleep(wait_time)
                                
                                # Increase delay for future requests after quota error
                                current_delay = min(5.0, current_delay * 1.5)  # Slow down by 50%, max 5s
                            else:
                                logger.error(f"❌ Failed after {max_retries} retries at {len(all_embeddings)}/{len(texts)}")
                                logger.error(f"   Processed {len(all_embeddings)} embeddings successfully before failure")
                                raise
                        else:
                            raise  # Re-raise non-quota errors immediately
            
            logger.info(f"🎉 Generated all {len(all_embeddings)} embeddings successfully!")
            return all_embeddings
            
        except Exception as e:
            logger.error(f"Error generating embeddings: {e}")
            raise
    
    def add_documents(self, chunks: List[Dict[str, Any]]) -> None:
        """
        Add document chunks to the vector store in batches to manage memory.
        
        Args:
            chunks: List of chunks with 'content' and 'metadata'
        """
        import gc  # Import garbage collector
        
        try:
            batch_size = 50  # Process 50 chunks at a time to manage memory
            total_chunks = len(chunks)
            
            logger.info(f"📦 Adding {total_chunks} chunks in batches of {batch_size}...")
            
            for i in range(0, total_chunks, batch_size):
                batch = chunks[i:i + batch_size]
                batch_num = (i // batch_size) + 1
                total_batches = (total_chunks + batch_size - 1) // batch_size
                
                logger.info(f"🔄 Processing batch {batch_num}/{total_batches} ({len(batch)} chunks)...")
                
                # Extract text content for this batch
                texts = [chunk["content"] for chunk in batch]
                
                # Generate embeddings for this batch
                embeddings = self.get_embeddings(texts)
                
                # Add to vector store
                self.vector_store.add_documents(batch, embeddings)
                
                logger.info(f"✅ Batch {batch_num}/{total_batches} added ({i + len(batch)}/{total_chunks} total)")
                
                # Force garbage collection after each batch to free memory
                gc.collect()
            
            logger.info(f"🎉 Successfully added all {total_chunks} chunks to vector store")
            
        except Exception as e:
            logger.error(f"❌ Error adding documents: {e}")
            raise
    
    def retrieve(
        self,
        query: str,
        grade: Optional[int] = None,
        subject: Optional[str] = None,
        top_k: Optional[int] = None,
        doc_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Retrieve relevant context for a query.
        
        Args:
            query: Search query string
            grade: Filter by grade level
            subject: Filter by subject
            top_k: Number of results to return
            doc_type: Filter by document type ("pyq", "ncert", or None for all)
            
        Returns:
            Dict with retrieved documents, metadata, and distances
        """
        try:
            # Generate query embedding
            query_embeddings = self.get_embeddings([query])
            query_embedding = query_embeddings[0]
            
            # Build filters
            filters = {}
            if grade is not None:
                filters["grade"] = grade
            if subject is not None:
                filters["subject"] = subject.lower()
            if doc_type is not None:
                filters["doc_type"] = doc_type  # Changed from "type" to "doc_type"
            
            logger.info(f"🔎 RAG Retriever - Query: '{query[:50]}', Filters: {filters}, Top K: {top_k or 5}")
            
            # Search vector store
            results = self.vector_store.search(
                query_embedding=query_embedding,
                top_k=top_k or 5,
                filters=filters if filters else None
            )
            
            logger.info(f"📦 Vector Store returned: {len(results.get('documents', []))} docs, {len(results.get('metadatas', []))} metadata")
            if results.get('metadatas') and len(results['metadatas']) > 0:
                logger.info(f"🔍 First metadata: {results['metadatas'][0]}")
            
            logger.info(f"Retrieved {len(results['documents'])} documents for query: '{query[:50]}...'")
            
            return results
            
        except Exception as e:
            logger.error(f"Error retrieving documents: {e}")
            raise
    
    def get_context_string(
        self,
        query: str,
        grade: Optional[int] = None,
        subject: Optional[str] = None,
        top_k: Optional[int] = None
    ) -> str:
        """
        Retrieve relevant context and format as a single string.
        
        Args:
            query: Search query
            grade: Filter by grade
            subject: Filter by subject
            top_k: Number of results
            
        Returns:
            Formatted context string ready for prompt
        """
        results = self.retrieve(query, grade, subject, top_k)
        
        if not results["documents"]:
            logger.warning("No documents found for query")
            return "No relevant NCERT content found."
        
        # Format documents with metadata
        context_parts = []
        for i, (doc, meta) in enumerate(zip(results["documents"], results["metadatas"]), 1):
            source = f"Grade {meta.get('grade', '?')} {meta.get('subject', '?').title()}"
            context_parts.append(f"[Source {i}: {source}]\n{doc}\n")
        
        return "\n".join(context_parts)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get statistics about the vector store."""
        return self.vector_store.get_stats()
