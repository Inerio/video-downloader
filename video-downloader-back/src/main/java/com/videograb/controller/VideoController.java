package com.videograb.controller;

import com.videograb.dto.VideoInfoRequestDto;
import com.videograb.dto.VideoInfoResponseDto;
import com.videograb.service.VideoService;
import jakarta.validation.Valid;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@RestController
@RequestMapping("/api/video")
public class VideoController {

    private final VideoService videoService;

    public VideoController(VideoService videoService) {
        this.videoService = videoService;
    }

    @PostMapping("/info")
    public ResponseEntity<VideoInfoResponseDto> getVideoInfo(@Valid @RequestBody VideoInfoRequestDto request) {
        VideoInfoResponseDto info = videoService.getInfo(request.url());
        return ResponseEntity.ok(info);
    }

    @GetMapping("/download")
    public ResponseEntity<Resource> downloadVideo(
            @RequestParam String url,
            @RequestParam(defaultValue = "best") String formatId,
            @RequestParam(required = false) String filename) throws IOException {

        Path filePath = videoService.download(url, formatId);
        Resource resource = new FileSystemResource(filePath);

        // Use custom filename if provided, otherwise use the actual file name
        String extension = getExtension(filePath.getFileName().toString());
        String downloadName;
        if (filename != null && !filename.isBlank()) {
            // Sanitize and append original extension
            String sanitized = filename.replaceAll("[<>:\"/\\\\|?*]", "").trim();
            downloadName = sanitized + "." + extension;
        } else {
            downloadName = filePath.getFileName().toString();
        }

        String contentType = Files.probeContentType(filePath);
        if (contentType == null) {
            contentType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + downloadName + "\"")
                .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(Files.size(filePath)))
                .body(resource);
    }

    private String getExtension(String filename) {
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot + 1) : "mp4";
    }
}
