# Sample R analysis script for testing the CLI

# Print system information
cat("R version:", R.version$version.string, "\n")
cat("Running in E2B sandbox:", Sys.getenv("E2B_SANDBOX"), "\n")

# Load required packages
if (!require("ggplot2")) install.packages("ggplot2", repos="https://cloud.r-project.org/")
if (!require("dplyr")) install.packages("dplyr", repos="https://cloud.r-project.org/")
library(ggplot2)
library(dplyr)

# Check for data directory
data_dir <- "/home/user/data"
if (dir.exists(data_dir)) {
  cat("Data directory exists. Files:\n")
  print(list.files(data_dir))
} else {
  cat("No data directory found, using built-in dataset.\n")
}

# Use the mtcars dataset for demonstration
data(mtcars)
mtcars$car_name <- rownames(mtcars)

# Print summary of the dataset
cat("\nDataset summary:\n")
summary(mtcars)

# Create output directory
output_dir <- "/home/user/output"
if (!dir.exists(output_dir)) {
  dir.create(output_dir, recursive = TRUE)
}

# Perform basic data manipulation
cars_summary <- mtcars %>%
  group_by(cyl) %>%
  summarize(
    count = n(),
    avg_mpg = mean(mpg),
    avg_hp = mean(hp),
    avg_wt = mean(wt)
  )

# Print summary by cylinder count
cat("\nSummary by cylinder count:\n")
print(cars_summary)

# Create a scatter plot of mpg vs hp colored by cylinder count
cat("\nCreating scatter plot...\n")
p1 <- ggplot(mtcars, aes(x = hp, y = mpg, color = factor(cyl))) +
  geom_point(size = 3, alpha = 0.7) +
  labs(
    title = "Relationship between Horsepower and Fuel Efficiency",
    x = "Horsepower (hp)",
    y = "Miles per Gallon (mpg)",
    color = "Cylinders"
  ) +
  theme_minimal() +
  scale_color_viridis_d()

# Save the plot
ggsave(file.path(output_dir, "mpg_vs_hp.png"), p1, width = 8, height = 6, dpi = 300)
cat("Saved scatter plot to", file.path(output_dir, "mpg_vs_hp.png"), "\n")

# Create a boxplot of mpg by cylinder count
cat("\nCreating boxplot...\n")
p2 <- ggplot(mtcars, aes(x = factor(cyl), y = mpg, fill = factor(cyl))) +
  geom_boxplot() +
  labs(
    title = "Distribution of Fuel Efficiency by Cylinder Count",
    x = "Number of Cylinders",
    y = "Miles per Gallon (mpg)",
    fill = "Cylinders"
  ) +
  theme_minimal() +
  scale_fill_viridis_d()

# Save the plot
ggsave(file.path(output_dir, "mpg_by_cyl.png"), p2, width = 8, height = 6, dpi = 300)
cat("Saved boxplot to", file.path(output_dir, "mpg_by_cyl.png"), "\n")

# Create a correlation heatmap
cat("\nCreating correlation heatmap...\n")
# Select only numeric columns for correlation
mtcars_numeric <- mtcars %>% select(mpg, cyl, disp, hp, drat, wt, qsec)
cor_matrix <- cor(mtcars_numeric)

# Convert to long format for ggplot
cor_data <- as.data.frame(as.table(cor_matrix))
names(cor_data) <- c("Var1", "Var2", "Correlation")

# Create the heatmap
p3 <- ggplot(cor_data, aes(x = Var1, y = Var2, fill = Correlation)) +
  geom_tile() +
  scale_fill_gradient2(low = "blue", high = "red", mid = "white", midpoint = 0) +
  labs(
    title = "Correlation Heatmap of Car Features",
    x = "",
    y = ""
  ) +
  theme_minimal() +
  theme(axis.text.x = element_text(angle = 45, hjust = 1))

# Save the plot
ggsave(file.path(output_dir, "correlation_heatmap.png"), p3, width = 8, height = 6, dpi = 300)
cat("Saved correlation heatmap to", file.path(output_dir, "correlation_heatmap.png"), "\n")

# Create a simple linear model
cat("\nFitting linear model: mpg ~ hp + wt\n")
model <- lm(mpg ~ hp + wt, data = mtcars)
cat("Model summary:\n")
print(summary(model))

# Save the model summary as a text file
sink(file.path(output_dir, "model_summary.txt"))
print(summary(model))
sink()
cat("Saved model summary to", file.path(output_dir, "model_summary.txt"), "\n")

# Create a CSV file with the processed data
write.csv(mtcars, file.path(output_dir, "processed_cars.csv"), row.names = FALSE)
cat("Saved processed data to", file.path(output_dir, "processed_cars.csv"), "\n")

# List all files created in the output directory
cat("\nFiles created in output directory:\n")
print(list.files(output_dir))

cat("\nAnalysis completed successfully!\n")