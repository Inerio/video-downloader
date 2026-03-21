package com.videograb.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.videograb.config.YtDlpConfig;
import com.videograb.dto.DownloadProgressDto;
import com.videograb.exception.DownloadException;
import com.videograb.exception.VideoNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

// DISABLED — HD merge download feature deactivated (Cloudflare Tunnel TOS).
// This service manages async download tasks with SSE progress streaming.
// To re-enable: uncomment @Service, re-activate AsyncConfig, and restore
// the async endpoints in VideoController.
// @Service
public class DownloadTaskService {

    private static final Logger log = LoggerFactory.getLogger(DownloadTaskService.class);

    private static final Pattern PROGRESS_PATTERN =
            Pattern.compile("\\[download\\]\\s+(\\d+\\.?\\d*)%\\s+of.*?at\\s+(\\S+)\\s+ETA\\s+(\\S+)");
    private static final Pattern PROGRESS_SIMPLE_PATTERN =
            Pattern.compile("\\[download\\]\\s+(\\d+\\.?\\d*)%");
    private static final Pattern MERGE_PATTERN =
            Pattern.compile("\\[(Merger|ffmpeg)\\]");
    private static final Pattern DESTINATION_PATTERN =
            Pattern.compile("\\[download\\] Destination:");

    private final ConcurrentHashMap<String, DownloadTask> tasks = new ConcurrentHashMap<>();
    private final YtDlpService ytDlpService;
    private final TwitterFallbackService twitterFallback;
    private final YtDlpConfig ytDlpConfig;
    private final ObjectMapper objectMapper;

    public DownloadTaskService(YtDlpService ytDlpService, TwitterFallbackService twitterFallback,
                               YtDlpConfig ytDlpConfig, ObjectMapper objectMapper) {
        this.ytDlpService = ytDlpService;
        this.twitterFallback = twitterFallback;
        this.ytDlpConfig = ytDlpConfig;
        this.objectMapper = objectMapper;
    }

    public String createTask(String url, String formatId) {
        String taskId = UUID.randomUUID().toString();
        // "best" gets remapped to "bestvideo+bestaudio/best" in YtDlpService → it's a merge format
        boolean isMerge = formatId.contains("+") || "best".equals(formatId);
        DownloadTask task = new DownloadTask(taskId, isMerge);
        tasks.put(taskId, task);
        return taskId;
    }

    /**
     * Remove task from map if execution never started (e.g. thread pool rejection).
     */
    public void removeTask(String taskId) {
        tasks.remove(taskId);
    }

    @Async("downloadTaskExecutor")
    public void executeDownload(String taskId, String url, String formatId) {
        DownloadTask task = tasks.get(taskId);
        if (task == null) return;

        task.status = "downloading";
        sendProgress(task);

        try {
            Path filePath;
            // Twitter fallback: formatId is a direct media URL
            if (formatId.startsWith("https://")) {
                filePath = twitterFallback.downloadDirect(formatId, ytDlpConfig.getTempDir());
            } else {
                filePath = ytDlpService.downloadVideo(url, formatId, line -> {
                    parseLine(task, line);
                    sendProgress(task);
                });
            }

            task.status = "complete";
            task.percent = 100;
            task.filePath = filePath;
            sendProgress(task);
            completeEmitter(task);

        } catch (VideoNotFoundException | DownloadException e) {
            task.status = "error";
            task.errorMessage = e.getMessage();
            sendProgress(task);
            completeEmitter(task);
        } catch (Exception e) {
            log.error("Download task failed: {}", taskId, e);
            task.status = "error";
            task.errorMessage = "Une erreur inattendue est survenue. Réessayez.";
            sendProgress(task);
            completeEmitter(task);
        }
    }

    public void subscribeToProgress(String taskId, SseEmitter emitter) {
        DownloadTask task = tasks.get(taskId);
        if (task == null) {
            try {
                emitter.send(SseEmitter.event()
                        .name("progress")
                        .data("{\"status\":\"error\",\"percent\":0,\"speed\":\"\",\"eta\":\"\",\"error\":\"Téléchargement introuvable ou expiré. Relancez le téléchargement.\",\"downloadPass\":0,\"phase\":\"\",\"isMergeFormat\":false}"));
                emitter.complete();
            } catch (IOException ignored) {}
            return;
        }

        task.emitter = emitter;

        emitter.onCompletion(() -> task.emitter = null);
        emitter.onTimeout(() -> task.emitter = null);
        emitter.onError(e -> task.emitter = null);

        // Send current state immediately
        sendProgress(task);

        // If already complete or error, close the emitter
        if ("complete".equals(task.status) || "error".equals(task.status)) {
            completeEmitter(task);
        }
    }

    public Path getFilePathAndMarkServed(String taskId) {
        DownloadTask task = tasks.get(taskId);
        if (task == null || task.filePath == null) {
            return null;
        }
        task.servedAt = Instant.now();
        return task.filePath;
    }

    public Path getFilePath(String taskId) {
        DownloadTask task = tasks.get(taskId);
        if (task == null || task.filePath == null) {
            return null;
        }
        return task.filePath;
    }

    public boolean taskExists(String taskId) {
        return tasks.containsKey(taskId);
    }

    private void parseLine(DownloadTask task, String line) {
        log.debug("yt-dlp: {}", line);

        // Detect [Merger] or [ffmpeg] → merge phase
        if (MERGE_PATTERN.matcher(line).find()) {
            task.status = "merging";
            task.phase = "merge";
            task.percent = 99;
            task.speed = "";
            task.eta = "";
            return;
        }

        // Detect destination lines → count streams for pass tracking
        if (DESTINATION_PATTERN.matcher(line).find()) {
            task.destinationCount++;
            if (task.destinationCount == 1) {
                task.phase = "video";
                task.downloadPass = 0;
            } else if (task.destinationCount == 2) {
                task.phase = "audio";
                task.downloadPass = 1;
                task.percent = 0;
            }
            return;
        }

        // Parse progress with speed and ETA
        Matcher progressMatcher = PROGRESS_PATTERN.matcher(line);
        if (progressMatcher.find()) {
            double newPercent = Double.parseDouble(progressMatcher.group(1));

            // Fallback pass detection: progress dropped significantly → new stream
            if (task.percent > 80 && newPercent < 10 && task.destinationCount < 2) {
                task.downloadPass++;
                task.phase = task.downloadPass >= 1 ? "audio" : "video";
            }

            task.status = "downloading";
            task.percent = newPercent;
            task.speed = progressMatcher.group(2);
            task.eta = progressMatcher.group(3);
            if (task.phase == null || task.phase.isEmpty()) {
                task.phase = "video";
            }
            return;
        }

        // Simple progress (no speed/ETA)
        Matcher simpleMatcher = PROGRESS_SIMPLE_PATTERN.matcher(line);
        if (simpleMatcher.find()) {
            double newPercent = Double.parseDouble(simpleMatcher.group(1));

            if (task.percent > 80 && newPercent < 10 && task.destinationCount < 2) {
                task.downloadPass++;
                task.phase = task.downloadPass >= 1 ? "audio" : "video";
            }

            task.status = "downloading";
            task.percent = newPercent;
            if (task.phase == null || task.phase.isEmpty()) {
                task.phase = "video";
            }
        }
    }

    private void sendProgress(DownloadTask task) {
        SseEmitter emitter = task.emitter;
        if (emitter == null) return;

        try {
            DownloadProgressDto dto = new DownloadProgressDto(
                    task.status, task.percent, task.speed, task.eta, task.errorMessage,
                    task.downloadPass, task.phase, task.isMergeFormat
            );
            emitter.send(SseEmitter.event()
                    .name("progress")
                    .data(objectMapper.writeValueAsString(dto)));
        } catch (IOException | IllegalStateException e) {
            // IOException: client disconnected; IllegalStateException: emitter already completed
            task.emitter = null;
        }
    }

    private void completeEmitter(DownloadTask task) {
        SseEmitter emitter = task.emitter;
        if (emitter != null) {
            try {
                emitter.complete();
            } catch (Exception ignored) {}
            task.emitter = null;
        }
    }

    @Scheduled(fixedRate = 300_000) // Every 5 minutes
    void cleanupStaleTasks() {
        Instant staleCutoff = Instant.now().minus(Duration.ofMinutes(15));
        tasks.entrySet().removeIf(entry -> {
            DownloadTask task = entry.getValue();
            boolean stale = task.createdAt.isBefore(staleCutoff);
            // Give 5 min after serving for the browser to finish streaming the file
            boolean servedAndOld = task.servedAt != null
                    && task.servedAt.isBefore(Instant.now().minus(Duration.ofMinutes(5)));
            if (stale || servedAndOld) {
                if (task.filePath != null) {
                    try {
                        Files.deleteIfExists(task.filePath);
                    } catch (IOException e) {
                        log.warn("Failed to delete task file: {}", task.filePath);
                    }
                }
                return true;
            }
            return false;
        });
    }

    static class DownloadTask {
        final String taskId;
        final Instant createdAt;
        final boolean isMergeFormat;
        volatile String status = "pending";
        volatile double percent = 0;
        volatile String speed = "";
        volatile String eta = "";
        volatile Path filePath;
        volatile String errorMessage;
        volatile int downloadPass = 0;
        volatile int destinationCount = 0;
        volatile String phase = "video";
        volatile SseEmitter emitter;
        volatile Instant servedAt;

        DownloadTask(String taskId, boolean isMergeFormat) {
            this.taskId = taskId;
            this.isMergeFormat = isMergeFormat;
            this.createdAt = Instant.now();
        }
    }
}
