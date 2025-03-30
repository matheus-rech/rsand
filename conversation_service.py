import logging
import uuid
from typing import Dict, List, Optional
from datetime import datetime

from models.conversation import Conversation, Message, MessageRole, AssistantResponse, CodeBlock
from services.claude_service import ClaudeService
from services.sandbox_service import SandboxService

logger = logging.getLogger(__name__)

class ConversationService:
    """Service for managing conversations"""
    
    def __init__(self, claude_service: ClaudeService, sandbox_service: SandboxService):
        """Initialize the conversation service"""
        self.claude_service = claude_service
        self.sandbox_service = sandbox_service
        
        # In-memory store of conversations
        # In a production app, this would be a database
        self.conversations: Dict[str, Conversation] = {}
        
    def get_conversation(self, conversation_id: str) -> Optional[Conversation]:
        """Get a conversation by ID"""
        return self.conversations.get(conversation_id)
        
    def create_conversation(self) -> Conversation:
        """Create a new conversation"""
        conversation_id = str(uuid.uuid4())
        conversation = Conversation(id=conversation_id)
        self.conversations[conversation_id] = conversation
        return conversation
        
    def add_message(self, conversation_id: str, role: MessageRole, content: str) -> Message:
        """Add a message to a conversation"""
        conversation = self.get_conversation(conversation_id)
        if not conversation:
            conversation = self.create_conversation()
            
        message = Message(
            role=role,
            content=content
        )
        
        conversation.messages.append(message)
        conversation.updated_at = datetime.now()
        
        # Update the conversation
        self.conversations[conversation.id] = conversation
        
        return message
    
    async def process_user_message(self, conversation_id: Optional[str], message_content: str) -> tuple[Conversation, AssistantResponse]:
        """Process a user message and generate a response"""
        # Get or create conversation
        conversation = self.get_conversation(conversation_id) if conversation_id else None
        if not conversation:
            conversation = self.create_conversation()
            
        # Add user message
        user_message = self.add_message(
            conversation_id=conversation.id,
            role=MessageRole.USER,
            content=message_content
        )
        
        # Generate response from Claude
        response_text, code_blocks = await self.claude_service.generate_response(conversation.messages)
        
        # Execute code blocks in sandbox if any
        execution_result = None
        if code_blocks:
            try:
                # Execute the first code block for now
                # Could be extended to execute multiple blocks sequentially
                code_to_execute = code_blocks[0].code
                execution_result = await self.sandbox_service.execute_code(code_to_execute)
            except Exception as e:
                logger.error(f"Error executing code in sandbox: {e}", exc_info=True)
                
        # Create assistant response
        assistant_response = AssistantResponse(
            message=response_text,
            code_blocks=code_blocks,
            execution_results=execution_result
        )
        
        # Add assistant message to conversation
        self.add_message(
            conversation_id=conversation.id,
            role=MessageRole.ASSISTANT,
            content=response_text
        )
        
        return conversation, assistant_response