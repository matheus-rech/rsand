// Simple LLM test that doesn't require installing packages
import { Sandbox } from '@e2b/code-interpreter';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

// E2B API key
const E2B_API_KEY = process.env.E2B_API_KEY || "e2b_293a0a02cd044b34488e6dab3d7a43d14074a6a7";

// Anthropic API key
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Simple system prompt for R code
const R_SYSTEM_PROMPT = `You are an expert R programmer. Generate concise, valid R code without any markdown or backticks.
NEVER include \`\`\` in your response. Just output the plain R code only.`;

async function generateRCode(prompt) {
  try {
    console.log('Generating R code using Anthropic API...');
    
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
    let code = data.content[0].text.trim();
    code = code.replace(/```r?|```/gi, '').trim();
    
    return code;
  } catch (error) {
    console.error('Error generating code:', error);
    throw error;
  }
}

async function runRCode() {
  try {
    // Generate simple R code without external packages
    const prompt = "Create a simple scatter plot of the mtcars dataset, showing mpg vs hp, with cylinders as colors. Only use base R, no packages. Save the plot to a PNG file named 'mtcars_plot.png'.";
    
    const generatedCode = await generateRCode(prompt);
    
    console.log('\nGenerated R code:');
    console.log('=============================================');
    console.log(generatedCode);
    console.log('=============================================');
    
    // Save the generated code to a file
    fs.writeFileSync('simple_generated.R', generatedCode);
    
    // Execute the generated code
    console.log('\nExecuting R code...');
    const sandbox = await Sandbox.create({ apiKey: E2B_API_KEY });
    
    const execution = await sandbox.runCode(generatedCode, {
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
runRCode();