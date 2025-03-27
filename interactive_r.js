// Interactive R code generation and execution with LLM
import { processRRequest, runWithCorrection } from './llm_r_interpreter.js';
import readline from 'readline';
import fs from 'fs';
import path from 'path';

// Create readline interface for interactive input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Default timeout for R code execution (3 minutes)
const DEFAULT_TIMEOUT = 180000;

// History log for tracking sessions
const historyFile = path.join(process.cwd(), 'r_session_history.json');
let sessionHistory = [];

// Load existing history if available
function loadHistory() {
  try {
    if (fs.existsSync(historyFile)) {
      const data = fs.readFileSync(historyFile, 'utf8');
      sessionHistory = JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading history:', error.message);
  }
}

// Save session history
function saveHistory() {
  try {
    fs.writeFileSync(historyFile, JSON.stringify(sessionHistory, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving history:', error.message);
  }
}

// Add entry to session history
function addToHistory(entry) {
  sessionHistory.push({
    ...entry,
    timestamp: new Date().toISOString()
  });
  saveHistory();
}

// Prompt user for input
function promptUser() {
  console.log('\n------------------------------------------------------');
  console.log('Enter your R code task (or type "quit" to exit):');
  rl.question('> ', async (input) => {
    if (input.toLowerCase() === 'quit' || input.toLowerCase() === 'exit') {
      console.log('Exiting interactive R session.');
      rl.close();
      return;
    }
    
    // Process user request
    await handleUserRequest(input);
    
    // Prompt again
    promptUser();
  });
}

// Handle user request
async function handleUserRequest(prompt) {
  console.log('\nProcessing your request...');
  
  // Determine if this request needs auto-correction
  rl.question('Use auto-correction? (Y/n): ', async (answer) => {
    const useCorrection = answer.toLowerCase() !== 'n';
    
    try {
      let result;
      
      if (useCorrection) {
        // Run with auto-correction (up to 3 attempts)
        result = await runWithCorrection(prompt, 3, DEFAULT_TIMEOUT);
      } else {
        // Run once without correction
        result = await processRRequest(prompt, DEFAULT_TIMEOUT);
      }
      
      // Display results
      console.log('\n------------------------------------------------------');
      console.log('Generated R Code:');
      console.log('------------------------------------------------------');
      console.log(result.code);
      
      console.log('\n------------------------------------------------------');
      console.log('Execution Results:');
      console.log('------------------------------------------------------');
      
      if (result.success) {
        console.log('Status: Success');
        console.log('\nOutput:');
        console.log(result.output);
      } else {
        console.log('Status: Failed');
        console.log('\nErrors:');
        console.log(result.errors || result.error);
      }
      
      // Display information about created files
      if (result.createdFiles && result.createdFiles.length > 0) {
        console.log('\n------------------------------------------------------');
        console.log('Created Files:');
        result.createdFiles.forEach(file => console.log(`- ${file}`));
        console.log(`\nDownloaded files are available in the 'plots' directory`);
      }
      
      // Add to history
      addToHistory({
        prompt,
        success: result.success,
        code: result.code,
        useCorrection,
        createdFiles: result.createdFiles || []
      });
      
      // Ask user if they want to save the generated code to a file
      rl.question('\nSave this R code to a file? (y/N): ', (answer) => {
        if (answer.toLowerCase() === 'y') {
          const filename = `r_generated_${Date.now()}.R`;
          fs.writeFileSync(filename, result.code);
          console.log(`Code saved to ${filename}`);
        }
      });
      
    } catch (error) {
      console.error('Error processing request:', error.message);
    }
  });
}

// Start interactive session
function startInteractiveSession() {
  // Load previous session history
  loadHistory();
  
  console.log('\n======================================================');
  console.log('       Interactive R Code Generation & Execution       ');
  console.log('======================================================');
  console.log('Enter your data analysis tasks in plain language.');
  console.log('An LLM will generate R code and execute it for you.');
  console.log('\nExamples:');
  console.log('- "Create a histogram of the mpg variable from the mtcars dataset"');
  console.log('- "Fit a regression model predicting mpg from weight and cylinders"');
  console.log('- "Perform a cluster analysis on the iris dataset and visualize"');
  console.log('\nType "quit" to exit the session.');
  console.log('======================================================');
  
  // Start prompting
  promptUser();
}

// Run the interactive session
startInteractiveSession();