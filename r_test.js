// R language test using E2B sandbox
import { Sandbox } from '@e2b/code-interpreter'

// E2B API key
const E2B_API_KEY = process.env.E2B_API_KEY || "e2b_b1222b4303105f1e3560ecd7029c5845a9a194ff";

async function testRSandbox() {
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
    
    // Install packages first with increased timeout
    console.log('\nInstalling R packages (this may take a while)...')
    const packageInstallation = await sbx.runCode(`
      # Install necessary packages if not already installed
      install.packages(c("ggplot2", "dplyr"), repos="https://cloud.r-project.org/")
      print("Package installation completed")
    `, { 
      language: 'r', 
      timeoutMs: 300000 // 5 minutes timeout for package installation
    })
    
    console.log('Package installation result:')
    console.log(packageInstallation)
    
    // Now run the ggplot2 visualization with loaded packages
    console.log('\nRunning ggplot2 visualization test...')
    const ggplotExecution = await sbx.runCode(`
      # Load packages
      library(ggplot2)
      library(dplyr)
      
      # Create sample dataset
      set.seed(123)
      data <- data.frame(
        group = rep(c("A", "B", "C", "D"), each = 25),
        value = c(rnorm(25, 5, 1), rnorm(25, 7, 1), 
                 rnorm(25, 4, 1), rnorm(25, 6, 1)),
        covariable = runif(100, 0, 10)
      )
      
      # Basic data manipulation
      data_summary <- data %>%
        group_by(group) %>%
        summarize(
          mean_value = mean(value),
          sd_value = sd(value),
          median_value = median(value),
          n = n()
        )
      
      print(data_summary)
      
      # Create beautiful ggplot2 visualization
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
      
      # Save plot 1
      ggsave("boxplot.png", p1, width = 8, height = 6, dpi = 300)
      print("Boxplot created successfully")
      
      # Create scatter plot with regression line
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
      
      # Save plot 2
      ggsave("scatter.png", p2, width = 8, height = 6, dpi = 300)
      print("Scatter plot created successfully")
      
      # List created files
      list.files(pattern = ".png$")
    `, { 
      language: 'r',
      timeoutMs: 120000 // 2 minutes timeout for visualization
    })
    
    console.log('ggplot2 visualization results:')
    console.log(ggplotExecution)
    
    // Install meta-analysis packages
    console.log('\nInstalling meta-analysis packages (this may take a long time)...')
    const metaPackageInstallation = await sbx.runCode(`
      # Install meta-analysis packages
      install.packages("meta", repos="https://cloud.r-project.org/")
      print("Meta package installation completed")
    `, { 
      language: 'r',
      timeoutMs: 600000 // 10 minutes timeout for package installation
    })
    
    console.log('Meta-analysis package installation result:')
    console.log(metaPackageInstallation)
    
    // Run basic meta-analysis
    console.log('\nRunning meta-analysis test...')
    const metaAnalysisExecution = await sbx.runCode(`
      # Load meta-analysis packages
      library(meta)
      library(metafor)
      
      # Create sample meta-analysis dataset
      # Study data (treatment vs control with mean, SD, and sample size)
      studies <- data.frame(
        study = c("Smith et al., 2019", "Johnson et al., 2020", 
                 "Williams et al., 2018", "Davis et al., 2021"),
        mean_treatment = c(12.5, 14.2, 11.8, 15.3),
        sd_treatment = c(2.5, 3.1, 2.2, 3.5),
        n_treatment = c(45, 58, 40, 62),
        mean_control = c(10.2, 11.5, 10.1, 12.8),
        sd_control = c(2.3, 2.9, 2.1, 3.2),
        n_control = c(43, 55, 42, 60)
      )
      
      # Print dataset
      print(studies)
      
      # Perform meta-analysis using metacont from the meta package
      meta_results <- metacont(
        n.e = n_treatment,
        mean.e = mean_treatment,
        sd.e = sd_treatment,
        n.c = n_control,
        mean.c = mean_control,
        sd.c = sd_control,
        studlab = study,
        data = studies,
        sm = "SMD",  # Standardized Mean Difference
        method.smd = "Hedges",
        comb.fixed = TRUE,
        comb.random = TRUE,
        title = "Effect of Treatment on Outcome"
      )
      
      # Print meta-analysis summary
      print(summary(meta_results))
      
      # Create forest plot
      png("forest_plot.png", width = 800, height = 600)
      forest(meta_results, 
             label.left = "Favors Control", 
             label.right = "Favors Treatment",
             fontsize = 10)
      dev.off()
      print("Forest plot created successfully")
      
      # List created files
      list.files(pattern = ".png$")
    `, { 
      language: 'r', 
      timeoutMs: 120000 // 2 minutes timeout for meta-analysis
    })
    
    console.log('Meta-analysis results:')
    console.log(metaAnalysisExecution)
    
    console.log('Test completed - sandbox will be automatically cleaned up')
  } catch (error) {
    console.error('Error:', error)
  }
}

// Run the test
testRSandbox()