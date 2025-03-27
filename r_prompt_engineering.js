// R Prompt Engineering Utility
// Helps craft effective prompts for LLM-based R code generation
import { generateRCode, executeRCode } from './llm_r_interpreter.js';
import readline from 'readline';
import fs from 'fs';
import path from 'path';
import loadEnv from './env.js';

// Load environment variables
loadEnv();

// Template prompts for different R tasks
const PROMPT_TEMPLATES = {
  visualization: `Create an R script to visualize {dataset} with {visualization_type}.
Include proper data preprocessing, good aesthetics, appropriate colors, clear labels, and save the output as a PNG file.`,

  analysis: `Perform a {analysis_type} analysis on the {dataset} dataset.
Include data exploration, assumption testing, main analysis, and interpretation of results with appropriate visualizations.`,

  modeling: `Build a {model_type} model to predict {target_variable} using {dataset}.
Include data preprocessing, feature selection, model training, evaluation, and results visualization.`,

  dataCleaning: `Write R code to clean and preprocess the {dataset} dataset.
Handle missing values, outliers, and data transformations as appropriate. Create a summary of the cleaning steps.`,

  reporting: `Create an R script that analyzes {dataset} and generates a comprehensive report with tables and visualizations.
Focus on {analysis_focus} and ensure the results are well-formatted and clearly labeled.`
};

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Utility to ask questions
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

// Generate a prompt based on template and parameters
function generatePrompt(template, params) {
  let prompt = PROMPT_TEMPLATES[template] || template;
  
  // Replace template parameters
  for (const [key, value] of Object.entries(params)) {
    prompt = prompt.replace(`{${key}}`, value);
  }
  
  return prompt;
}

// Guide users through prompt creation
async function guidedPromptCreation() {
  console.log('\n======================================================');
  console.log('           R Code Generation Prompt Engineer           ');
  console.log('======================================================');
  console.log('This utility will help you craft effective prompts for');
  console.log('generating high-quality R code with LLMs.');
  console.log('======================================================\n');
  
  // Task selection
  console.log('Available task templates:');
  Object.keys(PROMPT_TEMPLATES).forEach((key, index) => {
    console.log(`${index + 1}. ${key.charAt(0).toUpperCase() + key.slice(1)}`);
  });
  
  const taskChoice = await askQuestion('\nSelect a task template (number) or type "custom" for a custom prompt: ');
  
  let finalPrompt = '';
  let templateType = '';
  
  if (taskChoice.toLowerCase() === 'custom') {
    finalPrompt = await askQuestion('\nEnter your custom R code task description: ');
  } else {
    const templateIndex = parseInt(taskChoice) - 1;
    const templateKeys = Object.keys(PROMPT_TEMPLATES);
    
    if (templateIndex >= 0 && templateIndex < templateKeys.length) {
      templateType = templateKeys[templateIndex];
      const template = PROMPT_TEMPLATES[templateType];
      
      console.log(`\nTemplate: ${template}`);
      console.log('\nNow provide values for the template parameters:');
      
      // Extract parameters from template
      const paramMatches = template.match(/\{([^}]+)\}/g) || [];
      const params = {};
      
      for (const match of paramMatches) {
        const param = match.replace(/[{}]/g, '');
        const value = await askQuestion(`Enter value for ${param}: `);
        params[param] = value;
      }
      
      finalPrompt = generatePrompt(templateType, params);
    } else {
      console.log('Invalid selection. Using a default template.');
      templateType = 'visualization';
      finalPrompt = PROMPT_TEMPLATES.visualization
        .replace('{dataset}', 'mtcars')
        .replace('{visualization_type}', 'scatter plot');
    }
  }
  
  // Show the generated prompt
  console.log('\n======================================================');
  console.log('Generated Prompt:');
  console.log('======================================================');
  console.log(finalPrompt);
  console.log('======================================================\n');
  
  // Prompt refinement
  const refine = await askQuestion('Would you like to refine this prompt? (y/n): ');
  
  if (refine.toLowerCase() === 'y') {
    finalPrompt = await askQuestion('Enter your refined prompt:\n');
  }
  
  // Additional context
  const addContext = await askQuestion('\nWould you like to add additional context or requirements? (y/n): ');
  
  if (addContext.toLowerCase() === 'y') {
    const context = await askQuestion('Enter additional context or requirements:\n');
    finalPrompt = `${finalPrompt}\n\nAdditional requirements:\n${context}`;
  }
  
  // Test generation
  const testPrompt = await askQuestion('\nWould you like to test this prompt with code generation? (y/n): ');
  
  if (testPrompt.toLowerCase() === 'y') {
    try {
      console.log('\nGenerating R code from your prompt...');
      const generatedCode = await generateRCode(finalPrompt);
      
      console.log('\n======================================================');
      console.log('Generated R Code:');
      console.log('======================================================');
      console.log(generatedCode);
      console.log('======================================================\n');
      
      // Save the generated code
      const saveCode = await askQuestion('Would you like to save this code to a file? (y/n): ');
      
      if (saveCode.toLowerCase() === 'y') {
        const filename = `r_generated_${Date.now()}.R`;
        fs.writeFileSync(filename, generatedCode);
        console.log(`Code saved to ${filename}`);
        
        // Execute the code
        const runCode = await askQuestion('\nWould you like to execute this code? (y/n): ');
        
        if (runCode.toLowerCase() === 'y') {
          console.log('\nExecuting R code...');
          const executionResult = await executeRCode(generatedCode, 300000);
          
          console.log('\n======================================================');
          console.log('Execution Results:');
          console.log('======================================================');
          
          if (executionResult.error) {
            console.log('Error executing code:');
            console.log(executionResult.error);
          } else {
            console.log('Execution successful!');
            console.log('\nOutput:');
            console.log(executionResult.logs?.stdout?.join('\n') || '');
            
            if (executionResult.filesystem?.createdFiles?.length > 0) {
              console.log('\nCreated files:');
              executionResult.filesystem.createdFiles.forEach(file => console.log(`- ${file}`));
            }
          }
        }
      }
      
      // Save the prompt
      const savePrompt = await askQuestion('\nWould you like to save this prompt for future use? (y/n): ');
      
      if (savePrompt.toLowerCase() === 'y') {
        const promptsDir = path.join(process.cwd(), 'saved_prompts');
        
        if (!fs.existsSync(promptsDir)) {
          fs.mkdirSync(promptsDir);
        }
        
        const promptName = await askQuestion('Enter a name for this prompt: ');
        const promptFile = path.join(promptsDir, `${promptName.replace(/\s+/g, '_')}.txt`);
        
        fs.writeFileSync(promptFile, finalPrompt);
        console.log(`Prompt saved to ${promptFile}`);
      }
      
    } catch (error) {
      console.error('Error during code generation or execution:', error.message);
    }
  }
  
  console.log('\nPrompt engineering session completed.');
  rl.close();
  
  return finalPrompt;
}

// Main function
async function main() {
  try {
    await guidedPromptCreation();
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

// Export the functions
export {
  generatePrompt,
  guidedPromptCreation
};