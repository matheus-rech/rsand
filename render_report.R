# Script to render an R Markdown document to HTML

# Install required packages if not already installed
if (!require("rmarkdown")) install.packages("rmarkdown", repos="https://cloud.r-project.org/")
if (!require("knitr")) install.packages("knitr", repos="https://cloud.r-project.org/")

# Check for inputs
rmd_file <- "/home/user/data/report_template.Rmd"
output_file <- "/home/user/output/report.html"

# Check if Rmd file exists
if (!file.exists(rmd_file)) {
  stop("Rmd file not found: ", rmd_file)
}

# Set output directory
output_dir <- dirname(output_file)
if (!dir.exists(output_dir)) {
  dir.create(output_dir, recursive = TRUE)
}

# Render the Rmd file to HTML
cat("Rendering", rmd_file, "to", output_file, "\n")
rmarkdown::render(
  input = rmd_file, 
  output_file = basename(output_file),
  output_dir = output_dir,
  envir = new.env()
)

# Confirm rendered file exists
if (file.exists(output_file)) {
  cat("Successfully rendered report to", output_file, "\n")
} else {
  cat("Failed to render report\n")
}

# List files in output directory
cat("\nFiles in output directory:\n")
list.files(output_dir)