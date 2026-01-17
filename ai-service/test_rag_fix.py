from rag.retriever import RAGRetriever

retriever = RAGRetriever()

print("Testing RAG retrieval WITHOUT filters...")
print("=" * 60)

query = "human eye definition explanation"
results = retriever.retrieve(
    query=query,
    grade=None,  # No filter
    subject=None,  # No filter
    top_k=3
)

print(f"Query: {query}")
print(f"Documents retrieved: {len(results['documents'])}")

if results['documents']:
    print("\nFirst document preview:")
    print(results['documents'][0][:300] + "...")
    print(f"\nMetadata: {results['metadatas'][0]}")
else:
    print("\nNO DOCUMENTS FOUND!")

print("\n" + "=" * 60)
print("Total context length:")
context = retriever.get_context_string(query, grade=None, subject=None, top_k=3)
print(f"{len(context)} characters")
print("\nContext preview:")
print(context[:500] + "...")
