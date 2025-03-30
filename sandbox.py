from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
import logging
import base64
from models.sandbox import CodeExecutionRequest, SandboxExecutionResult, FileUploadRequest
from services.sandbox_service import SandboxService
from api.dependencies import get_sandbox_service

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/execute", response_model=SandboxExecutionResult)
async def execute_code(
    request: CodeExecutionRequest,
    sandbox_service: SandboxService = Depends(get_sandbox_service)
):
    """Execute code in the sandbox"""
    try:
        result = await sandbox_service.execute_code(
            code=request.code,
            timeout_ms=request.timeout_ms
        )
        return result
    except Exception as e:
        logger.error(f"Error executing code: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error executing code: {str(e)}")

@router.post("/upload-file")
async def upload_file(
    file: UploadFile = File(...),
    sandbox_service: SandboxService = Depends(get_sandbox_service)
):
    """Upload a file to the sandbox"""
    try:
        # Read file content
        content = await file.read()
        content_base64 = base64.b64encode(content).decode("utf-8")
        
        # Upload to sandbox
        file_path = await sandbox_service.upload_file(
            filename=file.filename,
            content=content_base64,
            content_type=file.content_type or "application/octet-stream"
        )
        
        return {"filename": file.filename, "path": file_path}
    except Exception as e:
        logger.error(f"Error uploading file: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")

@router.post("/upload-file-base64")
async def upload_file_base64(
    request: FileUploadRequest,
    sandbox_service: SandboxService = Depends(get_sandbox_service)
):
    """Upload a file (base64 encoded) to the sandbox"""
    try:
        # Upload to sandbox
        file_path = await sandbox_service.upload_file(
            filename=request.filename,
            content=request.content,
            content_type=request.content_type
        )
        
        return {"filename": request.filename, "path": file_path}
    except Exception as e:
        logger.error(f"Error uploading file: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")

@router.get("/info")
async def get_sandbox_info(
    sandbox_service: SandboxService = Depends(get_sandbox_service)
):
    """Get information about the sandbox environment"""
    try:
        info = await sandbox_service.get_sandbox_info()
        return info
    except Exception as e:
        logger.error(f"Error getting sandbox info: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error getting sandbox info: {str(e)}")