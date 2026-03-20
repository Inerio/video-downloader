package com.videograb.dto;

public record DownloadProgressDto(
        String status,
        double percent,
        String speed,
        String eta,
        String error,
        int downloadPass,
        String phase,
        boolean isMergeFormat
) {}
