// R Modeling Assistant - LLM-powered statistical modeling and machine learning in R
import { Sandbox } from '@e2b/code-interpreter'
import { generateRCode, executeRCode } from './llm_r_interpreter.js'
import fs from 'fs'
import path from 'path'
import loadEnv from './env.js'

// Load environment variables
loadEnv();

// E2B API key
const E2B_API_KEY = process.env.E2B_API_KEY || "e2b_b1222b4303105f1e3560ecd7029c5845a9a194ff";

// Enhanced system prompt specifically for statistical modeling & ML tasks
const R_MODELING_PROMPT = `You are an expert R statistical modeler and machine learning specialist. 
Generate high-quality, valid R code for statistical modeling and machine learning tasks.

IMPORTANT GUIDELINES:
1. ONLY generate executable R code with proper error handling
2. For package installation, always use: if(!require("package")) install.packages("package", repos="https://cloud.r-project.org/")
3. Always include code for data preprocessing (handling missing values, scaling, etc.)
4. Include model diagnostics and validation steps
5. For ML tasks, include proper train/test splits and cross-validation
6. Create visualizations of model results, predictions, and evaluations
7. Save all plots as PNG files
8. Include detailed comments explaining each modeling step
9. Generate well-structured, modular code following R best practices
10. Include performance metrics appropriate for the modeling task

STANDARD MODELING WORKFLOW:
1. Data loading and inspection
2. Exploratory analysis and visualization
3. Data preprocessing (cleaning, transforming, encoding)
4. Feature selection/engineering
5. Model training with appropriate parameters
6. Model evaluation with proper metrics
7. Results visualization
8. Model diagnostics

DO NOT:
- Include markdown code blocks or backticks
- Write explanations outside of code comments
- Skip essential preprocessing steps
- Make assumptions about external dependencies

Your output will be directly executed in an R environment.`;

/**
 * Process a modeling request with the specialized R modeling prompt
 * @param {string} userPrompt - The user's modeling request
 * @param {number} timeoutMs - Execution timeout in milliseconds
 * @returns {Promise<object>} - Execution results and metadata
 */
async function processModelingRequest(userPrompt, timeoutMs = 300000) {
  try {
    // Enhance the user prompt with the specialized system prompt
    const enhancedPrompt = {
      systemPrompt: R_MODELING_PROMPT,
      userPrompt: userPrompt
    };
    
    // Generate R code with the modeling-specific prompt
    const generatedCode = await generateRCode(userPrompt, enhancedPrompt);
    
    console.log('Generated R modeling code:');
    console.log(generatedCode);
    
    // Execute the generated code with extended timeout for modeling tasks
    const executionResult = await executeRCode(generatedCode, timeoutMs);
    
    // Create output directory for any generated plots
    const outputDir = path.join(process.cwd(), 'model_plots');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    
    // Download any created files
    const sandbox = await Sandbox.create({ apiKey: E2B_API_KEY });
    if (executionResult.filesystem && executionResult.filesystem.createdFiles) {
      for (const file of executionResult.filesystem.createdFiles) {
        if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.pdf') || file.endsWith('.rds')) {
          console.log(`Downloading model output: ${file}`);
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
    console.error('Error processing modeling request:', error);
    return {
      prompt: userPrompt,
      error: error.message,
      success: false
    };
  }
}

/**
 * Run a modeling task with the ability to iteratively improve
 * @param {string} modelingTask - Description of the modeling task
 * @param {object} options - Options for the modeling task
 * @returns {Promise<object>} - Final execution results
 */
async function runModelingTask(modelingTask, options = {}) {
  const { 
    dataset = 'built-in R dataset', 
    modelType = 'appropriate model',
    includeValidation = true,
    generatePlots = true,
    timeoutMs = 300000 
  } = options;
  
  // Construct a detailed modeling prompt with the provided options
  const detailedPrompt = `
Create an R script to build a ${modelType} using the ${dataset}.

Steps to include:
1. Load and explore the dataset with summary statistics and visualizations
2. Preprocess the data appropriately for this model type
3. Select relevant features
4. ${includeValidation ? 'Split data into training and test sets' : 'Use the full dataset for model building'}
5. Train the ${modelType} with appropriate parameters
6. ${includeValidation ? 'Validate model performance using cross-validation' : 'Evaluate model fit on the dataset'}
7. Interpret model results and examine feature importance
8. ${generatePlots ? 'Create visualizations of model predictions and diagnostics' : 'Print model summary and statistics'}
9. Save any plots generated as PNG files

${modelingTask}
`;

  // Process the modeling request
  return processModelingRequest(detailedPrompt, timeoutMs);
}

// Example modeling use cases
const MODELING_EXAMPLES = [
  "Build a random forest model to predict mpg using the mtcars dataset",
  "Create a clustering analysis of the iris dataset and visualize the clusters",
  "Perform time series analysis on the AirPassengers dataset",
  "Build a linear mixed effects model on the sleepstudy dataset from lme4",
  "Perform sentiment analysis on sample text data",
  "Create a neural network to classify the digits dataset"
];

// Main function to run a modeling example
async function main() {
  // Get modeling task from command line arguments or use default
  const modelingTask = process.argv[2] || MODELING_EXAMPLES[0];
  
  console.log('Running R modeling task:');
  console.log(modelingTask);
  
  // Set options based on the task
  const options = {
    dataset: 'appropriate R dataset',
    modelType: 'statistical model or machine learning algorithm',
    includeValidation: true,
    generatePlots: true,
    timeoutMs: 300000 // 5 minutes for complex modeling tasks
  };
  
  // Run the modeling task
  const result = await runModelingTask(modelingTask, options);
  
  if (result.success) {
    console.log('\nModeling task completed successfully!');
    console.log('\nModel Output:');
    console.log(result.output);
    
    if (result.createdFiles && result.createdFiles.length > 0) {
      console.log('\nModel artifacts and visualizations:');
      result.createdFiles.forEach(file => console.log(`- ${file}`));
      console.log(`\nDownloaded files are available in the 'model_plots' directory`);
    }
  } else {
    console.log('\nModeling task failed:');
    console.log(result.errors || result.error);
  }
}

// Run the main function if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

// Export functions for use in other modules
export {
  processModelingRequest,
  runModelingTask
};