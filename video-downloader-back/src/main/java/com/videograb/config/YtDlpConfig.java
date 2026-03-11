package com.videograb.config;

import jakarta.annotation.PostConstruct;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@Configuration
@ConfigurationProperties(prefix = "ytdlp")
public class YtDlpConfig {

    private String path = "yt-dlp";
    private String tempDir;
    private int timeout = 120;
    private String maxFilesize = "500M";

    @PostConstruct
    public void init() throws IOException {
        if (tempDir != null) {
            Files.createDirectories(Path.of(tempDir));
        }
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public String getTempDir() {
        return tempDir;
    }

    public void setTempDir(String tempDir) {
        this.tempDir = tempDir;
    }

    public int getTimeout() {
        return timeout;
    }

    public void setTimeout(int timeout) {
        this.timeout = timeout;
    }

    public String getMaxFilesize() {
        return maxFilesize;
    }

    public void setMaxFilesize(String maxFilesize) {
        this.maxFilesize = maxFilesize;
    }
}
