from fastapi import Depends
from utils.config import get_settings, Settings
from services.claude_service import ClaudeService
from services.sandbox_service import SandboxService
from services.conversation_service import ConversationService

# Singleton instances of services
_claude_service = None
_sandbox_service = None
_conversation_service = None

def get_claude_service(settings: Settings = Depends(get_settings)) -> ClaudeService:
    """Get the Claude service"""
    global _claude_service
    if _claude_service is None:
        _claude_service = ClaudeService(settings)
    return _claude_service

def get_sandbox_service(settings: Settings = Depends(get_settings)) -> SandboxService:
    """Get the sandbox service"""
    global _sandbox_service
    if _sandbox_service is None:
        _sandbox_service = SandboxService(settings)
    return _sandbox_service

def get_conversation_service(
    claude_service: ClaudeService = Depends(get_claude_service),
    sandbox_service: SandboxService = Depends(get_sandbox_service)
) -> ConversationService:
    """Get the conversation service"""
    global _conversation_service
    if _conversation_service is None:
        _conversation_service = ConversationService(claude_service, sandbox_service)
    return _conversation_service