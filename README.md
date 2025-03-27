# R Language E2B Sandbox with LLM Integration

This project demonstrates how to run R code in an E2B sandbox environment, showcasing R's specialized capabilities like data visualization, statistical modeling, and meta-analysis. The project now includes LLM (Large Language Model) integration to generate high-quality R code from natural language prompts.

## Setup

1. Get an E2B API key from [https://e2b.dev](https://e2b.dev)

2. For LLM integration, obtain API keys from:
   - OpenAI: [https://openai.com](https://openai.com)
   - Anthropic (optional): [https://anthropic.com](https://anthropic.com)

3. Copy the example environment file and set your API keys:
```
cp .env.example .env
# Edit the .env file with your API keys
```

4. Install dependencies:
```
npm install
```

## Running the Examples

### Basic R Tests
```
npm test                # Run the full R visualization test
npm run test:simple     # Run a simplified test
npm run test:meta       # Run a meta-analysis test
npm run save-plots      # Generate and save plots locally
```

### LLM-Integrated R Interpreter
```
npm run llm             # Run an R code generation example
npm run interactive     # Start an interactive R code generation session
npm run modeling        # Run a statistical modeling task
npm run prompt          # Use the prompt engineering utility to craft effective prompts
npm run upload          # Upload your own data files and analyze them
npm run analyze         # Run a complete data analysis workflow demonstration
npm run advanced        # Run an advanced R analysis with streaming output
npm run r -- help       # Use the comprehensive R CLI tool
```

### R Command-Line Interface (CLI)
```
# Show help and available commands
npm run r -- help

# Run R code from a file
npm run r -- run --file path/to/script.R --data path/to/data/dir

# Generate and run R code from a prompt
npm run r -- prompt --prompt "Analyze the mtcars dataset" --output ./results

# Start an interactive R session with LLM assistance
npm run r -- interactive
```

## LLM Integration Features

### 1. Natural Language to R Code Generation
- Convert plain English prompts into executable R code
- Specify data analysis tasks without writing code
- Automated code correction and refinement

### 2. Interactive R Environment
- Interactive session for continual data analysis
- Save history of generated code and results
- Download generated plots and visualizations

### 3. Specialized Statistical Modeling
- Generate code for complex statistical models
- Automated machine learning workflow
- Model evaluation and diagnostics

### 4. Prompt Engineering Utility
- Guided template-based prompt creation
- Task-specific prompt templates
- Prompt testing and refinement workflow
- Save and reuse effective prompts
- See [example_prompts.md](example_prompts.md) for sample prompts

### 5. Custom Dataset Analysis
- Upload your own data files (CSV, Excel, RDS, etc.)
- Automatic code generation for loading different file formats
- LLM-powered analysis of your custom datasets
- Download generated plots and analysis results

### 6. Advanced Streaming Features
- Real-time streaming of R code execution output
- Progress monitoring for long-running operations
- Environment variable configuration for R sessions
- Directory-based file uploading and downloading
- Command-line interface for easy usage

## Example Use Cases

### Basic Data Analysis
```
npm run llm "Generate summary statistics and visualizations for the iris dataset"
```

### Interactive Session
```
npm run interactive
# Then follow the prompts to specify your data analysis tasks
```

### Statistical Modeling
```
npm run modeling "Build a random forest model to predict mpg using the mtcars dataset"
```

### Custom Dataset Analysis
```
npm run upload
# Follow the prompts to upload your data file and analyze it
```

### Complete Analysis Workflow
```
# Analyze a sample dataset with default analysis request
npm run analyze

# Analyze your own dataset with a custom analysis request
npm run analyze /path/to/your/data.csv "Perform clustering analysis and visualize the results"
```

### Advanced CLI Usage
```
# Interactive R session with LLM assistance
npm run r -- interactive

# Run from a prompt with data directory
npm run r -- prompt --prompt "Analyze the CSV files in the data directory" --data ./examples/data

# Execute a sample R script with example data
npm run r -- run --file ./examples/sample_analysis.R --data ./examples/data --output ./results
```

### Rendering R Markdown Reports
```
# First, copy the R Markdown template to the data directory
mkdir -p data_input
cp ./examples/report_template.Rmd data_input/

# Then run the render script with the data and R Markdown template
npm run r -- run --file ./examples/render_report.R --data ./data_input --output ./html_reports
```

## Original Testing Features

### 1. Basic R Functionality
- Creating an E2B sandbox
- Running simple R code

### 2. Advanced Data Visualization with ggplot2
- Installing and loading R packages
- Data manipulation with dplyr
- Creating publication-quality visualizations

### 3. Meta-Analysis
- Specialized statistical methods
- Forest plots and funnel plots
- Heterogeneity tests

## Troubleshooting

If you encounter errors:

1. E2B API key issues:
   - Ensure you have registered at [https://e2b.dev](https://e2b.dev)
   - Verify your API key is correctly set in the .env file

2. LLM API key issues:
   - Check that you've added the correct API keys to the .env file
   - Verify the LLM_PROVIDER setting matches the API key you've provided

3. Execution timeouts:
   - For complex modeling tasks, you may need to increase the timeout in the code