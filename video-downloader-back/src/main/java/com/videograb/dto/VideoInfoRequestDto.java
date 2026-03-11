package com.videograb.dto;

import jakarta.validation.constraints.NotBlank;

public record VideoInfoRequestDto(
        @NotBlank(message = "L'URL est obligatoire")
        String url
) {}
