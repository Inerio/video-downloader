package com.videograb.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.videograb.dto.FeedbackRequestDto;
import com.videograb.service.FeedbackService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    private final FeedbackService feedbackService;

    public FeedbackController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> sendFeedback(
            @Valid @RequestBody FeedbackRequestDto request,
            HttpServletRequest httpRequest) {
        String clientIp = resolveClientIp(httpRequest);
        feedbackService.sendFeedback(request, clientIp);
        return ResponseEntity.ok(Map.of("message", "Merci pour votre retour !"));
    }

    /**
     * Resolve real client IP behind Cloudflare / Nginx reverse proxy.
     * Priority: CF-Connecting-IP > X-Forwarded-For (first IP) > remoteAddr
     */
    private String resolveClientIp(HttpServletRequest request) {
        String cfIp = request.getHeader("CF-Connecting-IP");
        if (cfIp != null && !cfIp.isBlank()) {
            return cfIp.trim();
        }
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
