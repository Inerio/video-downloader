# ---- Build stage ----
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests -B

# ---- Runtime stage ----
FROM eclipse-temurin:21-jre

# Install yt-dlp and ffmpeg
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 python3-pip python3-venv ffmpeg && \
    python3 -m venv /opt/venv && \
    /opt/venv/bin/pip install --no-cache-dir yt-dlp && \
    ln -s /opt/venv/bin/yt-dlp /usr/local/bin/yt-dlp && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Create temp directory for yt-dlp downloads
RUN mkdir -p /tmp/videograb && chmod 777 /tmp/videograb

WORKDIR /app
COPY --from=build /app/target/video-downloader-back-*.jar app.jar

ENV SPRING_PROFILES_ACTIVE=prod
ENV JAVA_OPTS="-Xmx512m"

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
