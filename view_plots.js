// Generate and view plots from E2B sandbox
import { Sandbox } from '@e2b/code-interpreter'
import fs from 'fs'
import path from 'path'

// E2B API key
const E2B_API_KEY = process.env.E2B_API_KEY || "e2b_b1222b4303105f1e3560ecd7029c5845a9a194ff";

async function generateAndViewPlots() {
  try {
    console.log('Creating E2B sandbox...')
    const sbx = await Sandbox.create({ apiKey: E2B_API_KEY })
    
    // Create output directory locally
    const outputDir = path.join(process.cwd(), 'plots')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir)
    }
    
    // Generate ggplot2 visualizations
    console.log('\nGenerating ggplot2 plots...')
    const ggplotResult = await sbx.runCode(`
      # Install and load packages
      if (!require("ggplot2")) install.packages("ggplot2", repos="https://cloud.r-project.org/")
      library(ggplot2)
      
      # Create sample dataset
      set.seed(123)
      data <- data.frame(
        group = rep(c("A", "B", "C", "D"), each = 25),
        value = c(rnorm(25, 5, 1), rnorm(25, 7, 1), 
                 rnorm(25, 4, 1), rnorm(25, 6, 1)),
        covariable = runif(100, 0, 10)
      )
      
      # Create boxplot
      p1 <- ggplot(data, aes(x = group, y = value, fill = group)) +
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
      
      # Save as binary file and encode for transfer
      png("boxplot.png", width = 2400, height = 1800, res = 300)
      print(p1)
      dev.off()
      
      # Create scatter plot
      p2 <- ggplot(data, aes(x = covariable, y = value, color = group)) +
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
      
      # Save as binary file and encode for transfer
      png("scatter.png", width = 2400, height = 1800, res = 300)
      print(p2)
      dev.off()
      
      # List and read the files as base64
      boxplot_file <- file("boxplot.png", "rb")
      boxplot_data <- readBin(boxplot_file, "raw", file.info("boxplot.png")$size)
      close(boxplot_file)
      
      scatter_file <- file("scatter.png", "rb")
      scatter_data <- readBin(scatter_file, "raw", file.info("scatter.png")$size)
      close(scatter_file)
      
      # Return file paths
      list.files(pattern = ".png$")
    `, { 
      language: 'r',
      timeoutMs: 300000 // 5 minutes timeout
    })
    
    console.log('ggplot2 plots generated.')
    console.log(ggplotResult)
    
    // Use a different approach to get the file content - execute bash commands
    console.log('\nRetrieving plot files...')
    const boxplotBase64 = await sbx.runBash('cat boxplot.png | base64')
    const scatterBase64 = await sbx.runBash('cat scatter.png | base64')
    
    // Save the files locally
    fs.writeFileSync(path.join(outputDir, 'boxplot.png'), 
      Buffer.from(boxplotBase64.stdout, 'base64'))
    console.log('Saved boxplot.png')
    
    fs.writeFileSync(path.join(outputDir, 'scatter.png'), 
      Buffer.from(scatterBase64.stdout, 'base64'))
    console.log('Saved scatter.png')
    
    // Generate meta-analysis plots
    console.log('\nGenerating meta-analysis plots...')
    const metaResult = await sbx.runCode(`
      # Install and load metafor package
      if (!require("metafor")) install.packages("metafor", repos="https://cloud.r-project.org/")
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
      png("forest_plot.png", width = 2400, height = 1800, res = 300)
      forest(res, slab = dat$study, header = "Study", 
             xlab = "Standardized Mean Difference")
      dev.off()
      
      # Create funnel plot
      png("funnel_plot.png", width = 2400, height = 1800, res = 300)
      funnel(res, xlab = "Standardized Mean Difference")
      dev.off()
      
      # Return file paths
      list.files(pattern = "forest|funnel")
    `, { 
      language: 'r',
      timeoutMs: 300000 // 5 minutes timeout
    })
    
    console.log('Meta-analysis plots generated.')
    console.log(metaResult)
    
    // Get meta-analysis plots
    const forestBase64 = await sbx.runBash('cat forest_plot.png | base64')
    const funnelBase64 = await sbx.runBash('cat funnel_plot.png | base64')
    
    // Save meta-analysis plots locally
    fs.writeFileSync(path.join(outputDir, 'forest_plot.png'), 
      Buffer.from(forestBase64.stdout, 'base64'))
    console.log('Saved forest_plot.png')
    
    fs.writeFileSync(path.join(outputDir, 'funnel_plot.png'), 
      Buffer.from(funnelBase64.stdout, 'base64'))
    console.log('Saved funnel_plot.png')
    
    console.log(`\nAll plots have been downloaded to: ${outputDir}`)
    console.log('You can view these files in any image viewer.')
    
  } catch (error) {
    console.error('Error:', error)
  }
}

// Run the function
generateAndViewPlots()