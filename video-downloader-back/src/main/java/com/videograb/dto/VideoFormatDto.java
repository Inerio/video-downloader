package com.videograb.dto;

public record VideoFormatDto(
        String formatId,
        String quality,
        String extension,
        Long filesize,
        String resolution,
        boolean hasAudio,
        boolean hasVideo,
        String note
) {}
