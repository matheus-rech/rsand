// Generate and retrieve plots using Base64 encoding
import { Sandbox } from '@e2b/code-interpreter'
import fs from 'fs'
import path from 'path'

// E2B API key
const E2B_API_KEY = process.env.E2B_API_KEY || "e2b_b1222b4303105f1e3560ecd7029c5845a9a194ff";

async function generateAndSavePlots() {
  try {
    console.log('Creating E2B sandbox...')
    const sbx = await Sandbox.create({ apiKey: E2B_API_KEY })
    
    // Create output directory locally
    const outputDir = path.join(process.cwd(), 'plots')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir)
    }
    
    // Generate and retrieve boxplot
    console.log('\nGenerating boxplot...')
    const boxplotResult = await sbx.runCode(`
      # Install and load ggplot2
      if (!require("ggplot2")) install.packages("ggplot2", repos="https://cloud.r-project.org/")
      library(ggplot2)
      
      # Create sample dataset
      set.seed(123)
      data <- data.frame(
        group = rep(c("A", "B", "C", "D"), each = 25),
        value = c(rnorm(25, 5, 1), rnorm(25, 7, 1), 
                 rnorm(25, 4, 1), rnorm(25, 6, 1))
      )
      
      # Create boxplot
      p <- ggplot(data, aes(x = group, y = value, fill = group)) +
        geom_boxplot(alpha = 0.7) +
        geom_jitter(width = 0.2, alpha = 0.5) +
        scale_fill_viridis_d() +
        theme_minimal() +
        labs(
          title = "Distribution of Values by Group",
          subtitle = "Boxplot with individual observations",
          x = "Group",
          y = "Value",
          fill = "Group"
        )
      
      # Save as file
      ggsave("boxplot.png", p, width = 8, height = 6, dpi = 300)
      
      # Encode to base64 (requires R >= 4.0.0)
      encoded <- base64enc::base64encode("boxplot.png")
      cat(encoded)
    `, {
      language: 'r',
      timeoutMs: 300000 // 5 minutes timeout
    })
    
    // Extract base64 string and save the boxplot
    let base64Data = ''
    if (boxplotResult.logs && boxplotResult.logs.stdout) {
      base64Data = boxplotResult.logs.stdout.join('')
    }
    
    if (base64Data) {
      fs.writeFileSync(path.join(outputDir, 'boxplot.png'), Buffer.from(base64Data, 'base64'))
      console.log('Saved boxplot.png')
    } else {
      console.error('Failed to get boxplot data')
    }
    
    // Generate and retrieve scatter plot
    console.log('\nGenerating scatter plot...')
    const scatterResult = await sbx.runCode(`
      # Load ggplot2 (already installed from previous execution)
      library(ggplot2)
      
      # Create sample dataset
      set.seed(123)
      data <- data.frame(
        group = rep(c("A", "B", "C", "D"), each = 25),
        value = c(rnorm(25, 5, 1), rnorm(25, 7, 1), 
                 rnorm(25, 4, 1), rnorm(25, 6, 1)),
        covariable = runif(100, 0, 10)
      )
      
      # Create scatter plot
      p <- ggplot(data, aes(x = covariable, y = value, color = group)) +
        geom_point(alpha = 0.7) +
        geom_smooth(method = "lm", se = TRUE) +
        scale_color_viridis_d() +
        theme_minimal() +
        labs(
          title = "Relationship between Variables",
          subtitle = "With linear regression by group",
          x = "Covariable",
          y = "Value",
          color = "Group"
        )
      
      # Save as file
      ggsave("scatter.png", p, width = 8, height = 6, dpi = 300)
      
      # Install base64enc if needed and encode
      if (!require("base64enc")) install.packages("base64enc", repos="https://cloud.r-project.org/")
      encoded <- base64enc::base64encode("scatter.png")
      cat(encoded)
    `, {
      language: 'r',
      timeoutMs: 300000 // 5 minutes timeout
    })
    
    // Extract base64 string and save the scatter plot
    base64Data = ''
    if (scatterResult.logs && scatterResult.logs.stdout) {
      base64Data = scatterResult.logs.stdout.join('')
    }
    
    if (base64Data) {
      fs.writeFileSync(path.join(outputDir, 'scatter.png'), Buffer.from(base64Data, 'base64'))
      console.log('Saved scatter.png')
    } else {
      console.error('Failed to get scatter plot data')
    }
    
    // Generate and retrieve forest plot
    console.log('\nGenerating forest plot...')
    const forestResult = await sbx.runCode(`
      # Install metafor and base64enc
      if (!require("metafor")) install.packages("metafor", repos="https://cloud.r-project.org/")
      if (!require("base64enc")) install.packages("base64enc", repos="https://cloud.r-project.org/")
      library(metafor)
      
      # Create sample meta-analysis dataset
      dat <- data.frame(
        study = c("Study 1", "Study 2", "Study 3", "Study 4", "Study 5"),
        yi = c(0.5, 0.3, 0.8, 0.4, 0.6),
        sei = c(0.2, 0.15, 0.3, 0.18, 0.25)
      )
      
      # Fit random-effects model
      res <- rma(yi = yi, sei = sei, data = dat)
      
      # Create forest plot
      png("forest_plot.png", width = 800, height = 600)
      forest(res, slab = dat$study, header = "Study", 
             xlab = "Standardized Mean Difference")
      dev.off()
      
      # Encode to base64
      encoded <- base64enc::base64encode("forest_plot.png")
      cat(encoded)
    `, {
      language: 'r',
      timeoutMs: 300000 // 5 minutes timeout
    })
    
    // Extract base64 string and save the forest plot
    base64Data = ''
    if (forestResult.logs && forestResult.logs.stdout) {
      base64Data = forestResult.logs.stdout.join('')
    }
    
    if (base64Data) {
      fs.writeFileSync(path.join(outputDir, 'forest_plot.png'), Buffer.from(base64Data, 'base64'))
      console.log('Saved forest_plot.png')
    } else {
      console.error('Failed to get forest plot data')
    }
    
    console.log(`\nAll plots have been saved to: ${outputDir}`)
    console.log('You can view these files in any image viewer.')
    
  } catch (error) {
    console.error('Error:', error)
  }
}

// Run the function
generateAndSavePlots()