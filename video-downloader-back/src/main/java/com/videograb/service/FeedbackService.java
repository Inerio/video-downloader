package com.videograb.service;

import com.github.benmanes.caffeine.cache.Cache;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import com.videograb.config.FeedbackConfig;
import com.videograb.dto.FeedbackRequestDto;

@Service
public class FeedbackService {

    private static final Logger log = LoggerFactory.getLogger(FeedbackService.class);
    private static final int MAX_FEEDBACKS_PER_HOUR = 3;

    private final JavaMailSender mailSender;
    private final FeedbackConfig feedbackConfig;
    private final Cache<String, Integer> feedbackRateLimitCache;

    public FeedbackService(JavaMailSender mailSender, FeedbackConfig feedbackConfig,
                           Cache<String, Integer> feedbackRateLimitCache) {
        this.mailSender = mailSender;
        this.feedbackConfig = feedbackConfig;
        this.feedbackRateLimitCache = feedbackRateLimitCache;
    }

    public void sendFeedback(FeedbackRequestDto request, String clientIp) {
        // Check that the recipient email is configured
        String recipient = feedbackConfig.getRecipient();
        if (recipient == null || recipient.isBlank()) {
            log.warn("Feedback recipient not configured (FEEDBACK_EMAIL env variable missing)");
            throw new RuntimeException("Le système de feedback n'est pas configuré. Réessayez plus tard.");
        }

        // Rate limiting by IP address (atomic increment)
        int count = feedbackRateLimitCache.asMap().merge(clientIp, 1, Integer::sum);
        if (count > MAX_FEEDBACKS_PER_HOUR) {
            log.warn("Rate limit exceeded for IP: {}", clientIp);
            throw new RuntimeException("Trop de feedbacks envoyés. Réessayez dans une heure.");
        }

        String typeLabel = switch (request.type()) {
            case "BUG" -> "Bug";
            case "LINK" -> "Lien ne fonctionne pas";
            case "SUGGESTION" -> "Suggestion";
            default -> request.type();
        };

        StringBuilder body = new StringBuilder();
        body.append("Type : ").append(typeLabel).append("\n\n");
        body.append("Message :\n").append(request.message()).append("\n");

        if (request.url() != null && !request.url().isBlank()) {
            body.append("\nURL concernée : ").append(request.url()).append("\n");
        }

        if (request.email() != null && !request.email().isBlank()) {
            body.append("\nEmail de retour : ").append(request.email()).append("\n");
        }

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, false, "UTF-8");
            helper.setTo(recipient);
            helper.setSubject("[Download it] " + typeLabel + " — Feedback utilisateur");
            helper.setText(body.toString());
            mailSender.send(mimeMessage);
            log.info("Feedback envoyé : type={}", request.type());
        } catch (MessagingException e) {
            log.error("Erreur lors de l'envoi du feedback", e);
            throw new RuntimeException("Impossible d'envoyer le feedback. Réessayez plus tard.");
        }
    }
}
