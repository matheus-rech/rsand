// Simple script to run R code directly in the E2B sandbox
import { Sandbox } from '@e2b/code-interpreter';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// E2B API key
const E2B_API_KEY = process.env.E2B_API_KEY || "e2b_b1222b4303105f1e3560ecd7029c5845a9a194ff";

// Simple R code (or load from a file)
const rCode = `
# Print system information
cat("R version:", R.version$version.string, "\\n")

# Use the mtcars dataset for demonstration
data(mtcars)

# Print summary of the dataset
cat("\\nDataset summary:\\n")
summary(mtcars)

# Create a simple plot
png("simple_plot.png", width = 800, height = 600)
plot(mtcars$hp, mtcars$mpg, 
     main = "Horsepower vs MPG", 
     xlab = "Horsepower (hp)", 
     ylab = "Miles per Gallon (mpg)",
     pch = 19, col = "blue")
dev.off()

# Print current directory and files
cat("\\nCurrent directory:", getwd(), "\\n")
cat("Files in current directory:\\n")
print(list.files())

cat("\\nAnalysis completed successfully!\\n")
`;

async function runRCode() {
  try {
    // Create a sandbox
    console.log('Creating E2B sandbox...');
    const sandbox = await Sandbox.create({ apiKey: E2B_API_KEY });
    
    // Execute the R code
    console.log('Executing R code...');
    const execution = await sandbox.runCode(rCode, { 
      language: 'r',
      timeoutMs: 60000, // 1 minute timeout
      onStdout: (data) => console.log(data),
      onStderr: (data) => console.error(data)
    });
    
    // Check for errors
    if (execution.error) {
      console.error('Execution error:', execution.error);
    } else {
      console.log('Execution completed successfully');
      
      // Check if the sandbox has the files property
      if (sandbox.files) {
        try {
          console.log('Trying to download simple_plot.png using files API...');
          const plotContent = await sandbox.files.read('/home/user/simple_plot.png');
          fs.writeFileSync('downloaded_plot.png', plotContent);
          console.log('Plot saved to downloaded_plot.png');
        } catch (err) {
          console.error('Error downloading file:', err.message);
        }
      } else {
        console.error('Files API not available in this version of the E2B sandbox');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the code
runRCode();