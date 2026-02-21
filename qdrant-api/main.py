from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.api.endpoints import router as api_router
from app.config import COLLECTION_NAME, COLLECTION_NAME_AMS
from app.services.qdrant_handler import create_collections
from app.utils.logger import setup_logger

logger = setup_logger("Main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    try:
        created = create_collections(COLLECTION_NAME_AMS)
        if created:
            logger.info(f"Qdrant collection '{COLLECTION_NAME_AMS}' created or already exists.")
        else:
            logger.warning(f"Failed to create collection '{COLLECTION_NAME_AMS}'.")
    except Exception as e:
        logger.error(f"Error while creating collection: {e}")
    
    yield

    # Add shutdown logic here if needed
    # logger.info("Shutting down...")

app = FastAPI(lifespan=lifespan)

# Register your API routes
app.include_router(api_router)
