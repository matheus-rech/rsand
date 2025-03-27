// Test OpenAI LLM-powered R code generation
import { generateRCode, executeRCode } from './llm_r_interpreter.js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

async function testOpenAICodeGeneration() {
  try {
    // Simple prompt for generating R code
    const prompt = "Create a function that performs a t-test on two vectors and returns both the test result and a visualization comparing the means with error bars. Make it customizable with different visual styles.";
    
    console.log(`Generating R code using OpenAI for prompt: "${prompt}"`);
    
    // Generate R code
    const generatedCode = await generateRCode(prompt);
    
    console.log('\nGenerated R code:');
    console.log('=============================================');
    console.log(generatedCode);
    console.log('=============================================');
    
    // Save the generated code to a file
    fs.writeFileSync('openai_generated.R', generatedCode);
    console.log('\nSaved generated code to openai_generated.R');
    
    // Execute the generated code
    console.log('\nExecuting generated R code...');
    const executionResult = await executeRCode(generatedCode, 180000, true);
    
    console.log('\nExecution result:');
    if (executionResult.error) {
      console.error('Error:', executionResult.error);
    } else {
      console.log('Execution successful!');
      
      // Try to download any created plots
      try {
        const files = await executionResult.sandbox.files.list('/home/user');
        
        console.log('\nFiles in sandbox:', files.map(f => f.name).join(', '));
        
        // Download any PNG files
        const pngFiles = files.filter(f => f.name.endsWith('.png'));
        if (pngFiles.length > 0) {
          for (const file of pngFiles) {
            const content = await executionResult.sandbox.files.read(`/home/user/${file.name}`);
            fs.writeFileSync(`openai_${file.name}`, content);
            console.log(`Downloaded ${file.name} to openai_${file.name}`);
          }
        }
      } catch (error) {
        console.error('Error downloading files:', error.message);
      }
    }
    
  } catch (error) {
    console.error('Error in test:', error);
  }
}

// Run the test
testOpenAICodeGeneration();