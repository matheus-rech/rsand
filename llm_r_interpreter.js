// R language interpreter with LLM integration
import { Sandbox } from '@e2b/code-interpreter'
import fs from 'fs'
import path from 'path'
import loadEnv from './env.js'

// Load environment variables
loadEnv();

// E2B API key
const E2B_API_KEY = process.env.E2B_API_KEY || "e2b_b1222b4303105f1e3560ecd7029c5845a9a194ff";

// You should use your own API keys for the LLM providers
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Configure preferred LLM - 'openai' or 'anthropic'
const LLM_PROVIDER = process.env.LLM_PROVIDER || 'openai';

/**
 * System prompt engineering to ensure high-quality R code generation
 * This is crucial for getting valid, well-structured R code from the LLM
 */
const R_SYSTEM_PROMPT = `You are an expert R statistical programmer with extensive knowledge of data analysis, 
visualization, and statistical methods. Your task is to generate high-quality, valid, and efficient R code based on user requests.

IMPORTANT GUIDELINES:
1. ONLY generate executable R code with no explanations or markdown formatting
2. Always include proper error handling in your code
3. Use tidyverse packages (like dplyr, ggplot2) when appropriate
4. Follow R code best practices and style guide
5. For data visualization, use ggplot2 with proper themes and labels
6. When installing packages, always use: if(!require("package")) install.packages("package", repos="https://cloud.r-project.org/")
7. For statistical analyses, include appropriate assumptions testing
8. Generate code that's well-commented to explain each step
9. Ensure your code is complete and can run end-to-end
10. For plots, save results as PNG files with appropriate resolution

CRITICAL RULES:
- NEVER USE MARKDOWN FORMATTING. Your response must be plain R code only
- Do not include any backticks or markdown code block syntax in your response
- Just output the raw R code directly without any markdown formatting
- Do not wrap your response in a code block
- Do not start your response with any markdown syntax
- Do not include triple backticks anywhere in your response
- Only output the R code, nothing else

Your output will be directly executed in an R environment.`;

/**
 * Generates R code using OpenAI's API
 * @param {string} userPrompt - The user's request
 * @returns {Promise<string>} - Generated R code
 */
async function generateOpenAICode(userPrompt) {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured. Set the OPENAI_API_KEY environment variable.');
  }
  
  try {
    console.log('Sending request to OpenAI API...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',  // Using gpt-4o
        messages: [
          { role: 'system', content: R_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2, // Lower temperature for more deterministic code generation
        max_tokens: 2048
      })
    });
    
    // Log response status
    console.log('OpenAI API response status:', response.status);
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API error details:', data);
      throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`);
    }
    
    // Log successful response structure (for debugging)
    console.log('OpenAI API response structure:', Object.keys(data));
    
    // Extract the generated code
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating code with OpenAI:', error);
    throw error;
  }
}

/**
 * Generates R code using Anthropic's API
 * @param {string} userPrompt - The user's request
 * @returns {Promise<string>} - Generated R code
 */
async function generateAnthropicCode(userPrompt) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('Anthropic API key is not configured. Set the ANTHROPIC_API_KEY environment variable.');
  }
  
  try {
    console.log('Sending request to Anthropic API...');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        system: R_SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: 2048
      })
    });
    
    // Log response status
    console.log('Anthropic API response status:', response.status);
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Anthropic API error details:', data);
      throw new Error(`Anthropic API error: ${data.error?.message || 'Unknown error'}`);
    }
    
    // Log successful response structure (for debugging)
    console.log('Anthropic API response structure:', Object.keys(data));
    
    // Extract the generated code
    return data.content[0].text.trim();
  } catch (error) {
    console.error('Error generating code with Anthropic:', error);
    throw error;
  }
}

/**
 * Clean R code by removing markdown code blocks and backticks
 * @param {string} code - Generated code
 * @returns {string} - Cleaned code
 */
function cleanRCode(code) {
  // Remove markdown code blocks if present
  let cleanedCode = code.replace(/```r?|```/gi, '');
  
  // Remove any leading/trailing whitespace
  cleanedCode = cleanedCode.trim();
  
  // Check if it starts or ends with backticks
  if (cleanedCode.startsWith('`') || cleanedCode.endsWith('`')) {
    cleanedCode = cleanedCode.replace(/`/g, '');
  }
  
  return cleanedCode;
}

/**
 * Generates R code based on user prompt using selected LLM provider
 * @param {string} userPrompt - The user's request
 * @returns {Promise<string>} - Generated R code
 */
async function generateRCode(userPrompt) {
  console.log(`Generating R code using ${LLM_PROVIDER}...`);
  
  let generatedCode;
  
  if (LLM_PROVIDER === 'anthropic') {
    generatedCode = await generateAnthropicCode(userPrompt);
  } else {
    generatedCode = await generateOpenAICode(userPrompt);
  }
  
  // Clean the generated code to remove any markdown formatting
  const cleanedCode = cleanRCode(generatedCode);
  
  console.log('Code cleaned and ready for execution');
  return cleanedCode;
}

/**
 * Execute R code in E2B sandbox
 * @param {string} code - R code to execute
 * @param {number} timeoutMs - Execution timeout in milliseconds
 * @param {boolean} streaming - Enable streaming output
 * @returns {Promise<object>} - Execution results
 */
async function executeRCode(code, timeoutMs = 120000, streaming = false) {
  try {
    console.log('Creating E2B sandbox...');
    const sandbox = await Sandbox.create({ apiKey: E2B_API_KEY });
    
    console.log('Executing R code...');
    
    // Configure execution options
    const options = {
      language: 'r',
      timeoutMs: timeoutMs
    };
    
    // Add streaming callbacks if requested
    if (streaming) {
      options.onStdout = (data) => console.log('[stdout]', data);
      options.onStderr = (data) => console.error('[stderr]', data);
    }
    
    // Execute the code
    const execution = await sandbox.runCode(code, options);
    
    return execution;
  } catch (error) {
    console.error('Error executing R code:', error);
    throw error;
  }
}

/**
 * Takes a user prompt, generates R code, executes it, and returns results
 * @param {string} userPrompt - The user's request in natural language
 * @param {number} timeoutMs - Execution timeout in milliseconds
 * @returns {Promise<object>} - Execution results and metadata
 */
async function processRRequest(userPrompt, timeoutMs = 120000) {
  try {
    // Generate R code from the user prompt
    const generatedCode = await generateRCode(userPrompt);
    
    console.log('Generated R code:');
    console.log(generatedCode);
    
    // Execute the generated code
    const executionResult = await executeRCode(generatedCode, timeoutMs);
    
    // Create output directory for any generated plots
    const outputDir = path.join(process.cwd(), 'plots');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    
    // If the execution created files, download them
    if (executionResult.filesystem && executionResult.filesystem.createdFiles) {
      const sandbox = await Sandbox.create({ apiKey: E2B_API_KEY });
      
      for (const file of executionResult.filesystem.createdFiles) {
        if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.pdf')) {
          console.log(`Downloading file: ${file}`);
          const content = await sandbox.filesystem.readFile(file);
          const filename = path.basename(file);
          fs.writeFileSync(path.join(outputDir, filename), content);
        }
      }
    }
    
    return {
      prompt: userPrompt,
      code: generatedCode,
      execution: executionResult,
      success: !executionResult.error,
      output: executionResult.logs?.stdout?.join('\n') || '',
      errors: executionResult.logs?.stderr?.join('\n') || '',
      createdFiles: executionResult.filesystem?.createdFiles || []
    };
  } catch (error) {
    console.error('Error processing R request:', error);
    return {
      prompt: userPrompt,
      error: error.message,
      success: false
    };
  }
}

/**
 * Runs R code with automated correction using LLM if there are errors
 * @param {string} userPrompt - The user's request in natural language
 * @param {number} maxAttempts - Maximum number of correction attempts
 * @param {number} timeoutMs - Execution timeout in milliseconds
 * @returns {Promise<object>} - Final execution results
 */
async function runWithCorrection(userPrompt, maxAttempts = 3, timeoutMs = 120000) {
  let attempt = 1;
  let result;
  let errorContext = '';
  
  while (attempt <= maxAttempts) {
    console.log(`\nAttempt ${attempt} of ${maxAttempts}:`);
    
    // Construct prompt with error context if available
    const promptWithContext = attempt === 1 ? 
      userPrompt : 
      `${userPrompt}\n\nThe previous code resulted in the following error:\n${errorContext}\n\nPlease fix the code and try again.`;
    
    result = await processRRequest(promptWithContext, timeoutMs);
    
    if (result.success && !result.errors) {
      console.log(`\nSuccessfully executed R code on attempt ${attempt}`);
      return result;
    } else {
      errorContext = result.errors || result.error || 'Unknown error occurred';
      console.log(`\nAttempt ${attempt} failed with error:\n${errorContext}`);
      attempt++;
    }
  }
  
  console.log('\nFailed to execute R code after maximum correction attempts');
  return result;
}

// Example usage
async function main() {
  const userPrompt = process.argv[2] || 
    "Create a simple analysis of the mtcars dataset. Generate summary statistics, " +
    "create a scatter plot of mpg vs. hp colored by cylinder count, and fit a linear model.";
  
  const timeoutMs = 180000; // 3 minutes
  
  console.log('User prompt:', userPrompt);
  const result = await runWithCorrection(userPrompt, 3, timeoutMs);
  
  if (result.success) {
    console.log('\nExecution successful!');
    console.log('\nOutput:');
    console.log(result.output);
    
    if (result.createdFiles && result.createdFiles.length > 0) {
      console.log('\nCreated files:');
      result.createdFiles.forEach(file => console.log(`- ${file}`));
      console.log(`\nDownloaded files are available in the 'plots' directory`);
    }
  } else {
    console.log('\nExecution failed after multiple attempts');
    console.log('\nErrors:');
    console.log(result.errors || result.error);
  }
}

// Run the example if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

// Export functions for use in other modules
export {
  generateRCode,
  executeRCode,
  processRRequest,
  runWithCorrection
};