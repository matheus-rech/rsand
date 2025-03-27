// Environment variable loader
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
function loadEnv() {
  const envPath = path.resolve(__dirname, '.env');
  
  // Check if .env file exists
  if (fs.existsSync(envPath)) {
    const result = dotenv.config({ path: envPath });
    
    if (result.error) {
      console.error('Error loading .env file:', result.error);
    } else {
      console.log('Environment variables loaded from .env file');
    }
  } else {
    console.warn('No .env file found. Using environment variables or defaults.');
    console.warn('Create a .env file based on .env.example for custom configuration.');
  }
  
  // Validate required API keys
  const e2bApiKey = process.env.E2B_API_KEY;
  const llmProvider = process.env.LLM_PROVIDER || 'openai';
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!e2bApiKey) {
    console.warn('Warning: E2B_API_KEY is not set. Using default demo key.');
  }
  
  if (llmProvider === 'openai' && !openaiApiKey) {
    console.warn('Warning: OPENAI_API_KEY is not set but LLM_PROVIDER is set to "openai".');
  }
  
  if (llmProvider === 'anthropic' && !anthropicApiKey) {
    console.warn('Warning: ANTHROPIC_API_KEY is not set but LLM_PROVIDER is set to "anthropic".');
  }
}

// Export the function
export default loadEnv;