// Meta-analysis test in R using E2B sandbox
import { Sandbox } from '@e2b/code-interpreter'

// E2B API key
const E2B_API_KEY = process.env.E2B_API_KEY || "e2b_b1222b4303105f1e3560ecd7029c5845a9a194ff";

async function testMetaAnalysis() {
  try {
    console.log('Creating E2B sandbox...')
    // Pass the API key when creating the sandbox
    const sbx = await Sandbox.create({ apiKey: E2B_API_KEY })
    
    // First, install just the metafor package (smaller than meta package)
    console.log('\nInstalling metafor package (this may take a while)...')
    const packageInstallation = await sbx.runCode(`
      # Install necessary packages if not already installed
      install.packages("metafor", repos="https://cloud.r-project.org/")
      print("Package installation completed")
    `, { 
      language: 'r', 
      timeoutMs: 600000 // 10 minutes timeout for package installation
    })
    
    console.log('Package installation result:')
    console.log(packageInstallation)
    
    // Run a simple meta-analysis example using metafor
    console.log('\nRunning simple meta-analysis test...')
    const metaExecution = await sbx.runCode(`
      # Load package
      library(metafor)
      
      # Create a simple dataset for meta-analysis
      # This dataset contains effect sizes (yi) and their standard errors (sei)
      # from multiple studies
      dat <- data.frame(
        study = c("Study 1", "Study 2", "Study 3", "Study 4", "Study 5"),
        yi = c(0.5, 0.3, 0.8, 0.4, 0.6),    # effect sizes
        sei = c(0.2, 0.15, 0.3, 0.18, 0.25)  # standard errors
      )
      
      # Print dataset
      print(dat)
      
      # Fit random-effects model
      res <- rma(yi = yi, sei = sei, data = dat, method = "REML")
      
      # Print results
      print(summary(res))
      
      # Create a forest plot
      png("meta_forest.png", width = 800, height = 600)
      forest(res, slab = dat$study, header = "Study", 
             xlab = "Standardized Mean Difference")
      dev.off()
      
      # Create a funnel plot
      png("meta_funnel.png", width = 800, height = 600)
      funnel(res, xlab = "Standardized Mean Difference")
      dev.off()
      
      # List created files
      list.files(pattern = ".png$")
    `, { 
      language: 'r',
      timeoutMs: 120000 // 2 minutes timeout
    })
    
    console.log('Meta-analysis results:')
    console.log(metaExecution)
    
    console.log('Test completed - sandbox will be automatically cleaned up')
  } catch (error) {
    console.error('Error:', error)
  }
}

// Run the test
testMetaAnalysis()