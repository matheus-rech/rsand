# Simple R test script without external package dependencies

# Print system information
cat("R version:", R.version$version.string, "\n")
cat("Running in E2B sandbox:", Sys.getenv("E2B_SANDBOX"), "\n")

# Use the mtcars dataset for demonstration
data(mtcars)

# Print summary of the dataset
cat("\nDataset summary:\n")
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
cat("\nCurrent directory:", getwd(), "\n")
cat("Files in current directory:\n")
print(list.files())

cat("\nAnalysis completed successfully!\n")