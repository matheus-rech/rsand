// File utilities for E2B R sandbox
// Provides functions to upload and download files to/from the sandbox
import { Sandbox } from '@e2b/code-interpreter'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import loadEnv from './env.js'
import readline from 'readline'

// Load environment variables
loadEnv();

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// E2B API key
const E2B_API_KEY = process.env.E2B_API_KEY || "e2b_b1222b4303105f1e3560ecd7029c5845a9a194ff";

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

/**
 * Upload a file to the sandbox
 * @param {string} localPath - Path to the local file
 * @param {string} sandboxPath - Absolute path in the sandbox
 * @param {object} sandbox - E2B sandbox instance
 * @returns {Promise<boolean>} - Success status
 */
async function uploadFile(localPath, sandboxPath, sandbox) {
  try {
    // Ensure the local file exists
    if (!fs.existsSync(localPath)) {
      console.error(`Local file not found: ${localPath}`);
      return false;
    }
    
    // Read the file content
    const fileContent = fs.readFileSync(localPath);
    
    // Write to the sandbox
    await sandbox.filesystem.write(sandboxPath, fileContent);
    
    console.log(`Uploaded ${localPath} to ${sandboxPath}`);
    return true;
  } catch (error) {
    console.error(`Error uploading file ${localPath}:`, error);
    return false;
  }
}

/**
 * Download a file from the sandbox
 * @param {string} sandboxPath - Absolute path in the sandbox
 * @param {string} localPath - Path to save the file locally
 * @param {object} sandbox - E2B sandbox instance
 * @returns {Promise<boolean>} - Success status
 */
async function downloadFile(sandboxPath, localPath, sandbox) {
  try {
    // Read from the sandbox
    const content = await sandbox.filesystem.readFile(sandboxPath);
    
    // Create directories if needed
    const localDir = path.dirname(localPath);
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    
    // Write to local file
    fs.writeFileSync(localPath, content);
    
    console.log(`Downloaded ${sandboxPath} to ${localPath}`);
    return true;
  } catch (error) {
    console.error(`Error downloading file ${sandboxPath}:`, error);
    return false;
  }
}

/**
 * List files in a sandbox directory
 * @param {string} sandboxDir - Directory path in sandbox
 * @param {object} sandbox - E2B sandbox instance
 * @returns {Promise<array>} - Array of files
 */
async function listSandboxFiles(sandboxDir, sandbox) {
  try {
    const files = await sandbox.filesystem.list(sandboxDir);
    return files;
  } catch (error) {
    console.error(`Error listing files in ${sandboxDir}:`, error);
    return [];
  }
}

/**
 * Upload a dataset file and create R code to load it
 * @param {string} localFilePath - Path to the local file
 * @returns {Promise<object>} - Result object with code to load the data
 */
async function uploadDatasetFile(localFilePath) {
  try {
    console.log('Creating E2B sandbox...');
    const sandbox = await Sandbox.create({ apiKey: E2B_API_KEY });
    
    // Create a datasets directory in the sandbox
    await sandbox.filesystem.makeDir('/home/user/datasets');
    
    // Get the file extension to determine type
    const fileExt = path.extname(localFilePath).toLowerCase();
    const fileName = path.basename(localFilePath);
    const sandboxPath = `/home/user/datasets/${fileName}`;
    
    // Upload the file
    const uploadSuccess = await uploadFile(localFilePath, sandboxPath, sandbox);
    
    if (!uploadSuccess) {
      return { success: false, message: 'Failed to upload dataset file' };
    }
    
    // Generate R code to load the data based on file type
    let rCode = '';
    
    switch (fileExt) {
      case '.csv':
        rCode = `# Load the CSV dataset
library(readr)
# Read the CSV file
dataset <- read_csv("${sandboxPath}")
# Display the first few rows
head(dataset)
# Get summary of the data
summary(dataset)`;
        break;
        
      case '.tsv':
      case '.txt':
        rCode = `# Load the TSV/TXT dataset
library(readr)
# Read the TSV file
dataset <- read_delim("${sandboxPath}", delim="\t")
# Display the first few rows
head(dataset)
# Get summary of the data
summary(dataset)`;
        break;
        
      case '.xlsx':
      case '.xls':
        rCode = `# Load the Excel dataset
if(!require("readxl")) install.packages("readxl", repos="https://cloud.r-project.org/")
library(readxl)
# Read the Excel file
dataset <- read_excel("${sandboxPath}")
# Display the first few rows
head(dataset)
# Get summary of the data
summary(dataset)`;
        break;
        
      case '.json':
        rCode = `# Load the JSON dataset
if(!require("jsonlite")) install.packages("jsonlite", repos="https://cloud.r-project.org/")
library(jsonlite)
# Read the JSON file
dataset <- fromJSON("${sandboxPath}")
# Display structure
str(dataset)
# Convert to data frame if needed
if(!is.data.frame(dataset)) {
  dataset <- as.data.frame(dataset)
}
# Display the first few rows
head(dataset)`;
        break;
        
      case '.rds':
        rCode = `# Load the RDS dataset
# Read the RDS file (native R format)
dataset <- readRDS("${sandboxPath}")
# Display the first few rows
head(dataset)
# Get summary of the data
summary(dataset)`;
        break;
        
      case '.rdata':
      case '.rda':
        rCode = `# Load the RData file
# This will load objects with their original names
load("${sandboxPath}")
# List the objects that were loaded
ls()`;
        break;
        
      default:
        rCode = `# Try to load the dataset (format not recognized)
# Attempt to read as CSV first
tryCatch({
  library(readr)
  dataset <- read_csv("${sandboxPath}")
  cat("Successfully loaded as CSV\\n")
}, error = function(e) {
  cat("Failed to load as CSV, trying other formats...\\n")
  # Try as RDS
  tryCatch({
    dataset <<- readRDS("${sandboxPath}")
    cat("Successfully loaded as RDS\\n")
  }, error = function(e) {
    cat("Failed to load the file in recognized formats.\\n")
  })
})

# If dataset was loaded successfully, show preview
if(exists("dataset")) {
  head(dataset)
  summary(dataset)
}`;
    }
    
    // Return success with the generated code
    return {
      success: true,
      message: `Dataset ${fileName} uploaded successfully`,
      sandboxPath,
      rCode,
      sandbox
    };
  } catch (error) {
    console.error('Error in uploadDatasetFile:', error);
    return {
      success: false,
      message: `Error: ${error.message}`
    };
  }
}

/**
 * Interactive tool to upload a file and analyze it with R
 */
async function interactiveFileUpload() {
  try {
    console.log('\n======================================================');
    console.log('          R Data File Upload and Analysis Tool         ');
    console.log('======================================================');
    console.log('This utility helps you upload data files to analyze');
    console.log('them with the E2B R sandbox.');
    console.log('======================================================\n');
    
    // Ask for the file path
    const filePath = await askQuestion('Enter the path to your data file: ');
    
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      rl.close();
      return;
    }
    
    // Upload the file
    console.log(`\nUploading ${filePath} to the sandbox...`);
    const result = await uploadDatasetFile(filePath);
    
    if (!result.success) {
      console.error(`Upload failed: ${result.message}`);
      rl.close();
      return;
    }
    
    console.log('\n======================================================');
    console.log('File uploaded successfully!');
    console.log('R code to load the dataset:');
    console.log('======================================================');
    console.log(result.rCode);
    console.log('======================================================\n');
    
    // Ask if the user wants to execute the code
    const runCode = await askQuestion('Would you like to run this code to analyze the dataset? (y/n): ');
    
    if (runCode.toLowerCase() === 'y') {
      console.log('\nExecuting R code to analyze the dataset...');
      
      const execution = await result.sandbox.runCode(result.rCode, {
        language: 'r',
        timeoutMs: 60000 // 1 minute timeout
      });
      
      console.log('\n======================================================');
      console.log('Execution Results:');
      console.log('======================================================');
      
      if (execution.error) {
        console.log('Error executing code:');
        console.log(execution.error);
      } else {
        console.log('Output:');
        if (execution.logs && execution.logs.stdout) {
          console.log(execution.logs.stdout.join('\n'));
        }
      }
      
      // Ask if they want to analyze the data with the LLM
      const useLLM = await askQuestion('\nWould you like to analyze this dataset with an LLM? (y/n): ');
      
      if (useLLM.toLowerCase() === 'y') {
        // Dynamic import to avoid circular dependencies
        const { processRRequest } = await import('./llm_r_interpreter.js');
        
        const analysisPrompt = await askQuestion('\nWhat analysis would you like to perform on this dataset? ');
        
        // Construct a full prompt with the dataset path
        const fullPrompt = `Analyze the dataset located at "${result.sandboxPath}". ${analysisPrompt}
        
First, load the dataset properly based on its file extension. Then perform the requested analysis and create appropriate visualizations.
Save any plots created as PNG files.`;
        
        console.log('\nGenerating and executing R code with LLM...');
        const llmResult = await processRRequest(fullPrompt, 300000);
        
        console.log('\n======================================================');
        console.log('LLM Analysis Results:');
        console.log('======================================================');
        
        if (llmResult.success) {
          console.log('Analysis completed successfully!');
          console.log('\nGenerated code:');
          console.log(llmResult.code);
          
          console.log('\nOutput:');
          console.log(llmResult.output);
          
          if (llmResult.createdFiles && llmResult.createdFiles.length > 0) {
            console.log('\nCreated files:');
            llmResult.createdFiles.forEach(file => console.log(`- ${file}`));
            
            // Download generated plots
            console.log('\nDownloading generated files...');
            const plotsDir = path.join(process.cwd(), 'analysis_results');
            
            if (!fs.existsSync(plotsDir)) {
              fs.mkdirSync(plotsDir);
            }
            
            for (const file of llmResult.createdFiles) {
              if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.pdf') || file.endsWith('.html')) {
                await downloadFile(file, path.join(plotsDir, path.basename(file)), result.sandbox);
              }
            }
            
            console.log(`\nDownloaded files are available in the 'analysis_results' directory`);
          }
        } else {
          console.log('Analysis failed:');
          console.log(llmResult.errors || llmResult.error);
        }
      }
    }
    
    console.log('\nFile upload and analysis session completed.');
    rl.close();
    
  } catch (error) {
    console.error('Error:', error);
    rl.close();
  }
}

// Run the interactive file upload if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  interactiveFileUpload();
}

// Export the functions
export {
  uploadFile,
  downloadFile,
  listSandboxFiles,
  uploadDatasetFile,
  interactiveFileUpload
};