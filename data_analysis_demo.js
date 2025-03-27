// Complete data analysis workflow demonstration
// Shows how to upload files and analyze them with LLM-generated R code
import { Sandbox } from '@e2b/code-interpreter'
import { uploadFile, downloadFile } from './file_utils.js'
import { processRRequest } from './llm_r_interpreter.js'
import fs from 'fs'
import path from 'path'
import loadEnv from './env.js'

// Load environment variables
loadEnv();

// E2B API key
const E2B_API_KEY = process.env.E2B_API_KEY || "e2b_b1222b4303105f1e3560ecd7029c5845a9a194ff";

// Example dataset to use if none is provided
const EXAMPLE_DATASETS = [
  {
    name: 'sample_diabetes.csv',
    content: `id,age,gender,bmi,bp,s1,s2,s3,s4,s5,s6,y
1,59,2,32.1,101,157,93.2,38,4,4.9,87,151
2,48,1,21.6,87,183,103.2,70,3,3.9,69,75
3,72,2,30.5,93,156,93.6,41,4,4.7,85,141
4,24,1,25.3,84,198,131.4,40,5,4.9,89,206
5,50,1,23.0,101,192,125.4,52,4,4.3,80,135
6,23,1,22.6,89,139,64.8,61,2,4.2,68,97
7,36,2,22.0,90,160,99.6,50,3,4.3,71,138
8,66,2,26.2,114,255,185.0,56,5,4.2,84,127
9,60,2,32.1,83,179,119.4,42,4,4.9,94,145
10,29,1,30.0,85,180,93.4,43,4,5.3,88,217`
  },
  {
    name: 'sample_housing.csv',
    content: `id,price,area,bedrooms,bathrooms,stories,parking,furnishing,main_road,guest_room
1,13300000,7420,4,2,3,2,furnished,yes,no
2,12250000,8960,4,4,4,3,furnished,yes,no
3,12250000,9960,3,2,2,2,semi-furnished,yes,no
4,12215000,7500,4,2,2,3,furnished,yes,yes
5,11410000,7420,4,1,2,2,furnished,yes,yes
6,10850000,7500,3,3,1,0,unfurnished,yes,no
7,10150000,8580,4,3,4,0,semi-furnished,yes,yes
8,10150000,16200,5,3,2,0,unfurnished,no,no
9,9870000,8100,4,1,2,2,furnished,yes,yes
10,9800000,5750,3,2,4,1,unfurnished,yes,yes`
  }
];

/**
 * Complete data analysis workflow demonstration
 * @param {string} dataFilePath - Path to data file (optional)
 * @param {string} analysisRequest - Natural language description of analysis to perform
 */
async function runDataAnalysisWorkflow(dataFilePath, analysisRequest) {
  try {
    console.log('\n======================================================');
    console.log('         DATA ANALYSIS WORKFLOW DEMONSTRATION          ');
    console.log('======================================================');
    
    // Create output directory for results
    const outputDir = path.join(process.cwd(), 'analysis_results');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    
    // Create E2B sandbox
    console.log('Creating E2B sandbox...');
    const sandbox = await Sandbox.create({ apiKey: E2B_API_KEY });
    
    // Create datasets directory in sandbox
    await sandbox.filesystem.makeDir('/home/user/datasets');
    
    let sandboxFilePath;
    let fileName;
    
    // If no file path provided, create and use an example dataset
    if (!dataFilePath) {
      console.log('No data file provided, using sample dataset...');
      
      // Choose a random example dataset
      const exampleDataset = EXAMPLE_DATASETS[Math.floor(Math.random() * EXAMPLE_DATASETS.length)];
      fileName = exampleDataset.name;
      
      // Write the example dataset to a temporary file
      const tempFilePath = path.join(outputDir, fileName);
      fs.writeFileSync(tempFilePath, exampleDataset.content);
      
      console.log(`Created sample dataset: ${fileName}`);
      
      // Upload the example dataset to the sandbox
      sandboxFilePath = `/home/user/datasets/${fileName}`;
      await uploadFile(tempFilePath, sandboxFilePath, sandbox);
      
    } else {
      // Check if the provided file exists
      if (!fs.existsSync(dataFilePath)) {
        throw new Error(`File not found: ${dataFilePath}`);
      }
      
      // Get file name from path
      fileName = path.basename(dataFilePath);
      
      // Upload the file to the sandbox
      console.log(`Uploading ${fileName} to the sandbox...`);
      sandboxFilePath = `/home/user/datasets/${fileName}`;
      await uploadFile(dataFilePath, sandboxFilePath, sandbox);
    }
    
    console.log(`Dataset uploaded to sandbox: ${sandboxFilePath}`);
    
    // Check file extension to determine how to load it
    const fileExt = path.extname(fileName).toLowerCase();
    
    // Create appropriate R code for loading the file
    let loadingCode;
    
    switch (fileExt) {
      case '.csv':
        loadingCode = `library(readr)\ndataset <- read_csv("${sandboxFilePath}")`;
        break;
      case '.xlsx':
      case '.xls':
        loadingCode = `if(!require("readxl")) install.packages("readxl", repos="https://cloud.r-project.org/")\nlibrary(readxl)\ndataset <- read_excel("${sandboxFilePath}")`;
        break;
      case '.rds':
        loadingCode = `dataset <- readRDS("${sandboxFilePath}")`;
        break;
      default:
        loadingCode = `# Trying to read as CSV\ntryCatch({\n  library(readr)\n  dataset <- read_csv("${sandboxFilePath}")\n}, error = function(e) {\n  # Alternatively try as table\n  dataset <<- read.table("${sandboxFilePath}", header = TRUE)\n})`;
    }
    
    // Run exploratory data analysis first
    console.log('\nRunning initial exploratory data analysis...');
    
    const exploratoryCode = `
${loadingCode}

# Explore the dataset
cat("Dataset dimensions:", dim(dataset)[1], "rows x", dim(dataset)[2], "columns\\n")

# Column names and types
cat("\\nColumns and data types:\\n")
str(dataset)

# Summary statistics
cat("\\nSummary statistics:\\n")
summary(dataset)

# Check for missing values
cat("\\nMissing values by column:\\n")
colSums(is.na(dataset))

# First few rows
cat("\\nFirst few rows of the dataset:\\n")
head(dataset)
`;
    
    const exploratoryResult = await sandbox.runCode(exploratoryCode, {
      language: 'r',
      timeoutMs: 60000
    });
    
    console.log('\n======================================================');
    console.log('EXPLORATORY DATA ANALYSIS RESULTS:');
    console.log('======================================================');
    
    if (exploratoryResult.error) {
      console.log('Error loading the dataset:');
      console.log(exploratoryResult.error);
    } else if (exploratoryResult.logs && exploratoryResult.logs.stdout) {
      console.log(exploratoryResult.logs.stdout.join('\n'));
    }
    
    // Run the LLM-powered analysis
    console.log('\n======================================================');
    console.log('RUNNING LLM-POWERED R ANALYSIS:');
    console.log('======================================================');
    console.log(`Analysis request: ${analysisRequest}`);
    
    // Create a prompt that includes the file path and loading code
    const fullPrompt = `
Analyze the dataset located at "${sandboxFilePath}".

First, load the dataset using this code:
${loadingCode}

Then, perform the following analysis:
${analysisRequest}

Make sure to:
1. Create appropriate visualizations and save them as PNG files
2. Include proper data preprocessing and cleaning
3. Provide insights and interpretations in your code comments
4. Handle any potential errors or missing data gracefully
`;
    
    // Run the LLM-based analysis
    const analysisResult = await processRRequest(fullPrompt, 300000);
    
    console.log('\n======================================================');
    console.log('LLM ANALYSIS RESULTS:');
    console.log('======================================================');
    
    if (analysisResult.success) {
      console.log('Analysis completed successfully!');
      
      console.log('\nGenerated R code:');
      console.log('------------------------------------------------------');
      console.log(analysisResult.code);
      
      console.log('\nOutput:');
      console.log('------------------------------------------------------');
      console.log(analysisResult.output);
      
      // Save the generated code to a file
      fs.writeFileSync(path.join(outputDir, 'analysis_code.R'), analysisResult.code);
      console.log(`\nSaved generated R code to: analysis_results/analysis_code.R`);
      
      // Download any generated files
      if (analysisResult.createdFiles && analysisResult.createdFiles.length > 0) {
        console.log('\nGenerated files:');
        console.log('------------------------------------------------------');
        
        for (const file of analysisResult.createdFiles) {
          console.log(file);
          
          // Download files with common image/document extensions
          if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.pdf') || 
              file.endsWith('.html') || file.endsWith('.svg') || file.endsWith('.csv')) {
            
            const localFile = path.join(outputDir, path.basename(file));
            await downloadFile(file, localFile, sandbox);
          }
        }
        
        console.log(`\nDownloaded files are available in the 'analysis_results' directory`);
      } else {
        console.log('\nNo files were generated by the analysis.');
      }
      
    } else {
      console.log('Analysis failed:');
      console.log(analysisResult.errors || analysisResult.error);
    }
    
    console.log('\n======================================================');
    console.log('DATA ANALYSIS WORKFLOW COMPLETED');
    console.log('======================================================');
    
  } catch (error) {
    console.error('Error in data analysis workflow:', error);
  }
}

// Run the demo if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  // Get file path and analysis request from command line arguments
  const dataFilePath = process.argv[2] || null;
  const analysisRequest = process.argv[3] || 
    "Perform exploratory data analysis, identify key patterns, and create visualizations that highlight the most important relationships in the data.";
  
  runDataAnalysisWorkflow(dataFilePath, analysisRequest);
}

// Export the function
export { runDataAnalysisWorkflow };