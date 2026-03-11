# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VideoGrab — a web app to download videos from any platform (YouTube, TikTok, Instagram, Twitter/X, Facebook, Reddit, Vimeo, etc.) using yt-dlp as the extraction engine. Angular 19 frontend + Spring Boot 3.5.11 / Java 21 backend.

## Commands

### Backend (`video-downloader-back/`)
```bash
cd video-downloader-back
mvn clean install          # Build
mvn spring-boot:run        # Run on port 8080
```

### Frontend (`video-downloader-front/`)
```bash
cd video-downloader-front
npm start                  # Dev server on port 4200 (proxies /api to :8080)
npm run build              # Production build
npm test                   # Run tests (Karma/Jasmine)
```

### Prerequisites
- Java 21, Maven
- Node.js 18+, Angular CLI
- `yt-dlp` and `ffmpeg` must be installed and available in PATH

## Architecture

```
Frontend (Angular 19, port 4200)
  └── POST /api/video/info    →  Backend extracts metadata via yt-dlp --dump-json
  └── GET  /api/video/download →  Backend downloads via yt-dlp and streams the file
                                    ↕
Backend (Spring Boot, port 8080)
  └── YtDlpService: wraps yt-dlp CLI via ProcessBuilder
  └── VideoService: orchestration + Caffeine cache (5min TTL)
  └── PlatformDetectorService: regex-based platform detection from URL
  └── GlobalExceptionHandler: maps yt-dlp stderr to user-friendly error messages
```

Frontend uses a dev proxy (`proxy.conf.json`) to route `/api` requests to the backend.

## Conventions

- **Backend package:** `com.videograb` with sub-packages `config/`, `controller/`, `dto/`, `service/`, `exception/`
- **Frontend:** Angular 19 standalone components, SCSS, prefix `app`, component-based architecture under `src/app/components/`
- **DTOs:** Java records (`VideoInfoResponseDto`, `VideoFormatDto`, etc.)
- **Config:** `@ConfigurationProperties` with `@Configuration` for yt-dlp settings
- **Error handling:** `mapYtDlpError()` in YtDlpService parses yt-dlp stderr and throws either `VideoNotFoundException` (4xx) or `DownloadException` (5xx). GlobalExceptionHandler logs at warn/info level (no stack traces for expected errors).
- **IDE:** Spring Tool Suite for Eclipse (STS) — avoid patterns that generate STS warnings

## Key Configuration

- `application.yml`: yt-dlp path, temp dir, timeout (120s), max filesize (500M), CORS origins
- `proxy.conf.json`: `/api` → `http://localhost:8080`
- `environment.ts`: `apiUrl: '/api'`
