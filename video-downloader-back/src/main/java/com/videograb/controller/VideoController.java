package com.videograb.controller;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.videograb.dto.VideoInfoRequestDto;
import com.videograb.dto.VideoInfoResponseDto;
import com.videograb.service.VideoService;
import com.videograb.util.ClientIpUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/video")
public class VideoController {

    private static final Pattern SAFE_FORMAT_ID = Pattern.compile("^[a-zA-Z0-9+\\-_]+$");
    private static final int MAX_URL_LENGTH = 2048;
    private static final int MAX_FILENAME_LENGTH = 200;
    private static final int MAX_REQUESTS_PER_MINUTE = 15;

    private final VideoService videoService;
    private final Cache<String, Integer> videoRateLimitCache = Caffeine.newBuilder()
            .maximumSize(10_000)
            .expireAfterWrite(1, TimeUnit.MINUTES)
            .build();

    public VideoController(VideoService videoService) {
        this.videoService = videoService;
    }

    @PostMapping("/info")
    public ResponseEntity<VideoInfoResponseDto> getVideoInfo(
            @Valid @RequestBody VideoInfoRequestDto request,
            HttpServletRequest httpRequest) {
        checkRateLimit(httpRequest);
        VideoInfoResponseDto info = videoService.getInfo(request.url());
        return ResponseEntity.ok(info);
    }

    @GetMapping("/download")
    public ResponseEntity<Resource> downloadVideo(
            @RequestParam String url,
            @RequestParam(defaultValue = "best") String formatId,
            @RequestParam(required = false) String filename,
            HttpServletRequest httpRequest) throws IOException {

        checkRateLimit(httpRequest);

        // Validate URL length
        if (url.length() > MAX_URL_LENGTH) {
            throw new IllegalArgumentException("URL trop longue");
        }

        // Validate formatId: allow safe yt-dlp IDs or direct https URLs (Twitter fallback)
        if (formatId.startsWith("https://")) {
            // Direct URL format (Twitter fallback) — validated downstream by domain whitelist
            try {
                new java.net.URI(formatId).toURL();
            } catch (Exception e) {
                throw new IllegalArgumentException("Format ID invalide: URL malformée");
            }
        } else if (!SAFE_FORMAT_ID.matcher(formatId).matches()) {
            throw new IllegalArgumentException("Format ID invalide");
        }

        Path filePath = videoService.download(url, formatId);
        Resource resource = new FileSystemResource(filePath);

        String extension = getExtension(filePath.getFileName().toString());
        String downloadName;
        if (filename != null && !filename.isBlank()) {
            String sanitized = sanitizeFilename(filename);
            downloadName = sanitized.isEmpty() ? filePath.getFileName().toString() : sanitized + "." + extension;
        } else {
            downloadName = filePath.getFileName().toString();
        }

        String contentType = Files.probeContentType(filePath);
        if (contentType == null) {
            contentType = "application/octet-stream";
        }

        // ASCII-safe fallback filename for Tomcat (replaces non-ASCII chars with _)
        String asciiName = downloadName.replaceAll("[^\\x20-\\x7E]", "_");
        // RFC 5987 encoded filename* for modern browsers (supports Unicode)
        String encodedName = URLEncoder.encode(downloadName, StandardCharsets.UTF_8).replace("+", "%20");

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + asciiName + "\"; filename*=UTF-8''" + encodedName)
                .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(Files.size(filePath)))
                .body(resource);
    }

    private String sanitizeFilename(String name) {
        // Strip control characters and dangerous Unicode (RTL override, etc.)
        String sanitized = name.replaceAll("[\\x00-\\x1F\\x7F\\u200E\\u200F\\u202A-\\u202E\\u2066-\\u2069]", "");
        // Strip dangerous filesystem characters
        sanitized = sanitized.replaceAll("[<>:\"/\\\\|?*]", "").trim();
        // Remove path traversal sequences
        sanitized = sanitized.replace("..", "");
        if (sanitized.length() > MAX_FILENAME_LENGTH) {
            sanitized = sanitized.substring(0, MAX_FILENAME_LENGTH).trim();
        }
        return sanitized;
    }

    private String getExtension(String filename) {
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot + 1) : "mp4";
    }

    private void checkRateLimit(HttpServletRequest request) {
        String ip = ClientIpUtils.resolve(request);
        int count = videoRateLimitCache.asMap().merge(ip, 1, Integer::sum);
        if (count > MAX_REQUESTS_PER_MINUTE) {
            throw new IllegalArgumentException("Trop de requêtes. Réessayez dans une minute.");
        }
    }
}
