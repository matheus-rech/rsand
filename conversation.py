from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
import logging
from models.conversation import ConversationRequest, ConversationResponse
from services.conversation_service import ConversationService
from api.dependencies import get_conversation_service

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/", response_model=ConversationResponse)
async def create_message(
    request: ConversationRequest,
    conversation_service: ConversationService = Depends(get_conversation_service)
):
    """Create a new message in a conversation"""
    try:
        conversation, response = await conversation_service.process_user_message(
            conversation_id=request.conversation_id,
            message_content=request.message
        )
        
        return ConversationResponse(
            conversation=conversation,
            response=response
        )
    except Exception as e:
        logger.error(f"Error creating message: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error processing message: {str(e)}")