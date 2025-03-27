import anthropic
import logging
import re
from typing import List, Dict, Optional, Tuple
from models.conversation import Message, MessageRole, CodeBlock
from utils.config import Settings

logger = logging.getLogger(__name__)

class ClaudeService:
    """Service for interacting with Claude API"""
    
    def __init__(self, settings: Settings):
        """Initialize the Claude service"""
        self.client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        self.model_name = settings.model_name
        self.max_tokens = settings.max_tokens_to_sample
        self.temperature = settings.temperature
        
    def create_messages_for_claude(self, messages: List[Message]) -> List[Dict]:
        """Convert our message format to Claude's format"""
        claude_messages = []
        
        # Always include system prompt for R code generation
        system_message = {
            "role": "system",
            "content": self._get_r_interpreter_system_prompt()
        }
        claude_messages.append(system_message)
        
        # Add conversation messages
        for message in messages:
            claude_messages.append({
                "role": message.role.value,
                "content": message.content
            })
            
        return claude_messages
    
    async def generate_response(self, messages: List[Message]) -> Tuple[str, List[CodeBlock]]:
        """Generate a response from Claude"""
        try:
            claude_messages = self.create_messages_for_claude(messages)
            
            # Call Claude API
            response = self.client.messages.create(
                model=self.model_name,
                max_tokens=self.max_tokens,
                temperature=self.temperature,
                messages=claude_messages
            )
            
            # Extract response text
            response_text = response.content[0].text
            
            # Extract code blocks from the response
            code_blocks = self._extract_code_blocks(response_text)
            
            return response_text, code_blocks
            
        except Exception as e:
            logger.error(f"Error generating response from Claude: {e}", exc_info=True)
            raise
    
    def _extract_code_blocks(self, text: str) -> List[CodeBlock]:
        """Extract code blocks from text using regex"""
        code_blocks = []
        
        # Match R code blocks with ```r or ```R markers
        r_code_pattern = r"```(?:r|R)\n(.*?)\n```"
        matches = re.finditer(r_code_pattern, text, re.DOTALL)
        
        for match in matches:
            code = match.group(1).strip()
            if code:
                code_blocks.append(CodeBlock(code=code, language="r"))
        
        # If no explicit R blocks, try to find any code blocks
        if not code_blocks:
            general_pattern = r"```(.*?)```"
            matches = re.finditer(general_pattern, text, re.DOTALL)
            
            for match in matches:
                code = match.group(1).strip()
                # Attempt to determine if it's R code
                if code and not code.startswith("python") and not code.startswith("javascript"):
                    # Remove language marker if present
                    if code.split('\n')[0].strip() in ["r", "R"]:
                        code = '\n'.join(code.split('\n')[1:])
                    code_blocks.append(CodeBlock(code=code, language="r"))
        
        return code_blocks
    
    def _get_r_interpreter_system_prompt(self) -> str:
        """Get the system prompt for R code generation"""
        return """
        You are an expert R programming assistant. When responding to user's questions:

        1. If the user's query can be answered with R code, ALWAYS include executable R code in your response.
        2. Always format your R code blocks using triple backticks with the 'r' language specifier: ```r
        3. Your code should be complete, correct, and follow R best practices.
        4. Always include code for visualization when relevant, using ggplot2 or base R plotting libraries.
        5. For data visualization, include code to save plots as image files using png(), ggsave(), or similar functions.
        6. When generating visualizations, make them publication-quality with proper labels, titles, and styling.
        7. If the user's query involves statistical analysis, include appropriate statistical tests and visualizations.
        8. Always explain your R code thoroughly but concisely.
        9. If packages need to be installed, include the installation code using install.packages().
        10. Write code that handles errors gracefully and provides informative messages.
        11. When working with uploaded files, refer to them using their file paths as provided by the user.
        
        Your responses will be executed in an R sandbox environment with the following characteristics:
        - Major R packages for data analysis and visualization can be installed from CRAN
        - You can install any standard R package that would help analyze data or generate visualizations
        - Generated plots should be saved as files using png(), pdf(), or ggsave() to be viewable
        - User uploaded files are stored in the "uploads" directory
        - For data formats like CSV, Excel, JSON, etc., use appropriate R packages like readr, readxl, jsonlite
        - Code execution has a timeout of 5 minutes
        - The environment is ephemeral between conversations, but persistent within a conversation
        - You can save outputs as files for the user to download
        
        For working with specific file types:
        - CSV files: Use readr::read_csv() or read.csv()
        - Excel files: Use readxl::read_excel() or openxlsx package
        - JSON: Use jsonlite::fromJSON()
        - RDS or RData: Use readRDS() or load()
        - If a user mentions they've uploaded a file, always first check if the file exists with file.exists()
        
        Focus on generating correct, efficient R code that answers the user's query directly. Help users analyze their data, create visualizations, and perform statistical analyses using the full power of R and its ecosystem.
        """