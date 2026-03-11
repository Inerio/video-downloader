# 🎬 VideoGrab - Plan d'implémentation

## Vue d'ensemble
Site web permettant de télécharger des vidéos depuis n'importe quelle plateforme (YouTube, TikTok, Instagram, Twitter/X, Facebook, Reddit, Vimeo, Dailymotion, Twitch, Pinterest, Snapchat, LinkedIn...) en collant simplement le lien.

**Stack :** Angular 19 (front) + Spring Boot 3.5 / Java 21 (back) + yt-dlp (moteur d'extraction)

---

## Architecture globale

```
┌─────────────────────────────────┐
│       Angular Frontend          │
│  (Coller lien → Choisir qualité │
│   → Télécharger)                │
└──────────────┬──────────────────┘
               │ HTTP REST
               ▼
┌─────────────────────────────────┐
│     Spring Boot Backend         │
│  ┌───────────┐ ┌──────────────┐ │
│  │ Controller│ │ yt-dlp       │ │
│  │ REST API  │→│ ProcessBuilder│ │
│  └───────────┘ └──────────────┘ │
│  ┌───────────┐ ┌──────────────┐ │
│  │ Cache     │ │ Rate Limiter │ │
│  │ Caffeine  │ │ Bucket4j     │ │
│  └───────────┘ └──────────────┘ │
└─────────────────────────────────┘
```

---

## Structure des dossiers

### Backend : `video-downloader-back/`

```
src/main/java/com/videograb/
├── config/
│   ├── CorsConfig.java              # CORS pour Angular dev server
│   ├── CacheConfig.java             # Cache Caffeine pour les métadonnées
│   ├── RateLimitConfig.java         # Rate limiting par IP
│   └── YtDlpConfig.java             # Config chemin yt-dlp + options
├── controller/
│   └── VideoController.java         # POST /api/video/info + GET /api/video/download
├── dto/
│   ├── VideoInfoRequestDto.java     # { url: string }
│   ├── VideoInfoResponseDto.java    # { title, thumbnail, duration, platform, formats[] }
│   ├── VideoFormatDto.java          # { formatId, quality, ext, filesize, hasAudio, hasVideo }
│   └── VideoDownloadRequestDto.java # { url, formatId }
├── service/
│   ├── VideoService.java            # Orchestration : info + download
│   ├── YtDlpService.java            # Wrapper yt-dlp : exécute les commandes via ProcessBuilder
│   └── PlatformDetectorService.java # Détection automatique de la plateforme depuis l'URL
├── exception/
│   ├── VideoNotFoundException.java
│   ├── DownloadException.java
│   ├── UnsupportedPlatformException.java
│   └── GlobalExceptionHandler.java  # @ControllerAdvice
└── VideoGrabApplication.java
```

### Frontend : `video-downloader-front/`

```
src/
├── app/
│   ├── components/
│   │   ├── home/                    # Page principale avec le champ URL
│   │   │   ├── home.component.ts
│   │   │   ├── home.component.html
│   │   │   └── home.component.scss
│   │   ├── url-input/               # Composant champ de saisie URL + détection plateforme
│   │   │   ├── url-input.component.ts
│   │   │   ├── url-input.component.html
│   │   │   └── url-input.component.scss
│   │   ├── video-result/            # Affichage résultat : thumbnail, titre, formats
│   │   │   ├── video-result.component.ts
│   │   │   ├── video-result.component.html
│   │   │   └── video-result.component.scss
│   │   ├── format-selector/         # Sélection qualité/format
│   │   │   ├── format-selector.component.ts
│   │   │   ├── format-selector.component.html
│   │   │   └── format-selector.component.scss
│   │   ├── platform-badge/          # Badge avec icône de la plateforme détectée
│   │   │   ├── platform-badge.component.ts
│   │   │   ├── platform-badge.component.html
│   │   │   └── platform-badge.component.scss
│   │   ├── download-progress/       # Barre de progression du téléchargement
│   │   │   ├── download-progress.component.ts
│   │   │   ├── download-progress.component.html
│   │   │   └── download-progress.component.scss
│   │   ├── header/
│   │   └── footer/
│   ├── models/
│   │   ├── video-info.model.ts      # Interface VideoInfo, VideoFormat
│   │   └── platform.model.ts        # Enum Platform + mapping icônes/couleurs
│   ├── services/
│   │   ├── video.service.ts         # Appels HTTP vers le backend
│   │   └── platform-detector.service.ts  # Détection plateforme côté front (pour l'UX)
│   ├── utils/
│   │   └── url-validator.util.ts    # Validation des URLs
│   ├── app.component.ts
│   ├── app.component.html
│   ├── app.component.scss
│   └── app.routes.ts
├── assets/
│   └── icons/                       # Icônes des plateformes (SVG)
├── environments/
│   ├── environment.ts
│   └── environment.prod.ts
├── styles/
│   ├── _variables.scss
│   ├── _mixins.scss
│   └── _platforms.scss              # Couleurs par plateforme
├── index.html
├── main.ts
└── styles.scss
```

---

## Étapes d'implémentation

### Phase 1 — Setup des projets (Backend + Frontend)

**1.1 Backend Spring Boot**
- Initialiser le projet Maven (Spring Boot 3.5.11, Java 21)
- Dépendances : spring-boot-starter-web, spring-boot-starter-webflux, spring-boot-starter-validation, spring-boot-starter-cache, caffeine, bucket4j
- Créer `application.yml` avec config yt-dlp, CORS, cache
- Créer `CorsConfig.java` (même pattern que CineSearch)
- Créer `CacheConfig.java` (cache des métadonnées vidéo, TTL 5 min)

**1.2 Frontend Angular**
- Initialiser le projet Angular 19 (standalone components, SCSS, ESLint)
- Configurer `proxy.conf.json` pour rediriger `/api` vers le backend (port 8080)
- Installer les éventuelles dépendances (ngx-toastr pour les notifications)
- Setup des environments (dev/prod)

---

### Phase 2 — Backend : Core yt-dlp

**2.1 YtDlpConfig**
- Configuration du chemin binaire yt-dlp
- Options par défaut (timeout, répertoire temp, user-agent)

**2.2 YtDlpService**
- Méthode `getVideoInfo(String url)` :
  - Exécute `yt-dlp --dump-json --no-download <url>`
  - Parse le JSON retourné en DTO (titre, thumbnail, durée, formats disponibles)
- Méthode `downloadVideo(String url, String formatId)` :
  - Exécute `yt-dlp -f <formatId> -o <tempPath> <url>`
  - Retourne le fichier téléchargé en stream

**2.3 PlatformDetectorService**
- Détection par regex sur l'URL (youtube.com, tiktok.com, instagram.com, x.com, twitter.com, facebook.com, reddit.com, vimeo.com, dailymotion.com, twitch.tv, pinterest.com, snapchat.com, linkedin.com)
- Retourne le nom normalisé de la plateforme

**2.4 VideoService**
- `getInfo(String url)` : valide URL → détecte plateforme → appelle yt-dlp → retourne les infos
- `download(String url, String formatId)` : appelle yt-dlp → stream le fichier en réponse HTTP

---

### Phase 3 — Backend : Controller & Gestion d'erreurs

**3.1 VideoController**
```
POST /api/video/info     → Body: { url } → Response: VideoInfoResponseDto
GET  /api/video/download → Params: url, formatId → Response: StreamingResponseBody (fichier)
```

**3.2 GlobalExceptionHandler**
- Gestion des erreurs yt-dlp (URL invalide, vidéo privée, plateforme non supportée)
- Rate limit exceeded
- Réponses JSON propres avec messages utilisateur

**3.3 RateLimitConfig**
- Limiter les requêtes par IP (ex: 10 downloads/min) pour éviter les abus

---

### Phase 4 — Frontend : UI principale

**4.1 Home Component**
- Layout principal : header + zone de saisie URL centrée + zone résultat
- Design épuré, moderne, avec un fond gradient subtil

**4.2 URL Input Component**
- Champ de saisie avec placeholder "Collez le lien de votre vidéo ici..."
- Bouton "Analyser" / icône de recherche
- Validation en temps réel de l'URL
- Détection automatique de la plateforme en tapant (affichage du badge)
- Support du collage (paste) avec lancement auto de l'analyse

**4.3 Platform Badge Component**
- Icône SVG de la plateforme + nom
- Couleur spécifique par plateforme (rouge YouTube, noir TikTok, rose Instagram, etc.)

**4.4 Video Result Component**
- Thumbnail de la vidéo
- Titre, durée, nom de la plateforme
- Liste des formats disponibles (via format-selector)

**4.5 Format Selector Component**
- Tableau/liste des qualités disponibles (1080p, 720p, 480p, audio only...)
- Affichage de la taille estimée
- Bouton "Télécharger" par format
- Option "Meilleure qualité" pré-sélectionnée

**4.6 Download Progress Component**
- Barre de progression pendant le téléchargement
- État : "Préparation..." → "Téléchargement en cours..." → "Terminé !"
- Lien de téléchargement direct une fois prêt

---

### Phase 5 — Services Frontend

**5.1 VideoService**
- `getVideoInfo(url: string): Observable<VideoInfo>` → POST /api/video/info
- `downloadVideo(url: string, formatId: string): Observable<Blob>` → GET /api/video/download (avec reportProgress pour la barre)

**5.2 PlatformDetectorService (front)**
- Détection locale par regex pour afficher le badge instantanément sans attendre le backend
- Mapping plateforme → { icon, color, label }

---

### Phase 6 — Plateformes supportées

Grâce à yt-dlp, toutes ces plateformes sont supportées nativement :

| Plateforme     | Exemples d'URLs                              |
|----------------|----------------------------------------------|
| YouTube        | youtube.com/watch, youtu.be, /shorts/        |
| TikTok         | tiktok.com/@user/video/                      |
| Instagram      | instagram.com/reel/, /p/                     |
| Twitter/X      | x.com/user/status/, twitter.com/...          |
| Facebook       | facebook.com/watch, fb.watch                 |
| Reddit         | reddit.com/r/.../comments/                   |
| Vimeo          | vimeo.com/123456                             |
| Dailymotion    | dailymotion.com/video/                       |
| Twitch         | twitch.tv/videos/, clips.twitch.tv           |
| Pinterest      | pinterest.com/pin/                           |
| Snapchat       | snapchat.com/spotlight/                      |
| LinkedIn       | linkedin.com/posts/                          |

---

### Phase 7 — Polish & UX

- Animations de transition entre les états (idle → loading → result)
- Responsive design (mobile-first)
- Gestion des erreurs côté front (toast notifications)
- Favicon + titre du site
- Section "Plateformes supportées" en bas de page avec les icônes
- Dark mode optionnel

---

## Prérequis système

- **yt-dlp** installé sur la machine backend (`pip install yt-dlp` ou binaire)
- **ffmpeg** installé (pour le merge audio+vidéo quand nécessaire)
- Java 21 + Maven
- Node.js 18+ + Angular CLI

---

## Conventions (alignées sur tes projets existants)

- **Backend :** Package `com.videograb`, même structure config/controller/dto/service/exception que CineSearch
- **Frontend :** Standalone components, SCSS, prefix `app`, architecture component-based (comme CineSearch)
- **Spring Boot :** 3.5.11, Java 21, Maven
- **Angular :** 19.x, ESLint, Jest
- **API prefix :** `/api/video/`
- **CORS :** Configurable via `application.yml`
