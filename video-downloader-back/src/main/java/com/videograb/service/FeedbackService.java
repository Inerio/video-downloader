package com.videograb.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import com.videograb.config.FeedbackConfig;
import com.videograb.dto.FeedbackRequestDto;

@Service
public class FeedbackService {

    private static final Logger log = LoggerFactory.getLogger(FeedbackService.class);

    private final JavaMailSender mailSender;
    private final FeedbackConfig feedbackConfig;

    public FeedbackService(JavaMailSender mailSender, FeedbackConfig feedbackConfig) {
        this.mailSender = mailSender;
        this.feedbackConfig = feedbackConfig;
    }

    public void sendFeedback(FeedbackRequestDto request) {
        String typeLabel = switch (request.type()) {
            case "BUG" -> "Bug";
            case "LINK" -> "Lien ne fonctionne pas";
            case "SUGGESTION" -> "Suggestion";
            default -> request.type();
        };

        SimpleMailMessage mail = new SimpleMailMessage();
        mail.setTo(feedbackConfig.getRecipient());
        mail.setSubject("[VideoGrab] " + typeLabel + " — Feedback utilisateur");

        StringBuilder body = new StringBuilder();
        body.append("Type : ").append(typeLabel).append("\n\n");
        body.append("Message :\n").append(request.message()).append("\n");

        if (request.url() != null && !request.url().isBlank()) {
            body.append("\nURL concernée : ").append(request.url()).append("\n");
        }

        if (request.email() != null && !request.email().isBlank()) {
            body.append("\nEmail de retour : ").append(request.email()).append("\n");
        }

        mail.setText(body.toString());

        try {
            mailSender.send(mail);
            log.info("Feedback envoyé : type={}", request.type());
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi du feedback", e);
            throw new RuntimeException("Impossible d'envoyer le feedback. Réessayez plus tard.");
        }
    }
}
