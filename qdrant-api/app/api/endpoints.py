from fastapi import APIRouter, HTTPException
from app.models.search import Data, SearchRequest, DataAMS
from app.services.qdrant_handler import add_data, add_data_AMS, single_retrieval, batch_retrieval
from app.config import COLLECTION_NAME, COLLECTION_NAME_AMS
from app.utils.logger import setup_logger
from datetime import datetime, timezone

router = APIRouter()
logger = setup_logger("Qdrant-FastAPI")

@router.post("/embedding")
def add_embedding(data: Data):
    """
    Adds a new embedding to the Qdrant collection.
    Payload format:
    {
        "visitor_id": UUID format,
        "embedding": [0.1, -0.2, ..., 0.4]
    }
    """
    try:
        if not hasattr(data, "embedding") or len(data.embedding) == 0:
            raise ValueError("Embedding is missing or empty.")

        timestamp = datetime.now(timezone.utc).isoformat()
        response = add_data(COLLECTION_NAME, data.visitor_id, data.embedding, timestamp)
        return response
    except Exception as e:
        logger.error(f"Error adding embedding: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/embedding_AMS")
def add_embedding(data: DataAMS):
    """
    Adds a new embedding to the Qdrant collection.
    Payload format:
    {
        "employee_id": UUID format,
        "embedding": [0.1, -0.2, ..., 0.4]
    }
    """
    try:
        if not hasattr(data, "embedding") or len(data.embedding) == 0:
            raise ValueError("Embedding is missing or empty.")

        timestamp = datetime.now(timezone.utc).isoformat()
        response = add_data_AMS(COLLECTION_NAME_AMS, data.employee_id, data.embedding, timestamp)
        return response
    except Exception as e:
        logger.error(f"Error adding embedding: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/retrieval/single")
def search_single(req: SearchRequest):
    """
    Returns the most similar vector match from Qdrant.
    Payload format:
    {
        "embedding": [0.1, -0.2, ..., 0.4]
    }
    """
    try:
        return single_retrieval(COLLECTION_NAME, req.embedding)
    except Exception as e:
        logger.error(f"Error retrieving match: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/retrieval/single_AMS")
def search_single(req: SearchRequest):
    """
    Returns the most similar vector match from Qdrant.
    Payload format:
    {
        "embedding": [0.1, -0.2, ..., 0.4]
    }
    """
    try:
        return single_retrieval(COLLECTION_NAME_AMS, req.embedding)
    except Exception as e:
        logger.error(f"Error retrieving match: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/retrieval/batch")
def search_batch(req: list[SearchRequest]):
    """
    Returns the closest matches for multiple embeddings.
    Payload format:
    [
        {"embedding": [...]},
        {"embedding": [...]}
    ]
    """
    try:
        embeddings = [r.embedding for r in req]
        return batch_retrieval(COLLECTION_NAME, embeddings)
    except Exception as e:
        logger.error(f"Error in batch retrieval: {e}")
        raise HTTPException(status_code=500, detail=str(e))
