# Install and load required packages
if(!require("ggplot2")) install.packages("ggplot2", repos="https://cloud.r-project.org/")
library(ggplot2)

# Create scatter plot
plot <- ggplot(mtcars, aes(x = hp, y = mpg, color = as.factor(cyl))) +
  geom_point(size = 3) +
  scale_color_discrete(name = "Cylinders") +
  labs(title = "MPG vs Horsepower",
       x = "Horsepower",
       y = "Miles per Gallon") +
  theme_minimal() +
  theme(plot.title = element_text(hjust = 0.5, size = 16),
        axis.title = element_text(size = 14),
        legend.title = element_text(size = 14),
        legend.text = element_text(size = 12))

# Save plot as PNG
ggsave("mtcars_scatter.png", plot, width = 8, height = 6, dpi = 300)