package com.videograb.service;

import com.videograb.config.YtDlpConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.Instant;
import java.util.stream.Stream;

/**
 * Periodically cleans up temporary downloaded files to prevent disk exhaustion.
 */
@Service
public class TempFileCleanupService {

    private static final Logger log = LoggerFactory.getLogger(TempFileCleanupService.class);
    private static final Duration MAX_AGE = Duration.ofHours(1);

    private final YtDlpConfig config;

    public TempFileCleanupService(YtDlpConfig config) {
        this.config = config;
    }

    @Scheduled(fixedRate = 30 * 60 * 1000) // every 30 minutes
    public void cleanupOldFiles() {
        Path tempDir = Path.of(config.getTempDir());
        if (!Files.isDirectory(tempDir)) {
            return;
        }

        Instant cutoff = Instant.now().minus(MAX_AGE);
        int deleted = 0;

        try (Stream<Path> files = Files.list(tempDir)) {
            var oldFiles = files
                    .filter(Files::isRegularFile)
                    .filter(f -> {
                        try {
                            return Files.getLastModifiedTime(f).toInstant().isBefore(cutoff);
                        } catch (IOException e) {
                            return false;
                        }
                    })
                    .toList();

            for (Path file : oldFiles) {
                try {
                    Files.deleteIfExists(file);
                    deleted++;
                } catch (IOException e) {
                    log.warn("Failed to delete temp file: {}", file, e);
                }
            }
        } catch (IOException e) {
            log.warn("Failed to list temp directory: {}", tempDir, e);
        }

        if (deleted > 0) {
            log.info("Cleaned up {} temporary file(s) older than {}", deleted, MAX_AGE);
        }
    }
}
