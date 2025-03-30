from fastapi import APIRouter
from api.routes import conversation, sandbox

api_router = APIRouter(prefix="/api")

# Include route modules
api_router.include_router(conversation.router, prefix="/conversation", tags=["conversation"])
api_router.include_router(sandbox.router, prefix="/sandbox", tags=["sandbox"])