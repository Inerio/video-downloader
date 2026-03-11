package com.videograb.dto;

import java.util.List;

public record VideoInfoResponseDto(
        String title,
        String thumbnail,
        String duration,
        String platform,
        String uploader,
        List<VideoFormatDto> formats
) {}
