from rag.vector_store import VectorStore

vs = VectorStore()
stats = vs.get_stats()

print(f"Total docs: {stats['total_documents']}")
print(f"Subjects: {stats['subjects']}")
print(f"Grades: {stats['grades']}")

# Get sample documents
sample = vs.collection.get(limit=3)
print(f"\nSample metadatas:")
for i, meta in enumerate(sample['metadatas'], 1):
    print(f"{i}. {meta}")

# Test query with filters
print("\n--- Testing query with filters ---")
test_filters = {"grade": 10, "subject": "science"}
print(f"Filters: {test_filters}")

# Show what the where clause looks like
conditions = []
for key, value in test_filters.items():
    conditions.append({key: {"$eq": value}})

if len(conditions) > 1:
    where = {"$and": conditions}
else:
    where = conditions[0]

print(f"Where clause: {where}")

# Try the actual query
try:
    results = vs.collection.get(where=where, limit=5)
    print(f"Results: {len(results['ids'])} documents found")
    if results['metadatas']:
        print(f"First result metadata: {results['metadatas'][0]}")
except Exception as e:
    print(f"Error: {e}")
