package com.videograb.service;

import com.videograb.dto.VideoInfoResponseDto;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.nio.file.Path;

@Service
public class VideoService {

    private final YtDlpService ytDlpService;

    public VideoService(YtDlpService ytDlpService) {
        this.ytDlpService = ytDlpService;
    }

    @Cacheable(value = "videoInfo", key = "#url")
    public VideoInfoResponseDto getInfo(String url) {
        validateUrl(url);
        return ytDlpService.getVideoInfo(url);
    }

    public Path download(String url, String formatId) {
        validateUrl(url);
        if (formatId == null || formatId.isBlank()) {
            formatId = "best";
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
