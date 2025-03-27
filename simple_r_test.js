// Simple R test using E2B sandbox
import { Sandbox } from '@e2b/code-interpreter'

// E2B API key
const E2B_API_KEY = process.env.E2B_API_KEY || "e2b_b1222b4303105f1e3560ecd7029c5845a9a194ff";

async function testSimpleR() {
  try {
    console.log('Creating E2B sandbox...')
    // Pass the API key when creating the sandbox
    const sbx = await Sandbox.create({ apiKey: E2B_API_KEY })
    
    console.log('Running basic R code...')
    const execution = await sbx.runCode('print("Hello, world!")', { 
      language: 'r',
      timeoutMs: 30000 // 30 seconds timeout
    })
    
    console.log('Execution result:')
    console.log(execution)
    
    // Simple R statistics
    console.log('\nRunning basic R statistics...')
    const statsExecution = await sbx.runCode(`
      # Create a simple numeric vector
      x <- c(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
      
      # Calculate basic statistics
      mean_x <- mean(x)
      median_x <- median(x)
      sd_x <- sd(x)
      var_x <- var(x)
      
      # Print results
      cat("Mean:", mean_x, "\\n")
      cat("Median:", median_x, "\\n")
      cat("Standard Deviation:", sd_x, "\\n")
      cat("Variance:", var_x, "\\n")
      
      # Run a simple t-test
      y <- c(2, 3, 4, 5, 6, 7, 8, 9, 10, 11)
      t_test_result <- t.test(x, y, paired = TRUE)
      print(t_test_result)
      
      # Create a simple linear model
      data <- data.frame(x = x, y = y)
      model <- lm(y ~ x, data = data)
      print(summary(model))
    `, { 
      language: 'r',
      timeoutMs: 30000 
    })
    
    console.log('R statistics results:')
    console.log(statsExecution)
    
    console.log('Test completed - sandbox will be automatically cleaned up')
  } catch (error) {
    console.error('Error:', error)
  }
}

// Run the test
testSimpleR()