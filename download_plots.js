// Download plots from E2B sandbox
import { Sandbox } from '@e2b/code-interpreter'
import fs from 'fs'
import path from 'path'

// E2B API key
const E2B_API_KEY = process.env.E2B_API_KEY || "e2b_b1222b4303105f1e3560ecd7029c5845a9a194ff";

async function downloadPlots() {
  try {
    console.log('Creating E2B sandbox...')
    const sbx = await Sandbox.create({ apiKey: E2B_API_KEY })
    
    // Create output directory
    const outputDir = path.join(process.cwd(), 'plots')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir)
    }
    
    // First create the plots
    console.log('\nGenerating plots...')
    await sbx.runCode(`
      # Load necessary packages
      install.packages(c("ggplot2", "metafor"), repos="https://cloud.r-project.org/")
      library(ggplot2)
      library(metafor)

      # Create a directory for plots
      dir.create("plots", showWarnings = FALSE)
      
      # --- GGPLOT2 VISUALIZATIONS ---
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
      
      # Save boxplot
      ggsave("plots/boxplot.png", p1, width = 8, height = 6, dpi = 300)
      print("Boxplot created")
      
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
      
      # Save scatter plot
      ggsave("plots/scatter.png", p2, width = 8, height = 6, dpi = 300)
      print("Scatter plot created")
      
      # --- META-ANALYSIS PLOTS ---
      # Create sample dataset for meta-analysis
      dat <- data.frame(
        study = c("Study 1", "Study 2", "Study 3", "Study 4", "Study 5"),
        yi = c(0.5, 0.3, 0.8, 0.4, 0.6),
        sei = c(0.2, 0.15, 0.3, 0.18, 0.25)
      )
      
      # Fit random-effects model
      res <- rma(yi = yi, sei = sei, data = dat)
      
      # Create forest plot
      png("plots/forest_plot.png", width = 800, height = 600)
      forest(res, slab = dat$study, header = "Study", 
             xlab = "Standardized Mean Difference")
      dev.off()
      print("Forest plot created")
      
      # Create funnel plot
      png("plots/funnel_plot.png", width = 800, height = 600)
      funnel(res, xlab = "Standardized Mean Difference")
      dev.off()
      print("Funnel plot created")
      
      # List generated files
      print("Files in plots directory:")
      list.files("plots")
    `, { 
      language: 'r',
      timeoutMs: 600000 // 10 minutes timeout
    })
    
    // List files in the sandbox
    console.log('\nListing files in sandbox plots directory...')
    const files = await sbx.filesystem.list('plots')
    console.log(files)
    
    // Download each plot
    console.log('\nDownloading plots...')
    for (const file of files) {
      if (file.name.endsWith('.png')) {
        const content = await sbx.filesystem.readFile(`plots/${file.name}`)
        fs.writeFileSync(path.join(outputDir, file.name), content)
        console.log(`Downloaded: ${file.name}`)
      }
    }
    
    console.log(`\nPlots have been downloaded to: ${outputDir}`)
    console.log('You can view these files in any image viewer.')
    
  } catch (error) {
    console.error('Error:', error)
  }
}

// Run the download
downloadPlots()