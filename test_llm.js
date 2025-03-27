// Test LLM-powered R code generation
import { generateRCode, executeRCode } from './llm_r_interpreter.js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

async function testLLMCodeGeneration() {
  try {
    // Simple prompt for generating R code
    const prompt = "Create a simple scatter plot of the mtcars dataset, showing mpg vs hp, with cylinders as colors";
    
    console.log(`Generating R code from prompt: "${prompt}"`);
    console.log('Using LLM provider:', process.env.LLM_PROVIDER);
    
    // Generate R code
    const generatedCode = await generateRCode(prompt);
    
    console.log('\nGenerated R code:');
    console.log('=============================================');
    console.log(generatedCode);
    console.log('=============================================');
    
    // Save the generated code to a file
    fs.writeFileSync('generated_code.R', generatedCode);
    console.log('\nSaved generated code to generated_code.R');
    
    // Execute the generated code with a longer timeout
    console.log('\nExecuting generated R code with streaming output...');
    const executionResult = await executeRCode(generatedCode, 180000, true);
    
    console.log('\nExecution result:');
    if (executionResult.error) {
      console.error('Error:', executionResult.error);
    } else {
      console.log('Execution successful!');
      console.log('\nOutput:');
      if (executionResult.logs && executionResult.logs.stdout) {
        console.log(executionResult.logs.stdout.join('\n'));
      }
    }
    
  } catch (error) {
    console.error('Error in test:', error);
  }
}

// Run the test
testLLMCodeGeneration();