package com.videograb.service;

import com.videograb.config.YtDlpConfig;
import com.videograb.dto.VideoInfoResponseDto;
import com.videograb.exception.VideoNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

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
            // Fallback pour Twitter : essayer via l'API FixTweet
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

        // Si le formatId est une URL directe (média récupéré via fallback)
        if (formatId.startsWith("http")) {
            return twitterFallback.downloadDirect(formatId, config.getTempDir());
        }

        return ytDlpService.downloadVideo(url, formatId);
    }

    private void validateUrl(String url) {
        if (url == null || url.isBlank()) {
            throw new IllegalArgumentException("L'URL ne peut pas être vide");
        }
        try {
            URI uri = URI.create(url);
            if (uri.getScheme() == null || !uri.getScheme().startsWith("http")) {
                throw new IllegalArgumentException("L'URL doit commencer par http:// ou https://");
            }
            if (uri.getHost() == null) {
                throw new IllegalArgumentException("URL invalide");
            }
        } catch (IllegalArgumentException e) {
            if (e.getMessage().startsWith("L'URL") || e.getMessage().equals("URL invalide")) {
                throw e;
            }
            throw new IllegalArgumentException("URL invalide : " + url);
        }
    }
}
