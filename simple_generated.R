plot(mtcars$hp, mtcars$mpg, col=mtcars$cyl, pch=16, xlab="Horsepower", ylab="Miles per Gallon", main="mtcars: MPG vs HP")
legend("topright", legend=unique(mtcars$cyl), col=unique(mtcars$cyl), pch=16, title="Cylinders")

png("mtcars_plot.png", width=600, height=400)
plot(mtcars$hp, mtcars$mpg, col=mtcars$cyl, pch=16, xlab="Horsepower", ylab="Miles per Gallon", main="mtcars: MPG vs HP") 
legend("topright", legend=unique(mtcars$cyl), col=unique(mtcars$cyl), pch=16, title="Cylinders")
dev.off()