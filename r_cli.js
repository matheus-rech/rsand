#!/usr/bin/env node
// Command-line interface for advanced R interpreter
// Import conditionally since we might have errors with LLM integration
let runAdvancedRAnalysis;
try {
  const module = await import('./advanced_r_interpreter.js');
  runAdvancedRAnalysis = module.runAdvancedRAnalysis;
} catch (error) {
  console.error('Warning: Could not load advanced_r_interpreter.js', error.message);
  // Provide a simple fallback function
  runAdvancedRAnalysis = async (options) => {
    const { Sandbox } = await import('@e2b/code-interpreter');
    const sandbox = await Sandbox.create({ 
      apiKey: process.env.E2B_API_KEY || "e2b_b1222b4303105f1e3560ecd7029c5845a9a194ff"
    });
    
    console.log('Using fallback R interpreter (LLM integration not available)');
    
    // If code is provided, run it directly
    if (options.rCode) {
      const execution = await sandbox.runCode(options.rCode, {
        language: 'r',
        timeoutMs: options.timeoutMs || 120000,
        onStdout: options.streamToConsole ? (data) => console.log(data) : null,
        onStderr: options.streamToConsole ? (data) => console.error(data) : null
      });
      
      return {
        success: !execution.error,
        error: execution.error,
        code: options.rCode,
        sandbox
      };
    } else {
      console.error('Error: No code provided and LLM integration is not available');
      return {
        success: false,
        error: 'No code provided and LLM integration is not available'
      };
    }
  };
}
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import loadEnv from './env.js';

// Load environment variables
loadEnv();

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Parse command line arguments
 * @returns {object} Parsed arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const parsedArgs = {
    command: args[0] || 'help',
    options: {}
  };
  
  // Parse options
  for (let i = 1; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const option = args[i].slice(2);
      const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
      parsedArgs.options[option] = value;
      if (value !== true) i++; // Skip the value in the next iteration
    }
  }
  
  return parsedArgs;
}

/**
 * Display help message
 */
function showHelp() {
  console.log(`
R Interpreter CLI - Run R code with LLM assistance

Usage:
  node r_cli.js <command> [options]

Commands:
  run           Run R code from a file
  prompt        Generate and run R code from a prompt
  interactive   Start an interactive R session
  help          Show this help message

Options:
  --file <path>       Path to R script file to execute
  --prompt <text>     Prompt for LLM to generate R code
  --data <path>       Path to data directory to upload
  --output <path>     Path to output directory (default: analysis_results)
  --timeout <ms>      Execution timeout in milliseconds (default: 300000)
  --quiet             Don't stream output to console
  --no-packages       Don't automatically install common packages

Examples:
  node r_cli.js run --file script.R --data ./data
  node r_cli.js prompt --prompt "Analyze the mtcars dataset" --output ./results
  node r_cli.js interactive
  `);
}

/**
 * Run R code from a file
 * @param {object} options - Command options
 */
async function runRScript(options) {
  const {
    file,
    data,
    output = 'analysis_results',
    timeout = 300000,
    quiet = false,
    'no-packages': noPackages = false
  } = options;
  
  if (!file) {
    console.error('Error: --file option is required');
    process.exit(1);
  }
  
  if (!fs.existsSync(file)) {
    console.error(`Error: File not found: ${file}`);
    process.exit(1);
  }
  
  // Read the R code from the file
  const rCode = fs.readFileSync(file, 'utf8');
  
  // Run the analysis
  const result = await runAdvancedRAnalysis({
    rCode,
    dataDir: data,
    outputDir: output,
    timeoutMs: parseInt(timeout),
    streamToConsole: !quiet,
    installPackages: !noPackages
  });
  
  // Display results
  if (result.success) {
    console.log('\nR script executed successfully!');
    
    if (result.outputFiles.length > 0) {
      console.log('\nGenerated files:');
      result.outputFiles.forEach(file => console.log(`- ${file}`));
    }
  } else {
    console.error('\nR script execution failed:', result.error);
    process.exit(1);
  }
}

/**
 * Generate and run R code from a prompt
 * @param {object} options - Command options
 */
async function runFromPrompt(options) {
  const {
    prompt,
    data,
    output = 'analysis_results',
    timeout = 300000,
    quiet = false,
    'no-packages': noPackages = false
  } = options;
  
  if (!prompt) {
    console.error('Error: --prompt option is required');
    process.exit(1);
  }
  
  // Run the analysis
  console.log('Generating and executing R code from prompt...');
  const result = await runAdvancedRAnalysis({
    prompt,
    dataDir: data,
    outputDir: output,
    timeoutMs: parseInt(timeout),
    streamToConsole: !quiet,
    installPackages: !noPackages
  });
  
  // Display results
  if (result.success) {
    console.log('\nR code generated and executed successfully!');
    
    if (result.outputFiles.length > 0) {
      console.log('\nGenerated files:');
      result.outputFiles.forEach(file => console.log(`- ${file}`));
    }
    
    // Save the generated code
    const codeFile = path.join(output, 'generated_code.R');
    fs.writeFileSync(codeFile, result.code);
    console.log(`\nGenerated R code saved to: ${codeFile}`);
  } else {
    console.error('\nFailed to generate or execute R code:', result.error);
    process.exit(1);
  }
}

/**
 * Start an interactive R session
 */
async function startInteractive() {
  console.log(`
========================================================
        Interactive R Interpreter with LLM
========================================================
Enter R code or prompts prefixed with '!' to generate code.
Examples:
  - plot(mtcars$mpg, mtcars$hp)
  - !Create a scatter plot of mpg vs hp from mtcars
  
Type 'exit' or 'quit' to end the session.
Type 'help' for more commands.
========================================================
`);

  // Create a sandbox for the interactive session
  const { Sandbox } = await import('@e2b/code-interpreter');
  const sandbox = await Sandbox.create();
  
  // Create output directory
  const outputDir = 'interactive_results';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Helper for generating code
  const { generateRCode } = await import('./llm_r_interpreter.js');
  
  // Helper for interactive commands
  const handleCommand = async (input) => {
    if (['exit', 'quit'].includes(input.toLowerCase())) {
      console.log('Ending R session.');
      rl.close();
      process.exit(0);
    } else if (input.toLowerCase() === 'help') {
      console.log(`
Available commands:
  - exit, quit: End the session
  - help: Show this help message
  - clear: Clear the console
  - !<prompt>: Generate R code from a prompt
  - save <filename>: Save last execution code to a file
  - load <filename>: Load and execute R code from a file
  - download <filename>: Download a file from the sandbox
  - list: List files in the sandbox
`);
      return promptUser();
    } else if (input.toLowerCase() === 'clear') {
      console.clear();
      return promptUser();
    } else if (input.startsWith('save ')) {
      const filename = input.slice(5).trim();
      if (!lastCode) {
        console.log('No code to save. Run some code first.');
      } else {
        fs.writeFileSync(filename, lastCode);
        console.log(`Saved to ${filename}`);
      }
      return promptUser();
    } else if (input.startsWith('load ')) {
      const filename = input.slice(5).trim();
      if (!fs.existsSync(filename)) {
        console.log(`File not found: ${filename}`);
      } else {
        const code = fs.readFileSync(filename, 'utf8');
        console.log(`Loaded ${filename}, executing...`);
        await executeCode(code);
      }
      return promptUser();
    } else if (input.startsWith('list')) {
      try {
        const files = await sandbox.filesystem.list('/home/user');
        console.log('Files in the sandbox:');
        files.forEach(file => console.log(`- ${file.name}`));
      } catch (error) {
        console.error('Error listing files:', error);
      }
      return promptUser();
    } else if (input.startsWith('download ')) {
      const filename = input.slice(9).trim();
      try {
        const content = await sandbox.filesystem.readFile(`/home/user/${filename}`);
        fs.writeFileSync(path.join(outputDir, filename), content);
        console.log(`Downloaded ${filename} to ${outputDir}/${filename}`);
      } catch (error) {
        console.error(`Error downloading file: ${error.message}`);
      }
      return promptUser();
    } else if (input.startsWith('!')) {
      const prompt = input.slice(1).trim();
      console.log('Generating R code from prompt...');
      try {
        const code = await generateRCode(prompt);
        console.log('\nGenerated R code:');
        console.log('----------------------------------------');
        console.log(code);
        console.log('----------------------------------------');
        
        const execute = await askYesNo('Execute this code? (y/n): ');
        if (execute) {
          await executeCode(code);
        }
      } catch (error) {
        console.error('Error generating code:', error.message);
      }
      return promptUser();
    } else {
      // Treat as R code
      await executeCode(input);
      return promptUser();
    }
  };
  
  // Keep track of last executed code
  let lastCode = '';
  
  // Helper for asking yes/no questions
  const askYesNo = async (question) => {
    const answer = await new Promise(resolve => rl.question(question, resolve));
    return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
  };
  
  // Helper for executing R code
  const executeCode = async (code) => {
    lastCode = code;
    console.log('Executing R code...');
    
    try {
      const result = await sandbox.runCode(code, {
        language: 'r',
        timeoutMs: 60000,
        onStdout: data => console.log(data),
        onStderr: data => console.error(data)
      });
      
      if (result.error) {
        console.error('Error:', result.error);
      } else {
        console.log('Execution completed successfully.');
      }
    } catch (error) {
      console.error('Error executing code:', error.message);
    }
  };
  
  // Start the interactive prompt
  const promptUser = () => {
    rl.question('R> ', (input) => {
      handleCommand(input).catch(console.error);
    });
  };
  
  // Initialize by running a simple R command
  await executeCode('R.version$version.string');
  promptUser();
}

/**
 * Main function
 */
async function main() {
  const { command, options } = parseArgs();
  
  switch (command) {
    case 'run':
      await runRScript(options);
      process.exit(0);
      break;
    case 'prompt':
      await runFromPrompt(options);
      process.exit(0);
      break;
    case 'interactive':
      await startInteractive();
      // This doesn't exit as it starts an interactive session
      break;
    case 'help':
    default:
      showHelp();
      process.exit(0);
  }
}

// Run the main function
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});