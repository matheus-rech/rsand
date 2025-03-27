// Advanced R Interpreter with Streaming, Environment Variables, and Enhanced File Handling
import { Sandbox } from '@e2b/code-interpreter'
import fs from 'fs'
import path from 'path'
import { generateRCode } from './llm_r_interpreter.js'
import loadEnv from './env.js'

// Load environment variables
loadEnv();

// E2B API key
const E2B_API_KEY = process.env.E2B_API_KEY || "e2b_b1222b4303105f1e3560ecd7029c5845a9a194ff";

/**
 * Executes R code with streaming output
 * @param {string} code - R code to execute
 * @param {object} options - Execution options
 * @returns {Promise<object>} - Execution results
 */
async function executeRCodeStreaming(code, options = {}) {
  try {
    // Set default options
    const {
      timeoutMs = 120000,
      envVars = {},
      onStdout = null,
      onStderr = null,
      onResult = null,
      logToConsole = true,
      collectOutput = true
    } = options;
    
    // Create a sandbox
    console.log('Creating E2B sandbox...');
    const sandbox = await Sandbox.create({ 
      apiKey: E2B_API_KEY,
      env: {
        R_LIBS_USER: '/home/user/R/library',
        ...envVars
      }
    });
    
    // Storage for collected output if requested
    const collectedOutput = {
      stdout: [],
      stderr: [],
      results: []
    };
    
    // Prepare the streaming callbacks
    const callbacks = {
      onStdout: data => {
        if (collectOutput) collectedOutput.stdout.push(data);
        if (logToConsole) console.log('[stdout]', data);
        if (onStdout) onStdout(data);
      },
      onStderr: data => {
        if (collectOutput) collectedOutput.stderr.push(data);
        if (logToConsole) console.error('[stderr]', data);
        if (onStderr) onStderr(data);
      }
    };
    
    // Add results callback if provided
    if (onResult) {
      callbacks.onResult = result => {
        if (collectOutput) collectedOutput.results.push(result);
        if (logToConsole) console.log('[result]', result);
        onResult(result);
      };
    }
    
    // Execute the code with streaming
    console.log('Executing R code with streaming...');
    const execution = await sandbox.runCode(code, {
      language: 'r',
      timeoutMs,
      ...callbacks
    });
    
    // Return results along with collected output if requested
    return {
      execution,
      collectedOutput: collectOutput ? collectedOutput : null,
      sandbox
    };
  } catch (error) {
    console.error('Error executing R code with streaming:', error);
    throw error;
  }
}

/**
 * Upload multiple files to sandbox
 * @param {object} sandbox - E2B sandbox instance
 * @param {string} localDir - Local directory to upload
 * @param {string} sandboxDir - Target directory in sandbox
 * @returns {Promise<array>} - List of uploaded files
 */
async function uploadDirectoryToSandbox(sandbox, localDir, sandboxDir) {
  try {
    // Create the target directory if it doesn't exist
    try {
      await sandbox.filesystem.makeDir(sandboxDir);
    } catch (error) {
      // Directory might already exist, continue
    }
    
    // Read all files in the directory
    const files = fs.readdirSync(localDir);
    const uploadedFiles = [];
    
    // Upload each file
    for (const file of files) {
      const localPath = path.join(localDir, file);
      const sandboxPath = path.join(sandboxDir, file);
      
      // Check if it's a directory
      const stats = fs.statSync(localPath);
      
      if (stats.isDirectory()) {
        // Recursively upload subdirectory
        const subdirFiles = await uploadDirectoryToSandbox(sandbox, localPath, sandboxPath);
        uploadedFiles.push(...subdirFiles);
      } else {
        // Upload single file
        const content = fs.readFileSync(localPath);
        await sandbox.filesystem.write(sandboxPath, content);
        uploadedFiles.push(sandboxPath);
      }
    }
    
    return uploadedFiles;
  } catch (error) {
    console.error(`Error uploading directory ${localDir} to sandbox:`, error);
    throw error;
  }
}

/**
 * Download multiple files from sandbox
 * @param {object} sandbox - E2B sandbox instance
 * @param {array} sandboxFiles - Files to download from sandbox
 * @param {string} localDir - Target local directory
 * @returns {Promise<array>} - List of downloaded local files
 */
async function downloadFilesFromSandbox(sandbox, sandboxFiles, localDir) {
  try {
    // Create the local directory if it doesn't exist
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    
    const downloadedFiles = [];
    
    // Download each file
    for (const sandboxPath of sandboxFiles) {
      const fileName = path.basename(sandboxPath);
      const localPath = path.join(localDir, fileName);
      
      try {
        // Read file from sandbox
        const content = await sandbox.filesystem.readFile(sandboxPath);
        
        // Write to local file
        fs.writeFileSync(localPath, content);
        downloadedFiles.push(localPath);
      } catch (error) {
        console.error(`Error downloading file ${sandboxPath}:`, error);
        // Continue with other files
      }
    }
    
    return downloadedFiles;
  } catch (error) {
    console.error(`Error downloading files from sandbox:`, error);
    throw error;
  }
}

/**
 * Advanced R analysis with streaming output, environment variables, and file handling
 * @param {object} options - Analysis options
 * @returns {Promise<object>} - Analysis results
 */
async function runAdvancedRAnalysis(options = {}) {
  try {
    // Set default options
    const {
      rCode = null,
      prompt = null,
      dataDir = null,
      outputDir = 'analysis_results',
      envVars = {},
      timeoutMs = 300000,
      streamToConsole = true,
      installPackages = true
    } = options;
    
    // Either code or prompt must be provided
    if (!rCode && !prompt) {
      throw new Error('Either rCode or prompt must be provided');
    }
    
    // Create a sandbox with environment variables
    console.log('Creating E2B sandbox...');
    const sandbox = await Sandbox.create({ 
      apiKey: E2B_API_KEY,
      env: {
        R_LIBS_USER: '/home/user/R/library',
        ...envVars
      }
    });
    
    // Create data directory in sandbox
    try {
      await sandbox.filesystem.makeDir('/home/user/data');
    } catch (error) {
      // Directory might already exist, continue
    }
    
    // Create output directory in sandbox
    try {
      await sandbox.filesystem.makeDir('/home/user/output');
    } catch (error) {
      // Directory might already exist, continue
    }
    
    // Upload data directory if provided
    let dataFiles = [];
    if (dataDir) {
      console.log(`Uploading data from ${dataDir} to sandbox...`);
      dataFiles = await uploadDirectoryToSandbox(sandbox, dataDir, '/home/user/data');
      console.log(`Uploaded ${dataFiles.length} files to sandbox`);
    }
    
    // Generate code from prompt if no code is provided
    let finalCode = rCode;
    if (!finalCode && prompt) {
      console.log('Generating R code from prompt...');
      finalCode = await generateRCode(prompt);
    }
    
    // Add package installation preamble if requested
    if (installPackages) {
      finalCode = `
# Function to install packages if not already installed
install_if_needed <- function(packages) {
  new_packages <- packages[!(packages %in% installed.packages()[,"Package"])]
  if(length(new_packages) > 0) {
    message("Installing packages: ", paste(new_packages, collapse=", "))
    install.packages(new_packages, repos="https://cloud.r-project.org/")
  }
}

# Common packages for data analysis
install_if_needed(c("tidyverse", "ggplot2", "dplyr", "readr", "lubridate"))

# Set output directory for plots
output_dir <- "/home/user/output"
if (!dir.exists(output_dir)) {
  dir.create(output_dir, recursive = TRUE)
}

# Set working directory for data files
data_dir <- "/home/user/data"
if (dir.exists(data_dir)) {
  # List data files
  message("Available data files:")
  data_files <- list.files(data_dir, recursive = TRUE)
  for (file in data_files) {
    message(" - ", file)
  }
}

${finalCode}
`;
    }
    
    // Create local output directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Prepare output collectors
    const output = {
      stdout: [],
      stderr: [],
      results: []
    };
    
    // Execute the code with streaming
    console.log('Executing R code with streaming...');
    const execution = await sandbox.runCode(finalCode, {
      language: 'r',
      timeoutMs,
      onStdout: data => {
        output.stdout.push(data);
        if (streamToConsole) console.log('[stdout]', data);
      },
      onStderr: data => {
        output.stderr.push(data);
        if (streamToConsole) console.error('[stderr]', data);
      },
      onResult: result => {
        output.results.push(result);
        if (streamToConsole) console.log('[result]', result);
      }
    });
    
    // List created files
    console.log('Checking for output files...');
    let outputFiles = [];
    try {
      outputFiles = await sandbox.filesystem.list('/home/user/output');
      console.log(`Found ${outputFiles.length} output files`);
    } catch (error) {
      console.error('Error listing output files:', error);
    }
    
    // Download output files
    const downloadedFiles = [];
    if (outputFiles.length > 0) {
      console.log('Downloading output files...');
      for (const file of outputFiles) {
        const filePath = `/home/user/output/${file.name}`;
        const localPath = path.join(outputDir, file.name);
        
        try {
          const content = await sandbox.filesystem.readFile(filePath);
          fs.writeFileSync(localPath, content);
          downloadedFiles.push(localPath);
          console.log(`Downloaded: ${file.name}`);
        } catch (error) {
          console.error(`Error downloading file ${file.name}:`, error);
        }
      }
    }
    
    // Return collected results
    return {
      success: !execution.error,
      output: {
        stdout: output.stdout.join('\n'),
        stderr: output.stderr.join('\n'),
        results: output.results
      },
      error: execution.error,
      dataFiles,
      outputFiles: downloadedFiles,
      code: finalCode,
      sandbox
    };
  } catch (error) {
    console.error('Error in advanced R analysis:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Example usage function
async function runExample() {
  const examplePrompt = `
Analyze the built-in mtcars dataset in R. Create visualizations for the relationship between 
mpg, hp, and weight. Perform a regression analysis predicting mpg from the other variables. 
Create a correlation heatmap. Save all plots to the output directory.
`;

  const result = await runAdvancedRAnalysis({
    prompt: examplePrompt,
    timeoutMs: 180000,
    streamToConsole: true,
    envVars: {
      EXAMPLE_VAR: 'This is an example environment variable'
    }
  });
  
  if (result.success) {
    console.log('\nAnalysis completed successfully!');
    
    if (result.outputFiles.length > 0) {
      console.log('\nGenerated files:');
      result.outputFiles.forEach(file => console.log(`- ${file}`));
    }
  } else {
    console.error('\nAnalysis failed:', result.error);
  }
}

// Run the example if this module is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExample().catch(console.error);
}

// Export functions
export {
  executeRCodeStreaming,
  uploadDirectoryToSandbox,
  downloadFilesFromSandbox,
  runAdvancedRAnalysis
};