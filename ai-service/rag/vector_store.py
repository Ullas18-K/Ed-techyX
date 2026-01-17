import chromadb
from chromadb.config import Settings as ChromaSettings
from typing import List, Dict, Any, Optional
import logging

from config.settings import settings

logger = logging.getLogger(__name__)

class VectorStore:
    """ChromaDB-based vector store for NCERT document chunks."""
    
    def __init__(self):
        """Initialize ChromaDB client and collection."""
        try:
            self.client = chromadb.PersistentClient(
                path=settings.CHROMA_PERSIST_DIR,
                settings=ChromaSettings(
                    anonymized_telemetry=False,
                    allow_reset=True
                )
            )
            
            self.collection = self.client.get_or_create_collection(
                name=settings.VECTOR_COLLECTION_NAME,
                metadata={"description": "NCERT textbook embeddings for RAG"}
            )
            
            logger.info(f"Vector store initialized: {self.collection.count()} documents")
            
        except Exception as e:
            logger.error(f"Error initializing vector store: {e}")
            raise
    
    def add_documents(
        self,
        chunks: List[Dict[str, Any]],
        embeddings: List[List[float]]
    ) -> None:
        """
        Add document chunks with embeddings to the vector store.
        
        Args:
            chunks: List of chunk dicts with 'content' and 'metadata'
            embeddings: List of embedding vectors (same length as chunks)
        """
        try:
            if len(chunks) != len(embeddings):
                raise ValueError(f"Chunks ({len(chunks)}) and embeddings ({len(embeddings)}) must have same length")
            
            # Generate unique IDs
            existing_count = self.collection.count()
            ids = [f"chunk_{existing_count + i}" for i in range(len(chunks))]
            
            # Extract documents and metadata
            documents = [chunk["content"] for chunk in chunks]
            metadatas = [chunk["metadata"] for chunk in chunks]
            
            # Add to collection
            self.collection.add(
                ids=ids,
                embeddings=embeddings,  # type: ignore
                documents=documents,
                metadatas=metadatas
            )
            
            logger.info(f"Added {len(chunks)} documents to vector store")
            
        except Exception as e:
            logger.error(f"Error adding documents to vector store: {e}")
            raise
    
    def search(
        self,
        query_embedding: List[float],
        top_k: Optional[int] = None,
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, List]:
        """
        Search for similar documents using query embedding.
        
        Args:
            query_embedding: Query vector
            top_k: Number of results to return (defaults to settings.TOP_K_RESULTS)
            filters: Metadata filters (e.g., {"grade": 6, "subject": "science"})
            
        Returns:
            Dict with 'documents', 'metadatas', 'distances' lists
        """
        try:
            if top_k is None:
                top_k = settings.TOP_K_RESULTS
            
            # Build where clause for ChromaDB filters
            # ChromaDB requires: {"$and": [{"key": {"$eq": value}}, ...]} format
            where = None
            if filters:
                conditions = []
                for key, value in filters.items():
                    conditions.append({key: {"$eq": value}})
                
                if len(conditions) == 1:
                    where = conditions[0]
                elif len(conditions) > 1:
                    where = {"$and": conditions}
            
            # Query collection
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                where=where
            )
            
            # Return first result (since we only passed one query)
            return {
                "documents": results["documents"][0] if results["documents"] else [],
                "metadatas": results["metadatas"][0] if results["metadatas"] else [],
                "distances": results["distances"][0] if results["distances"] else []
            }
            
        except Exception as e:
            logger.error(f"Error searching vector store: {e}")
            raise
    
    def count(self) -> int:
        """Get total number of documents in the store."""
        return self.collection.count()
    
    def delete_all(self) -> None:
        """Delete all documents from the collection (use carefully!)."""
        try:
            # Get all IDs
            all_ids = self.collection.get()["ids"]
            
            if all_ids:
                self.collection.delete(ids=all_ids)
                logger.info(f"Deleted {len(all_ids)} documents from vector store")
            else:
                logger.info("Vector store is already empty")
                
        except Exception as e:
            logger.error(f"Error deleting documents: {e}")
            raise
    
    def get_stats(self) -> Dict[str, Any]:
        """Get statistics about the vector store."""
        try:
            count = self.collection.count()
            
            if count == 0:
                return {
                    "total_documents": 0,
                    "subjects": [],
                    "grades": []
                }
            
            # Get all metadata
            all_data = self.collection.get()
            metadatas = all_data["metadatas"]
            
            # Extract unique subjects and grades
            subjects = set()
            grades = set()
            
            if metadatas:
                for meta in metadatas:
                 if "subject" in meta:
                    subjects.add(meta["subject"])
                 if "grade" in meta:
                    grades.add(meta["grade"])
            
            return {
                "total_documents": count,
                "subjects": sorted(list(subjects)),
                "grades": sorted(list(grades))
            }
            
        except Exception as e:
            logger.error(f"Error getting stats: {e}")
            return {
                "total_documents": self.collection.count(),
                "subjects": [],
                "grades": [],
                "error": str(e)
            }
