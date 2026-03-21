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
import java.util.*;
import java.util.concurrent.CompletableFuture;
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

            // Read stdout and stderr concurrently to avoid pipe buffer deadlock
            CompletableFuture<String> stdoutFuture = CompletableFuture.supplyAsync(() -> {
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                    return reader.lines().collect(Collectors.joining("\n"));
                } catch (Exception e) {
                    return "";
                }
            });
            CompletableFuture<String> stderrFuture = CompletableFuture.supplyAsync(() -> {
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getErrorStream()))) {
                    return reader.lines().collect(Collectors.joining("\n"));
                } catch (Exception e) {
                    return "";
                }
            });

            boolean completed = process.waitFor(config.getTimeout(), TimeUnit.SECONDS);
            if (!completed) {
                process.destroyForcibly();
                throw new DownloadException("L'analyse a pris trop de temps. Réessayez.");
            }

            String output = stdoutFuture.get(config.getTimeout() + 10, TimeUnit.SECONDS);
            String errorOutput = stderrFuture.get(config.getTimeout() + 10, TimeUnit.SECONDS);

            if (process.exitValue() != 0) {
                log.warn("yt-dlp failed for URL {}: {}", url, errorOutput);
                throw mapYtDlpError(errorOutput, url);
            }

            JsonNode json = objectMapper.readTree(output);
            return parseVideoInfo(json, url);

        } catch (VideoNotFoundException | DownloadException e) {
            throw e;
        } catch (java.io.IOException e) {
            if (e.getMessage() != null && e.getMessage().contains("Cannot run program")) {
                throw new DownloadException("Service de téléchargement indisponible. Réessayez plus tard.");
            }
            throw new DownloadException("Impossible d'analyser cette vidéo. Vérifiez le lien et réessayez.", e);
        } catch (Exception e) {
            throw new DownloadException("Impossible d'analyser cette vidéo. Vérifiez le lien et réessayez.", e);
        }
    }

    public Path downloadVideo(String url, String formatId) {
        return downloadVideo(url, formatId, line -> log.debug("yt-dlp: {}", line));
    }

    public Path downloadVideo(String url, String formatId, java.util.function.Consumer<String> lineConsumer) {
        String filename = UUID.randomUUID().toString();
        Path tempDir = Path.of(config.getTempDir());

        try {
            // HD merge disabled — Cloudflare Tunnel TOS prohibits serving large video files.
            // The merge feature (bestvideo+bestaudio) produces HD files that transit through
            // Cloudflare's network, violating the CDN disproportionate-content policy.
            // To re-enable: uncomment the remapping and --merge-output-format/--newline flags.
            // if ("best".equals(formatId)) {
            //     formatId = "bestvideo+bestaudio/best";
            // }

            Files.createDirectories(tempDir);
            Path outputTemplate = tempDir.resolve(filename + ".%(ext)s");

            List<String> command = new ArrayList<>();
            command.add(config.getPath());
            command.add("-f");
            command.add(formatId);
            command.add("--max-filesize");
            command.add(config.getMaxFilesize());
            command.add("--no-playlist");
            // HD merge flags — disabled (see Cloudflare TOS note above)
            // command.add("--merge-output-format");
            // command.add("mp4");
            // command.add("--newline");

            command.add("-o");
            command.add(outputTemplate.toString());
            command.add(url);

            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectErrorStream(true);
            Process process = pb.start();

            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                reader.lines().forEach(lineConsumer);
            }

            boolean completed = process.waitFor(config.getTimeout(), TimeUnit.SECONDS);
            if (!completed) {
                process.destroyForcibly();
                cleanupPartialFiles(tempDir, filename);
                throw new DownloadException("Le téléchargement a pris trop de temps. Essayez une qualité inférieure.");
            }

            if (process.exitValue() != 0) {
                cleanupPartialFiles(tempDir, filename);
                throw new DownloadException("Le téléchargement a échoué. Réessayez ou choisissez un autre format.");
            }

            // Find the downloaded file (extension is determined by yt-dlp)
            try (var files = Files.list(tempDir)) {
                return files
                        .filter(f -> f.getFileName().toString().startsWith(filename))
                        .filter(f -> !f.getFileName().toString().endsWith(".part"))
                        .findFirst()
                        .orElseThrow(() -> new DownloadException("Le fichier n'a pas pu être récupéré. Réessayez."));
            }

        } catch (DownloadException e) {
            throw e;
        } catch (java.io.IOException e) {
            cleanupPartialFiles(tempDir, filename);
            if (e.getMessage() != null && e.getMessage().contains("Cannot run program")) {
                throw new DownloadException("Service de téléchargement indisponible. Réessayez plus tard.");
            }
            throw new DownloadException("Le téléchargement a échoué. Réessayez ou choisissez un autre format.", e);
        } catch (Exception e) {
            cleanupPartialFiles(tempDir, filename);
            throw new DownloadException("Le téléchargement a échoué. Réessayez ou choisissez un autre format.", e);
        }
    }

    /**
     * Clean up partial/temp files left by yt-dlp on failure (including .part files).
     */
    private void cleanupPartialFiles(Path tempDir, String filenamePrefix) {
        try {
            if (!Files.isDirectory(tempDir)) return;
            try (var files = Files.list(tempDir)) {
                files.filter(f -> f.getFileName().toString().startsWith(filenamePrefix))
                     .forEach(f -> {
                         try { Files.deleteIfExists(f); }
                         catch (java.io.IOException ignored) {}
                     });
            }
        } catch (java.io.IOException e) {
            log.warn("Failed to clean up partial files for {}: {}", filenamePrefix, e.getMessage());
        }
    }

    private RuntimeException mapYtDlpError(String errorOutput, String url) {
        String err = errorOutput.toLowerCase();
        String platform = platformDetector.detect(url);
        boolean isInstagram = "instagram".equals(platform);

        // --- Instagram-specific errors ---
        if (isInstagram) {
            if (err.contains("login required") || err.contains("sign in") || err.contains("requires authentication")
                    || err.contains("private video") || err.contains("members only")) {
                return new VideoNotFoundException(
                        "Ce contenu Instagram est privé ou restreint. Seuls les contenus publics sont accessibles.");
            }
            if (err.contains("http error 404") || err.contains("not found")
                    || err.contains("has been removed") || err.contains("deleted")) {
                return new VideoNotFoundException(
                        "Ce contenu Instagram n'existe pas ou a été supprimé.");
            }
            if (err.contains("http error 403") || err.contains("blocked") || err.contains("forbidden")
                    || err.contains("access denied")) {
                return new VideoNotFoundException(
                        "Ce contenu Instagram est inaccessible (contenu signalé, restreint ou réservé aux abonnés).");
            }
        }

        // --- Generic: Video not available / removed / deleted ---
        if (err.contains("video unavailable") || err.contains("has been removed") || err.contains("deleted")) {
            return new VideoNotFoundException("Cette vidéo n'est plus disponible ou a été supprimée.");
        }

        // "not available" can mean many things — check geo before generic
        if (err.contains("not available in your country") || err.contains("is not available in your region")
                || err.contains("geo-restricted") || err.contains("geo restricted")) {
            return new DownloadException("Cette vidéo est bloquée dans notre région. Essayez un autre lien.");
        }

        if (err.contains("not available")) {
            return new VideoNotFoundException("Cette vidéo n'est pas disponible.");
        }

        // --- Private / login required ---
        if (err.contains("private video") || err.contains("sign in") || err.contains("login required")
                || err.contains("members only") || err.contains("requires authentication")) {
            return new VideoNotFoundException("Cette vidéo est privée ou nécessite une connexion.");
        }

        // --- No video found (e.g. tweet without media) ---
        if (err.contains("no video could be found") || err.contains("does not contain")) {
            return new VideoNotFoundException("Aucune vidéo trouvée dans ce lien.");
        }

        // --- HTTP 404 ---
        if (err.contains("http error 404") || err.contains("not found")) {
            return new VideoNotFoundException("Ce contenu n'existe pas ou a été supprimé.");
        }

        // --- HTTP 403 / Blocked ---
        if (err.contains("http error 403") || err.contains("blocked") || err.contains("access denied")
                || err.contains("forbidden")) {
            return new DownloadException("L'accès est bloqué par la plateforme. Le contenu est peut-être restreint.");
        }

        // --- Rate limited ---
        if (err.contains("http error 429") || err.contains("too many requests") || err.contains("rate limit")) {
            return new DownloadException("Trop de requêtes vers cette plateforme. Réessayez dans quelques minutes.");
        }

        // --- Unsupported URL ---
        if (err.contains("unsupported url") || err.contains("no suitable")) {
            return new DownloadException("Cette URL n'est pas supportée. Vérifiez le lien et réessayez.");
        }

        // --- Extractor issue ---
        if (err.contains("unable to extract") || err.contains("please report")) {
            return new DownloadException("Extraction temporairement impossible. La plateforme a peut-être changé son format.");
        }

        // --- Network / timeout ---
        if (err.contains("timed out") || err.contains("connection refused") || err.contains("network")) {
            return new DownloadException("Erreur réseau lors de la connexion à la plateforme. Réessayez.");
        }

        // --- Default ---
        return new DownloadException("Impossible de traiter cette vidéo. Vérifiez le lien et réessayez.");
    }

    private VideoInfoResponseDto parseVideoInfo(JsonNode json, String url) {
        String title = getTextOrDefault(json, "title", "Sans titre");
        String thumbnail = getTextOrDefault(json, "thumbnail", null);
        String uploader = getTextOrDefault(json, "uploader", null);
        String platform = platformDetector.detect(url);

        // Format duration
        double durationSec = json.has("duration") ? json.get("duration").asDouble(0) : 0;
        String duration = formatDuration((long) durationSec);

        // Parse raw formats from yt-dlp
        List<VideoFormatDto> rawFormats = new ArrayList<>();
        Set<Integer> videoHeights = new LinkedHashSet<>();
        Map<Integer, Long> videoSizeByHeight = new HashMap<>();
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
                int height = fmt.has("height") && !fmt.get("height").isNull() ? fmt.get("height").asInt(0) : 0;

                if (!hasVideo && !hasAudio) continue;

                rawFormats.add(new VideoFormatDto(formatId, quality, ext, filesize, resolution, hasAudio, hasVideo, note));

                // Track video-only heights for merged format generation
                if (hasVideo && !hasAudio && height > 0) {
                    videoHeights.add(height);
                }
                // Track total sizes per height for estimates
                if (hasVideo && height > 0 && filesize != null) {
                    videoSizeByHeight.merge(height, filesize, Math::max);
                }
            }
        }

        // Detect content type
        String contentType = detectContentType(json, platform, url, rawFormats, durationSec);

        // Build the final format list
        List<VideoFormatDto> formats = new ArrayList<>();

        // 1. "best" meta-format (always first) — yt-dlp picks best natively combined format
        boolean bestHasAudio = !"gif".equals(contentType);
        formats.add(new VideoFormatDto("best", "Meilleure qualité", "mp4", null, null, bestHasAudio, true, "best"));

        // HD merge disabled — Cloudflare Tunnel TOS prohibits serving large merged video files.
        // To re-enable merged HD formats, uncomment the block below:
        // if (!videoHeights.isEmpty()) {
        //     List<Integer> sortedHeights = new ArrayList<>(videoHeights);
        //     sortedHeights.sort(Collections.reverseOrder());
        //     Long bestAudioSize = rawFormats.stream()
        //             .filter(f -> f.hasAudio() && !f.hasVideo())
        //             .map(VideoFormatDto::filesize).filter(Objects::nonNull)
        //             .max(Long::compareTo).orElse(null);
        //     for (int h : sortedHeights) {
        //         String label = h + "p";
        //         String mergedFormatId = "bestvideo[height<=" + h + "]+bestaudio/best";
        //         String res = (h * 16 / 9) + "x" + h;
        //         Long estimatedSize = null;
        //         Long videoSize = videoSizeByHeight.get(h);
        //         if (videoSize != null && bestAudioSize != null) estimatedSize = videoSize + bestAudioSize;
        //         else if (videoSize != null) estimatedSize = videoSize;
        //         formats.add(new VideoFormatDto(mergedFormatId, label, "mp4", estimatedSize, res, true, true, label + " Video + Audio"));
        //     }
        // }

        // 2. Add natively combined formats (video + audio in one stream, e.g. TikTok, Twitter)
        rawFormats.stream()
                .filter(f -> f.hasAudio() && f.hasVideo())
                .forEach(formats::add);

        // 3. Add audio-only formats
        rawFormats.stream()
                .filter(f -> f.hasAudio() && !f.hasVideo())
                .forEach(formats::add);

        return new VideoInfoResponseDto(title, thumbnail, duration, platform, uploader, contentType, formats);
    }

    private String detectContentType(JsonNode json, String platform, String url,
                                      List<VideoFormatDto> formats, double durationSec) {
        String extractorKey = json.path("extractor_key").asText("");
        String webpageUrl = json.path("webpage_url").asText(url);

        // GIF: Twitter/Reddit + short duration + no audio in any format
        if (("twitter".equals(platform) || "reddit".equals(platform)) && durationSec <= 60) {
            boolean anyAudio = formats.stream().anyMatch(VideoFormatDto::hasAudio);
            if (!anyAudio) {
                return "gif";
            }
        }

        // Short: YouTube Shorts or TikTok
        if ("youtube".equals(platform) && webpageUrl.contains("/shorts/")) {
            return "short";
        }
        if ("tiktok".equals(platform)) {
            return "short";
        }

        // Clip: Twitch clips
        if ("twitch".equals(platform) && extractorKey.toLowerCase().contains("clip")) {
            return "clip";
        }

        // Audio: all formats are audio-only
        if (!formats.isEmpty()) {
            boolean allAudioOnly = formats.stream().allMatch(f -> f.hasAudio() && !f.hasVideo());
            if (allAudioOnly) {
                return "audio";
            }
        }

        return "video";
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
