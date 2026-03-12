package com.videograb.service;

import com.videograb.config.YtDlpConfig;
import com.videograb.dto.VideoInfoResponseDto;
import com.videograb.exception.VideoNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.net.InetAddress;
import java.net.URI;
import java.nio.file.Path;

@Service
public class VideoService {

    private static final Logger log = LoggerFactory.getLogger(VideoService.class);

    private final YtDlpService ytDlpService;
    private final TwitterFallbackService twitterFallback;
    private final PlatformDetectorService platformDetector;
    private final YtDlpConfig config;

    public VideoService(YtDlpService ytDlpService, TwitterFallbackService twitterFallback,
                        PlatformDetectorService platformDetector, YtDlpConfig config) {
        this.ytDlpService = ytDlpService;
        this.twitterFallback = twitterFallback;
        this.platformDetector = platformDetector;
        this.config = config;
    }

    @Cacheable(value = "videoInfo", key = "#url")
    public VideoInfoResponseDto getInfo(String url) {
        validateUrl(url);
        try {
            return ytDlpService.getVideoInfo(url);
        } catch (VideoNotFoundException e) {
            // Twitter fallback: try FixTweet API when yt-dlp fails
            String platform = platformDetector.detect(url);
            if ("twitter".equals(platform)) {
                log.info("yt-dlp failed for Twitter URL, trying FixTweet fallback: {}", url);
                try {
                    return twitterFallback.getVideoInfo(url);
                } catch (Exception fallbackEx) {
                    log.warn("Twitter fallback also failed: {}", fallbackEx.getMessage());
                }
            }
            throw e;
        }
    }

    public Path download(String url, String formatId) {
        validateUrl(url);
        if (formatId == null || formatId.isBlank()) {
            formatId = "best";
        }

        // If formatId is a direct URL (media retrieved via Twitter fallback)
        if (formatId.startsWith("http")) {
            return twitterFallback.downloadDirect(formatId, config.getTempDir());
        }

        return ytDlpService.downloadVideo(url, formatId);
    }

    private void validateUrl(String url) {
        if (url == null || url.isBlank()) {
            throw new IllegalArgumentException("L'URL ne peut pas être vide");
        }
        // Block control characters (log injection prevention)
        if (url.chars().anyMatch(c -> c < 0x20 && c != 0x09)) {
            throw new IllegalArgumentException("URL contient des caractères invalides");
        }
        try {
            URI uri = URI.create(url);
            String scheme = uri.getScheme();
            if (scheme == null || (!scheme.equals("http") && !scheme.equals("https"))) {
                throw new IllegalArgumentException("L'URL doit commencer par http:// ou https://");
            }
            String host = uri.getHost();
            if (host == null) {
                throw new IllegalArgumentException("URL invalide");
            }
            // Block private/loopback IPs (SSRF prevention)
            InetAddress addr = InetAddress.getByName(host);
            if (addr.isLoopbackAddress() || addr.isSiteLocalAddress() || addr.isLinkLocalAddress()) {
                throw new IllegalArgumentException("URL vers une adresse privée non autorisée");
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("URL invalide : " + url);
        }
    }
}
