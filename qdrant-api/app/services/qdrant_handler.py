import uuid
from typing import List
from qdrant_client import QdrantClient
from qdrant_client.http import models
from qdrant_client.models import PointStruct
from fastapi import status
from app.config import QDRANT_HOST, QDRANT_PORT, VECTOR_SIZE
from app.utils.logger import setup_logger

logger = setup_logger("QdrantHandler")

client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)


def create_collections(collection_name: str) -> bool:
    """
    Ensure collection exists; create if not.
    """
    if not isinstance(collection_name, str):
        raise ValueError("Collection name must be a string.")
    
    try:
        if not client.collection_exists(collection_name=collection_name):
            client.create_collection(
                collection_name=collection_name,
                hnsw_config=models.HnswConfigDiff(ef_construct=50),
                vectors_config=models.VectorParams(size=VECTOR_SIZE, distance=models.Distance.COSINE)
            )
            logger.info(f"Created collection '{collection_name}'")
        else:
            logger.info(f"Collection '{collection_name}' already exists.")
        return True
    except Exception as e:
        logger.error(f"Failed to create/check collection: {e}")
        return False


def add_data(collection_name: str, visitor_id: str, vector: List[float], timestamp: str) -> dict:
    """
    Add embedding vector with visitor_id and timestamp as payload.
    """
    try:
        point_id = str(uuid.uuid4())
        payload = {
            "visitor_id": visitor_id,
            "timestamp": timestamp
        }
        point = PointStruct(id=point_id, vector=vector, payload=payload)

        client.upsert(collection_name=collection_name, points=[point])
        logger.info(f"Vector added with ID {point_id} for visitor {visitor_id}")
        return {
            "message": f"Vector added with ID {point_id}",
            "status_code": status.HTTP_200_OK
        }

    except Exception as e:
        logger.error(f"Failed to add data: {e}")
        return {
            "error": str(e),
            "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR
        }

def add_data_AMS(collection_name: str, employee_id: str, vector: List[float], timestamp: str) -> dict:
    """
    Add embedding vector with employee_id and timestamp as payload.
    """
    try:
        point_id = str(uuid.uuid4())
        #point_id = employee_id
        payload = {
            "employee_id": employee_id,
            "timestamp": timestamp
        }
        point = PointStruct(id=point_id, vector=vector, payload=payload)

        client.upsert(collection_name=collection_name, points=[point])
        logger.info(f"Vector added with ID {point_id} for employee {employee_id}")
        return {
            "message": f"Vector added with ID {point_id}",
            "status_code": status.HTTP_200_OK
        }

    except Exception as e:
        logger.error(f"Failed to add data: {e}")
        return {
            "error": str(e),
            "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR
        }

def single_retrieval(collection_name: str, query_vector: List[float]) -> List[dict]:
    """
    Retrieve the most similar vector from the collection.
    """
    try:
        results = client.query_points(
            collection_name=collection_name,
            query=query_vector,
            limit=1,
            score_threshold=0.5,
            with_payload=True
        ).points
        logger.info(f"Retrieved {results} points for single retrieval")
        point = results[0] 
        return{ 
            
                "id": point.id,
                "score": point.score,
                "payload": point.payload
            }
        
        
    except Exception as e:
        logger.error(f"Single retrieval failed: {e}")
        raise


def batch_retrieval(collection_name: str, query_vectors: List[List[float]]) -> List[List[dict]]:
    """
    Perform batch retrieval (top-1 for each vector).
    """
    try:
        batch_queries = [
            models.QueryRequest(query=vector, limit=1, with_payload=True)
            for vector in query_vectors
        ]
        results = client.query_batch_points(collection_name=collection_name, requests=batch_queries)

        parsed = []
        for result in results:
            points = [
                {
                    "id": point.id,
                    "score": point.score,
                    "payload": point.payload
                } for point in result.points
            ]
            parsed.append(points)

        return parsed

    except Exception as e:
        logger.error(f"Batch retrieval failed: {e}")
        raise


# def delete_collection(collection_name: str):
#     """
#     Delete an entire Qdrant collection (for dev/debug).
#     """
#     try:
#         client.delete_collection(collection_name=collection_name)
#         logger.warning(f"Deleted collection '{collection_name}'")
#     except Exception as e:
#         logger.error(f"Failed to delete collection: {e}")
#         raise
