package com.videograb.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.videograb.dto.VideoFormatDto;
import com.videograb.dto.VideoInfoResponseDto;
import com.videograb.exception.DownloadException;
import com.videograb.exception.VideoNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.InetAddress;
import java.net.URI;
import java.net.UnknownHostException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class TwitterFallbackService {

    private static final Logger log = LoggerFactory.getLogger(TwitterFallbackService.class);
    private static final Pattern TWEET_ID_PATTERN = Pattern.compile("/status/(\\d+)");
    private static final String FXTWITTER_API = "https://api.fxtwitter.com/i/status/";
    private static final long MAX_DOWNLOAD_SIZE = 500L * 1024 * 1024; // 500MB
    private static final Set<String> ALLOWED_MEDIA_HOSTS = Set.of(
            "video.twimg.com", "pbs.twimg.com", "ton.twimg.com", "abs.twimg.com"
    );

    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    public TwitterFallbackService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10_000);
        factory.setReadTimeout(30_000);
        this.restTemplate = new RestTemplate(factory);
    }

    /**
     * Retrieve media info from a tweet via the FixTweet API.
     * Used as fallback when yt-dlp finds no video in the tweet.
     */
    public VideoInfoResponseDto getVideoInfo(String url) {
        String tweetId = extractTweetId(url);
        if (tweetId == null) {
            throw new VideoNotFoundException("Impossible d'extraire l'ID du tweet");
        }

        try {
            String apiUrl = FXTWITTER_API + tweetId;
            log.info("Twitter fallback: calling FixTweet API for tweet {}", tweetId);

            String response = restTemplate.getForObject(apiUrl, String.class);
            if (response == null) {
                throw new VideoNotFoundException("Réponse vide de l'API FixTweet");
            }

            JsonNode root = objectMapper.readTree(response);
            JsonNode tweet = root.path("tweet");
            if (tweet.isMissingNode()) {
                throw new VideoNotFoundException("Tweet introuvable");
            }

            return parseTweetMedia(tweet);

        } catch (VideoNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Twitter fallback failed for tweet {}: {}", tweetId, e.getMessage());
            throw new VideoNotFoundException("Aucun média trouvé dans ce tweet");
        }
    }

    /**
     * Download a file directly from a URL using streaming (no full byte[] in memory).
     */
    public Path downloadDirect(String mediaUrl, String tempDir) {
        validateMediaUrl(mediaUrl);
        try {
            String extension = detectExtension(mediaUrl);
            Path dir = Path.of(tempDir);
            Files.createDirectories(dir);
            Path outputFile = dir.resolve(UUID.randomUUID() + "." + extension);

            HttpURLConnection conn = (HttpURLConnection) URI.create(mediaUrl).toURL().openConnection();
            conn.setConnectTimeout(10_000);
            conn.setReadTimeout(60_000);
            conn.setRequestProperty("User-Agent", "DownloadIt/1.0");

            try {
                long contentLength = conn.getContentLengthLong();
                if (contentLength > MAX_DOWNLOAD_SIZE) {
                    throw new DownloadException("Fichier trop volumineux (" + (contentLength / 1024 / 1024) + " MB)");
                }

                try (InputStream in = conn.getInputStream();
                     OutputStream out = Files.newOutputStream(outputFile)) {
                    byte[] buffer = new byte[8192];
                    long totalRead = 0;
                    int bytesRead;
                    while ((bytesRead = in.read(buffer)) != -1) {
                        totalRead += bytesRead;
                        if (totalRead > MAX_DOWNLOAD_SIZE) {
                            Files.deleteIfExists(outputFile);
                            throw new DownloadException("Fichier trop volumineux");
                        }
                        out.write(buffer, 0, bytesRead);
                    }
                }

                log.info("Twitter fallback: streamed {} bytes to {}", Files.size(outputFile), outputFile);
                return outputFile;
            } finally {
                conn.disconnect();
            }

        } catch (DownloadException e) {
            throw e;
        } catch (Exception e) {
            log.error("Direct download failed", e);
            throw new DownloadException("Erreur lors du téléchargement direct", e);
        }
    }

    private VideoInfoResponseDto parseTweetMedia(JsonNode tweet) {
        String author = tweet.path("author").path("name").asText(null);
        String title = buildTitle(tweet, author);

        JsonNode media = tweet.path("media");
        if (media.isMissingNode()) {
            throw new VideoNotFoundException("Aucun média dans ce tweet");
        }

        List<VideoFormatDto> formats = new ArrayList<>();
        String contentType = "video";
        String thumbnail = null;

        JsonNode videos = media.path("videos");
        if (videos.isArray() && !videos.isEmpty()) {
            JsonNode video = videos.get(0);
            String type = video.path("type").asText("video");
            String videoUrl = video.path("url").asText(null);
            thumbnail = video.path("thumbnail_url").asText(null);
            int width = video.path("width").asInt(0);
            int height = video.path("height").asInt(0);

            if ("gif".equals(type)) {
                contentType = "gif";
            }

            String resolution = width > 0 && height > 0 ? width + "x" + height : null;
            String quality = "gif".equals(contentType) ? "GIF" : "Meilleure qualité";

            if (videoUrl != null) {
                formats.add(new VideoFormatDto(
                        videoUrl, quality, "mp4", null, resolution,
                        !"gif".equals(contentType), true, type
                ));
            }
        }

        if (formats.isEmpty()) {
            JsonNode photos = media.path("photos");
            if (photos.isArray() && !photos.isEmpty()) {
                throw new VideoNotFoundException("Ce tweet contient des images, pas de vidéo ou GIF téléchargeable");
            }
            throw new VideoNotFoundException("Aucun média vidéo ou GIF trouvé dans ce tweet");
        }

        String duration = "gif".equals(contentType) ? "GIF" : "0:00";
        return new VideoInfoResponseDto(title, thumbnail, duration, "twitter", author, contentType, formats);
    }

    private String buildTitle(JsonNode tweet, String author) {
        String tweetText = tweet.path("text").asText("").trim();
        tweetText = tweetText.replaceAll("https?://\\S+", "").trim();
        tweetText = tweetText.replaceAll("[<>:\"/\\\\|?*#]", "").trim();

        if (!tweetText.isEmpty()) {
            if (tweetText.length() > 80) {
                tweetText = tweetText.substring(0, 80).trim();
            }
            return author != null ? author + " - " + tweetText : tweetText;
        }
        return author != null ? author + " - Twitter GIF" : "Twitter GIF";
    }

    private void validateMediaUrl(String mediaUrl) {
        try {
            URI uri = URI.create(mediaUrl);
            String host = uri.getHost();
            if (host == null || !ALLOWED_MEDIA_HOSTS.contains(host.toLowerCase())) {
                throw new DownloadException("Domaine non autorisé pour le téléchargement direct: " + host);
            }
            String scheme = uri.getScheme();
            if (scheme == null || !scheme.equals("https")) {
                throw new DownloadException("Seul HTTPS est autorisé pour le téléchargement direct");
            }
            InetAddress addr = InetAddress.getByName(host);
            if (addr.isLoopbackAddress() || addr.isSiteLocalAddress() || addr.isLinkLocalAddress()) {
                throw new DownloadException("Adresse IP non autorisée");
            }
        } catch (DownloadException e) {
            throw e;
        } catch (UnknownHostException e) {
            throw new DownloadException("Impossible de résoudre le domaine", e);
        } catch (Exception e) {
            throw new DownloadException("URL de média invalide: " + mediaUrl, e);
        }
    }

    private String detectExtension(String url) {
        if (url.contains(".gif")) return "gif";
        if (url.contains(".webm")) return "webm";
        return "mp4";
    }

    private String extractTweetId(String url) {
        Matcher matcher = TWEET_ID_PATTERN.matcher(url);
        return matcher.find() ? matcher.group(1) : null;
    }
}
