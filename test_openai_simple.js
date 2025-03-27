// Simple OpenAI test that doesn't require installing packages
import { Sandbox } from '@e2b/code-interpreter';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

// E2B API key
const E2B_API_KEY = process.env.E2B_API_KEY || "e2b_293a0a02cd044b34488e6dab3d7a43d14074a6a7";

// OpenAI API key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Simple system prompt for R code
const R_SYSTEM_PROMPT = `You are an expert R programmer. Generate concise, valid R code without any markdown or backticks.
NEVER include \`\`\` in your response. Just output the plain R code only. DO NOT use any external packages, only use base R.`;

async function generateRCode(prompt) {
  try {
    console.log('Generating R code using OpenAI API...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: R_SYSTEM_PROMPT },
          { role: 'user', content: `Generate simple R code for this task: ${prompt}. Only use base R, no external packages.` }
        ],
        temperature: 0.2,
        max_tokens: 1000
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`API error: ${data.error?.message || 'Unknown error'}`);
    }
    
    // Get the generated code and remove any markdown code blocks
    let code = data.choices[0].message.content.trim();
    code = code.replace(/```r?|```/gi, '').trim();
    
    return code;
  } catch (error) {
    console.error('Error generating code:', error);
    throw error;
  }
}

async function runTest() {
  try {
    // Generate simple R code without external packages
    const prompt = "Create a function that performs a t-test on two vectors and returns both the test result and a simple visualization using base R plot functions.";
    
    const generatedCode = await generateRCode(prompt);
    
    console.log('\nGenerated R code:');
    console.log('=============================================');
    console.log(generatedCode);
    console.log('=============================================');
    
    // Save the generated code to a file
    fs.writeFileSync('openai_simple.R', generatedCode);
    
    // Execute the generated code
    console.log('\nExecuting R code...');
    const sandbox = await Sandbox.create({ apiKey: E2B_API_KEY });
    
    // Add a test call to the function
    const codeWithTest = `
${generatedCode}

# Test the function with random data
set.seed(123)
vector1 <- rnorm(30, mean = 5, sd = 1.5)
vector2 <- rnorm(30, mean = 6.2, sd = 1.2)

# Save the plot to a file
png("t_test_plot.png", width = 800, height = 600)
result <- t_test_with_plot(vector1, vector2)
dev.off()

# Print the test results
print(result$t_test)
    `;
    
    const execution = await sandbox.runCode(codeWithTest, {
      language: 'r',
      timeoutMs: 30000, // 30 seconds is enough for base R
      onStdout: (data) => console.log('[stdout]', data),
      onStderr: (data) => console.error('[stderr]', data)
    });
    
    console.log('\nExecution result:', execution.error ? 'error' : 'success');
    
    // Try to download any created files
    try {
      console.log('\nTrying to download plot file...');
      const files = await sandbox.files.list('/home/user');
      console.log('Files in sandbox:', files.map(f => f.name).join(', '));
      
      // Find PNG files
      const pngFiles = files.filter(f => f.name.endsWith('.png'));
      
      if (pngFiles.length > 0) {
        for (const file of pngFiles) {
          const content = await sandbox.files.read(`/home/user/${file.name}`);
          fs.writeFileSync(`downloaded_${file.name}`, content);
          console.log(`Downloaded ${file.name}`);
        }
      }
    } catch (error) {
      console.error('Error downloading files:', error.message);
    }
    
  } catch (error) {
    console.error('Error in test:', error);
  }
}

// Run the test
runTest();