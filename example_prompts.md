# Effective R Code Prompts for LLMs

This document provides examples of effective prompts for generating high-quality R code with Large Language Models.

## Best Practices for R Code Prompts

1. **Be specific about the task**: Clearly define what analysis or visualization you want
2. **Specify the dataset**: Name the dataset to use (built-in or with structure details)
3. **Request proper error handling**: Ask for robust code that handles edge cases
4. **Ask for proper documentation**: Request comments explaining the code
5. **Specify output format**: Request specific file formats for plots or results
6. **Request tidyverse practices**: Specify that you want modern R coding style

## Example Prompts by Category

### Data Visualization

```
Create a comprehensive visualization of the mtcars dataset that explores the relationship between 
mpg, hp, and cyl variables. Include both scatter plots and boxplots, with appropriate colors 
and themes. Add regression lines where appropriate. Include proper axis labels, titles, and 
legends. Save the output as high-resolution PNG files.
```

### Statistical Analysis

```
Perform a comprehensive ANOVA analysis on the iris dataset to examine differences in sepal length 
across species. Include proper assumption checking (normality, homogeneity of variance), post-hoc 
tests with appropriate p-value adjustments, and effect size calculations. Visualize the results 
with appropriate plots including means with confidence intervals. Include proper interpretation 
of the results in the comments.
```

### Machine Learning

```
Build a random forest model to predict diabetes status using the PimaIndiansDiabetes dataset from 
the mlbench package. Include the following steps:
1. Data preprocessing with proper handling of missing values
2. Feature scaling and engineering if needed
3. Train/test split with appropriate proportions
4. Cross-validation approach for model training
5. Hyperparameter tuning for optimal performance
6. Feature importance assessment and visualization
7. Model evaluation with confusion matrix, ROC curve, and appropriate metrics
8. Saving the model and results for future use

Use the tidymodels framework and ensure the code is reproducible by setting appropriate seeds.
```

### Data Cleaning

```
Write R code to clean and preprocess the airquality dataset. Handle missing values using appropriate 
imputation methods (not just removal), identify and address outliers, scale numeric variables 
appropriately, check for and handle multicollinearity, and create derived features that might 
be useful for analysis (e.g., day of week, month as factor, interaction terms). Create a report 
summarizing the cleaning steps with before/after comparisons.
```

### Reporting

```
Create an R script that analyzes the gapminder dataset (from the gapminder package) and generates 
a comprehensive report with tables and visualizations. Include:
1. Descriptive statistics tables by continent and decade
2. Life expectancy trends over time by continent with beautiful visualizations
3. GDP per capita vs life expectancy relationship exploration
4. Population growth analysis
5. A mixed-effects model examining factors affecting life expectancy

Ensure all tables are well-formatted and all visualizations have proper titles, labels, and themes.
Generate a final report as an HTML file using R Markdown.
```

## Advanced Prompt Techniques

### Specify Code Quality Requirements

```
Generate R code to analyze the relationship between various meteorological factors and energy 
consumption in the powerplant dataset. The code should follow tidyverse best practices, include 
comprehensive error handling, be properly commented, and follow a consistent style guide. Include 
unit tests for key functions.
```

### Request Multiple Approaches

```
Create R code to cluster the USArrests dataset using three different approaches:
1. K-means clustering
2. Hierarchical clustering
3. DBSCAN

For each approach, determine the optimal number of clusters where appropriate, visualize the results, 
and compare the clustering solutions. Create a summary that evaluates the strengths and weaknesses 
of each approach for this specific dataset.
```

### Incremental Development

```
Create an R script for predictive modeling of house prices. Implement this in phases:
1. First, create a simple linear regression model
2. Then extend it to multiple regression with appropriate variable selection
3. Finally, implement a more advanced model (like random forest or gradient boosting)

Compare the performance of these models and visualize their predictions. Include detailed comments 
explaining the rationale for each step.
```