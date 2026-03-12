package com.videograb.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record FeedbackRequestDto(
        @NotBlank(message = "Le type de retour est obligatoire")
        @Pattern(regexp = "BUG|LINK|SUGGESTION", message = "Type invalide")
        String type,

        @NotBlank(message = "Le message est obligatoire")
        @Size(min = 10, max = 2000, message = "Le message doit contenir entre 10 et 2000 caractères")
        String message,

        @Size(max = 2048, message = "URL trop longue")
        String url,

        @Email(message = "Email invalide")
        @Size(max = 320, message = "Email trop long")
        String email
) {
}
