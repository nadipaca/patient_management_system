# Use multi-stage build to reduce the final image size
# Stage 1: Build the application
# Stage 2: Create the final image to run the application
# Base image with Maven and JDK to build the application
# Using Eclipse Temurin JDK 22 with Maven 3.9.9
FROM maven:3.9.9-eclipse-temurin-22 AS builder

# setting working directory
WORKDIR /app

# copy the pom.xml file to the container
COPY pom.xml .

# installing dependencies from pom.xml file
RUN mvn dependency:go-offline -B

# copy the source code to the container
COPY src ./src

# package the application
RUN mvn clean package

# Stage 2: Create the final image to run the application
FROM openjdk:22-jdk AS runner

WORKDIR /app

# copy the built jar file from the builder stage
COPY --from=builder /app/target/billing-service-0.0.1-SNAPSHOT.jar ./app.jar

# expose the application port
EXPOSE 4001
EXPOSE 9001

# command to run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
