import os

QDRANT_HOST = os.getenv("QDRANT_HOST", "qdrant-api-container")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", 8000))
COLLECTION_NAME = os.getenv("QDRANT_COLLECTION", "vector-embeddings")
COLLECTION_NAME_AMS = os.getenv("QDRANT_COLLECTION", "vector-embeddings_AMS")
VECTOR_SIZE = int(os.getenv("VECTOR_SIZE", 512))
