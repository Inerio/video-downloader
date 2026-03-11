package com.videograb.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.videograb.config.YtDlpConfig;
import com.videograb.dto.VideoFormatDto;
import com.videograb.dto.VideoInfoResponseDto;
import com.videograb.exception.DownloadException;
import com.videograb.exception.VideoNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
public class YtDlpService {

    private static final Logger log = LoggerFactory.getLogger(YtDlpService.class);

    private final YtDlpConfig config;
    private final PlatformDetectorService platformDetector;
    private final ObjectMapper objectMapper;

    public YtDlpService(YtDlpConfig config, PlatformDetectorService platformDetector, ObjectMapper objectMapper) {
        this.config = config;
        this.platformDetector = platformDetector;
        this.objectMapper = objectMapper;
    }

    public VideoInfoResponseDto getVideoInfo(String url) {
        try {
            List<String> command = List.of(
                    config.getPath(),
                    "--dump-json",
                    "--no-download",
                    "--no-warnings",
                    url
            );

            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectErrorStream(false);
            Process process = pb.start();

            String output;
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                output = reader.lines().collect(Collectors.joining("\n"));
            }

            String errorOutput;
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getErrorStream()))) {
                errorOutput = reader.lines().collect(Collectors.joining("\n"));
            }

            boolean completed = process.waitFor(config.getTimeout(), TimeUnit.SECONDS);
            if (!completed) {
                process.destroyForcibly();
                throw new DownloadException("Le délai d'attente a été dépassé");
            }

            if (process.exitValue() != 0) {
                log.error("yt-dlp error: {}", errorOutput);
                if (errorOutput.contains("Video unavailable") || errorOutput.contains("not available")) {
                    throw new VideoNotFoundException("Vidéo introuvable ou indisponible");
                }
                if (errorOutput.contains("Private video") || errorOutput.contains("Sign in")) {
                    throw new VideoNotFoundException("Cette vidéo est privée ou nécessite une connexion");
                }
                throw new DownloadException("Impossible d'extraire les informations de la vidéo");
            }

            JsonNode json = objectMapper.readTree(output);
            return parseVideoInfo(json, url);

        } catch (VideoNotFoundException | DownloadException e) {
            throw e;
        } catch (java.io.IOException e) {
            if (e.getMessage() != null && e.getMessage().contains("Cannot run program")) {
                throw new DownloadException("yt-dlp n'est pas installé ou introuvable. Installez-le avec : pip install yt-dlp");
            }
            throw new DownloadException("Erreur lors de l'extraction des informations", e);
        } catch (Exception e) {
            throw new DownloadException("Erreur lors de l'extraction des informations", e);
        }
    }

    public Path downloadVideo(String url, String formatId) {
        try {
            String filename = UUID.randomUUID().toString();
            Path tempDir = Path.of(config.getTempDir());
            Files.createDirectories(tempDir);
            Path outputTemplate = tempDir.resolve(filename + ".%(ext)s");

            List<String> command = new ArrayList<>();
            command.add(config.getPath());
            command.add("-f");
            command.add(formatId);
            command.add("--max-filesize");
            command.add(config.getMaxFilesize());
            command.add("--no-playlist");
            command.add("-o");
            command.add(outputTemplate.toString());
            command.add(url);

            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectErrorStream(true);
            Process process = pb.start();

            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                reader.lines().forEach(line -> log.debug("yt-dlp: {}", line));
            }

            boolean completed = process.waitFor(config.getTimeout(), TimeUnit.SECONDS);
            if (!completed) {
                process.destroyForcibly();
                throw new DownloadException("Le téléchargement a pris trop de temps");
            }

            if (process.exitValue() != 0) {
                throw new DownloadException("Erreur lors du téléchargement de la vidéo");
            }

            // Find the downloaded file (extension is determined by yt-dlp)
            try (var files = Files.list(tempDir)) {
                return files
                        .filter(f -> f.getFileName().toString().startsWith(filename))
                        .findFirst()
                        .orElseThrow(() -> new DownloadException("Fichier téléchargé introuvable"));
            }

        } catch (DownloadException e) {
            throw e;
        } catch (java.io.IOException e) {
            if (e.getMessage() != null && e.getMessage().contains("Cannot run program")) {
                throw new DownloadException("yt-dlp n'est pas installé ou introuvable. Installez-le avec : pip install yt-dlp");
            }
            throw new DownloadException("Erreur lors du téléchargement", e);
        } catch (Exception e) {
            throw new DownloadException("Erreur lors du téléchargement", e);
        }
    }

    private VideoInfoResponseDto parseVideoInfo(JsonNode json, String url) {
        String title = getTextOrDefault(json, "title", "Sans titre");
        String thumbnail = getTextOrDefault(json, "thumbnail", null);
        String uploader = getTextOrDefault(json, "uploader", null);
        String platform = platformDetector.detect(url);

        // Format duration
        double durationSec = json.has("duration") ? json.get("duration").asDouble(0) : 0;
        String duration = formatDuration((long) durationSec);

        // Parse formats
        List<VideoFormatDto> formats = new ArrayList<>();
        JsonNode formatsNode = json.get("formats");
        if (formatsNode != null && formatsNode.isArray()) {
            for (JsonNode fmt : formatsNode) {
                String formatId = getTextOrDefault(fmt, "format_id", null);
                if (formatId == null) continue;

                String ext = getTextOrDefault(fmt, "ext", "mp4");
                String resolution = getTextOrDefault(fmt, "resolution", null);
                String quality = getTextOrDefault(fmt, "format_note", resolution);
                Long filesize = fmt.has("filesize") && !fmt.get("filesize").isNull()
                        ? fmt.get("filesize").asLong() : null;
                if (filesize == null && fmt.has("filesize_approx") && !fmt.get("filesize_approx").isNull()) {
                    filesize = fmt.get("filesize_approx").asLong();
                }

                boolean hasVideo = fmt.has("vcodec") && !fmt.get("vcodec").asText().equals("none");
                boolean hasAudio = fmt.has("acodec") && !fmt.get("acodec").asText().equals("none");
                String note = getTextOrDefault(fmt, "format", "");

                // Skip formats without video and audio (manifests, storyboards, etc.)
                if (!hasVideo && !hasAudio) continue;

                formats.add(new VideoFormatDto(formatId, quality, ext, filesize, resolution, hasAudio, hasVideo, note));
            }
        }

        // Add a "best" meta-format
        formats.addFirst(new VideoFormatDto("best", "Meilleure qualité", "mp4", null, null, true, true, "best"));

        return new VideoInfoResponseDto(title, thumbnail, duration, platform, uploader, formats);
    }

    private String getTextOrDefault(JsonNode node, String field, String defaultValue) {
        return node.has(field) && !node.get(field).isNull() ? node.get(field).asText() : defaultValue;
    }

    private String formatDuration(long totalSeconds) {
        if (totalSeconds <= 0) return "0:00";
        long hours = totalSeconds / 3600;
        long minutes = (totalSeconds % 3600) / 60;
        long seconds = totalSeconds % 60;
        if (hours > 0) {
            return String.format("%d:%02d:%02d", hours, minutes, seconds);
        }
        return String.format("%d:%02d", minutes, seconds);
    }
}
