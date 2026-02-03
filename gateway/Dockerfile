# reducer dockerfile size from 900MB to 150MB vy going through multiple stage building, 80% reduction .

# STAGE 1: Build stage uses JDK + Maven only to building this stage will not be part of final image.
# =========================================================
FROM maven:3.9.9-eclipse-temurin-22 AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy the pom.xml and download dependencies (BETTER LAYER CACHING)
COPY pom.xml .

#  Download dependencies ONLY (CACHED FOR FUTURE BUILDS)
RUN mvn dependency:go-offline -B

# Copy the source code into the container
COPY src ./src

RUN mvn -DskipTests clean package

# STAGE 2: RUNTIME/ PRODUCTION stage Minimal JRE image only for running the application.
# =========================================================
FROM openjdk:22-jdk AS runner

# Set the working directory inside the container
WORKDIR /app

# Copy the built jar file from the builder stage
COPY --from=builder /app/target/gateway-0.0.1-SNAPSHOT.jar app.jar

# Expose the application port
EXPOSE 4004

# Command to run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
