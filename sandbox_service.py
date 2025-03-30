import logging
import asyncio
import re
import base64
import os
from typing import List, Optional, Dict, Any
from e2b import Sandbox
from models.sandbox import SandboxExecutionResult, Plot
from utils.config import Settings

logger = logging.getLogger(__name__)

class SandboxService:
    """Service for interacting with E2B sandbox"""
    
    def __init__(self, settings: Settings):
        """Initialize the sandbox service"""
        self.e2b_api_key = settings.e2b_api_key
        self.sandbox_timeout_ms = settings.sandbox_timeout_ms
        self._sandbox = None
        self.uploads_dir = "uploads"  # Directory for uploaded files in sandbox
        
    async def initialize_sandbox(self):
        """Initialize the E2B sandbox"""
        if self._sandbox is None:
            try:
                self._sandbox = await Sandbox.create(api_key=self.e2b_api_key)
                logger.info("E2B sandbox initialized")
                
                # Create uploads directory
                try:
                    await self._sandbox.run_code(f'dir.create("{self.uploads_dir}", showWarnings = FALSE)', {
                        "language": "r",
                        "timeoutMs": 10000
                    })
                    logger.info(f"Created uploads directory: {self.uploads_dir}")
                except Exception as e:
                    logger.warning(f"Error creating uploads directory: {e}")
                    
            except Exception as e:
                logger.error(f"Error initializing E2B sandbox: {e}", exc_info=True)
                raise

    async def upload_file(self, filename: str, content: str, content_type: str) -> str:
        """Upload a file to the sandbox
        
        Args:
            filename: Original filename
            content: Base64 encoded file content
            content_type: MIME type of the file
            
        Returns:
            Path to the file in the sandbox
        """
        await self.initialize_sandbox()
        
        # Clean filename to avoid path traversal and ensure uniqueness
        safe_filename = os.path.basename(filename)
        file_path = f"{self.uploads_dir}/{safe_filename}"
        
        try:
            # Determine how to handle the file based on its type
            if content_type.startswith('text/'):
                # For text files, decode and write directly
                file_content = base64.b64decode(content).decode('utf-8')
                write_command = f"""
                fileConn <- file("{file_path}", "w")
                writeLines('{file_content.replace("'", "\\'")}', fileConn)
                close(fileConn)
                if (file.exists("{file_path}")) {{
                  cat("SUCCESS: File saved to {file_path}")
                }} else {{
                  cat("ERROR: Failed to save file")
                }}
                """
            else:
                # For binary files, use R's base64 decoding
                write_command = f"""
                # Ensure base64enc is available
                if (!require("base64enc")) {{
                  install.packages("base64enc", repos="https://cloud.r-project.org/")
                  library(base64enc)
                }}
                
                # Decode and write binary file
                base64_string <- "{content}"
                con <- file("{file_path}", "wb")
                base64enc::base64decode(what=base64_string, output=con)
                close(con)
                
                if (file.exists("{file_path}")) {{
                  cat("SUCCESS: File saved to {file_path}")
                }} else {{
                  cat("ERROR: Failed to save file")
                }}
                """
            
            # Execute file writing command
            result = await self._sandbox.run_code(write_command, {
                "language": "r",
                "timeoutMs": 30000  # 30 seconds timeout
            })
            
            # Check if file was saved successfully
            success = False
            if result.logs and result.logs.stdout:
                stdout = ''.join(result.logs.stdout)
                if "SUCCESS: File saved to" in stdout:
                    success = True
                    
            if not success:
                logger.error(f"Failed to upload file to sandbox: {filename}")
                raise Exception(f"Failed to upload file to sandbox: {filename}")
                
            # Get file info in R to verify
            info_command = f"""
            file_info <- file.info("{file_path}")
            cat("File exists:", file.exists("{file_path}"), "\\n")
            cat("File size:", file_info$size, "bytes\\n")
            """
            
            await self._sandbox.run_code(info_command, {
                "language": "r",
                "timeoutMs": 10000
            })
            
            return file_path
            
        except Exception as e:
            logger.error(f"Error uploading file to sandbox: {e}", exc_info=True)
            raise
    
    async def execute_code(self, code: str, timeout_ms: Optional[int] = None) -> SandboxExecutionResult:
        """Execute R code in the sandbox"""
        if not timeout_ms:
            timeout_ms = self.sandbox_timeout_ms
            
        await self.initialize_sandbox()
        
        try:
            # Execute the code
            execution = await self._sandbox.run_code(code, {
                "language": "r",
                "timeoutMs": timeout_ms
            })
            
            # Process results
            result = SandboxExecutionResult(
                stdout=execution.logs.stdout if execution.logs else [],
                stderr=execution.logs.stderr if execution.logs else [],
                execution_count=execution.execution_count if hasattr(execution, 'execution_count') else 0
            )
            
            # Handle error
            if execution.error:
                result.error = str(execution.error)
            
            # Extract plots from code and fetch them if they exist
            plots = await self._extract_and_fetch_plots(code)
            if plots:
                result.plots = plots
                
            return result
            
        except Exception as e:
            logger.error(f"Error executing code in E2B sandbox: {e}", exc_info=True)
            return SandboxExecutionResult(
                error=f"Execution error: {str(e)}"
            )
    
    async def _extract_and_fetch_plots(self, code: str) -> List[Plot]:
        """Extract plot filenames from code and fetch them from sandbox"""
        plots = []
        
        # Find plot filenames in various R plotting commands
        png_pattern = r'png\(["\']([^"\']+\.png)["\']'
        ggsave_pattern = r'ggsave\(["\']([^"\']+\.png)["\']'
        pdf_pattern = r'pdf\(["\']([^"\']+\.pdf)["\']'
        
        # Find all potential plot files
        potential_files = []
        potential_files.extend(re.findall(png_pattern, code))
        potential_files.extend(re.findall(ggsave_pattern, code))
        potential_files.extend(re.findall(pdf_pattern, code))
        
        # Attempt to save all images as base64
        for filename in potential_files:
            try:
                # Add base64 encoding code to extract the image
                encode_command = f"""
                # Encode {filename} to base64
                if (file.exists("{filename}")) {{
                  # Install base64enc if needed
                  if (!require("base64enc")) {{
                    install.packages("base64enc", repos="https://cloud.r-project.org/")
                    library(base64enc)
                  }}
                  # Encode file to base64
                  encoded <- base64enc::base64encode("{filename}")
                  cat(encoded)
                  # Print success message
                  cat("\\nSUCCESS_ENCODING_{filename}\\n")
                }} else {{
                  cat("\\nFILE_NOT_FOUND_{filename}\\n")
                }}
                """
                
                # Execute encoding command
                encoding_result = await self._sandbox.run_code(encode_command, {
                    "language": "r",
                    "timeoutMs": 30000  # 30 seconds timeout
                })
                
                # Process output to extract base64
                if encoding_result.logs and encoding_result.logs.stdout:
                    stdout = ''.join(encoding_result.logs.stdout)
                    
                    # Check for success message
                    success_marker = f"SUCCESS_ENCODING_{filename}"
                    if success_marker in stdout:
                        # Extract base64 content
                        base64_content = stdout.split(success_marker)[0].strip()
                        
                        # Determine mime type
                        mime_type = "image/png" if filename.endswith(".png") else "application/pdf"
                        
                        # Add to plots
                        plots.append(Plot(
                            filename=filename,
                            content=base64_content,
                            mime_type=mime_type
                        ))
                        logger.info(f"Successfully encoded plot: {filename}")
                    else:
                        logger.warning(f"File not found or encoding failed: {filename}")
            
            except Exception as e:
                logger.error(f"Error encoding plot {filename}: {e}", exc_info=True)
        
        return plots
    
    async def get_sandbox_info(self) -> Dict[str, Any]:
        """Get information about the sandbox environment"""
        await self.initialize_sandbox()
        
        try:
            # Get R version and installed packages
            info_command = """
            # Get R version
            r_version <- paste0(R.version$major, ".", R.version$minor)
            
            # Get installed packages
            installed_packages <- as.data.frame(installed.packages()[, c("Package", "Version")])
            installed_packages_str <- paste(
              paste(installed_packages$Package, installed_packages$Version, sep = " ("), 
              ")", 
              sep = "",
              collapse = ", "
            )
            
            # Get system info
            sys_info <- Sys.info()
            sys_info_str <- paste(names(sys_info), sys_info, sep = ": ", collapse = ", ")
            
            # Output info
            cat("R Version:", r_version, "\\n")
            cat("System Info:", sys_info_str, "\\n")
            cat("Installed Packages:", installed_packages_str, "\\n")
            """
            
            result = await self._sandbox.run_code(info_command, {
                "language": "r",
                "timeoutMs": 30000
            })
            
            # Process output
            info = {}
            if result.logs and result.logs.stdout:
                stdout = ''.join(result.logs.stdout)
                lines = stdout.split('\n')
                
                for line in lines:
                    if line.startswith("R Version:"):
                        info["r_version"] = line.replace("R Version:", "").strip()
                    elif line.startswith("System Info:"):
                        info["system_info"] = line.replace("System Info:", "").strip()
                    elif line.startswith("Installed Packages:"):
                        packages_str = line.replace("Installed Packages:", "").strip()
                        packages = [pkg.strip() for pkg in packages_str.split(',')]
                        info["installed_packages"] = packages
            
            return info
            
        except Exception as e:
            logger.error(f"Error getting sandbox info: {e}", exc_info=True)
            return {"error": str(e)}
        
    async def close(self):
        """Close the sandbox"""
        try:
            # Check if sandbox exists and has close method
            if self._sandbox:
                # Some versions may not have a close method, catch if that's the case
                try:
                    await self._sandbox.close()
                except AttributeError:
                    logger.info("Sandbox does not have close method, will be cleaned up automatically")
                except Exception as e:
                    logger.warning(f"Error closing sandbox: {e}")
                    
                self._sandbox = None
                logger.info("E2B sandbox closed")
        except Exception as e:
            logger.error(f"Error closing E2B sandbox: {e}", exc_info=True)