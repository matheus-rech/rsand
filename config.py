from pydantic import Field
from pydantic_settings import BaseSettings
from functools import lru_cache
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    """Application settings"""
    
    # Environment
    environment: str = Field(default="development")
    
    # API Keys
    anthropic_api_key: str = Field(default="")
    e2b_api_key: str = Field(default="")
    
    # Service configuration
    model_name: str = Field(default="claude-3-sonnet-20240229")
    max_tokens_to_sample: int = Field(default=4096)
    temperature: float = Field(default=0.3)
    
    # Sandbox configuration
    sandbox_timeout_ms: int = Field(default=300000)  # 5 minutes

    class Config:
        env_file = ".env"
        case_sensitive = False

@lru_cache()
def get_settings() -> Settings:
    """Get application settings"""
    return Settings(
        anthropic_api_key=os.getenv("ANTHROPIC_API_KEY", ""),
        e2b_api_key=os.getenv("E2B_API_KEY", ""),
    )