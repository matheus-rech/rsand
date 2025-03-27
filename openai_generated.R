if(!require("ggplot2")) install.packages("ggplot2", repos="https://cloud.r-project.org/")
if(!require("dplyr")) install.packages("dplyr", repos="https://cloud.r-project.org!")

perform_t_test <- function(vector1, vector2, style = "classic") {
  # Error handling for input vectors
  if (!is.numeric(vector1) || !is.numeric(vector2)) {
    stop("Both inputs must be numeric vectors.")
  }
  
  # Perform t-test
  t_test_result <- tryCatch({
    t.test(vector1, vector2)
  }, error = function(e) {
    stop("Error in performing t-test: ", e$message)
  })
  
  # Prepare data for visualization
  data <- data.frame(
    group = rep(c("Vector 1", "Vector 2"), each = length(vector1)),
    value = c(vector1, vector2)
  )
  
  # Calculate means and standard errors
  summary_stats <- data %>%
    group_by(group) %>%
    summarise(
      mean = mean(value, na.rm = TRUE),
      se = sd(value, na.rm = TRUE) / sqrt(n())
    )
  
  # Create plot
  plot <- ggplot(summary_stats, aes(x = group, y = mean, fill = group)) +
    geom_bar(stat = "identity", position = position_dodge(), width = 0.7) +
    geom_errorbar(aes(ymin = mean - se, ymax = mean + se), width = 0.2, position = position_dodge(0.7)) +
    labs(title = "Comparison of Means with Error Bars", x = "Group", y = "Mean Value") +
    theme_minimal() +
    theme(legend.position = "none")
  
  # Apply different styles
  if (style == "classic") {
    plot <- plot + theme_classic()
  } else if (style == "minimal") {
    plot <- plot + theme_minimal()
  } else if (style == "dark") {
    plot <- plot + theme_dark()
  } else {
    warning("Style not recognized. Using default theme.")
  }
  
  # Save plot as PNG
  ggsave("t_test_comparison.png", plot, width = 6, height = 4, dpi = 300)
  
  # Return t-test result and plot
  list(t_test_result = t_test_result, plot = plot)
}

# Example usage:
# result <- perform_t_test(rnorm(30, mean = 5), rnorm(30, mean = 6), style = "dark")
# print(result$t_test_result)
# print(result$plot)