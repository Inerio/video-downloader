# VideoGrab

Application web pour télécharger des vidéos depuis n'importe quelle plateforme en collant simplement le lien.

## Plateformes supportées

YouTube, TikTok, Instagram, Twitter/X, Facebook, Reddit, Vimeo, Dailymotion, Twitch, Pinterest, Snapchat, LinkedIn — et des centaines d'autres via yt-dlp.

## Stack technique

- **Frontend** : Angular 19 (standalone components, SCSS)
- **Backend** : Spring Boot 3.5 / Java 21
- **Moteur vidéo** : [yt-dlp](https://github.com/yt-dlp/yt-dlp) (gratuit, open-source)

## Prérequis

- Java 21+
- Node.js 18+
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) installé et accessible dans le PATH (`pip install yt-dlp`)

## Installation

### Backend

```bash
cd video-downloader-back
./mvnw spring-boot:run
```

Le serveur démarre sur `http://localhost:8080`.

### Frontend

```bash
cd video-downloader-front
npm install
ng serve
```

L'application est accessible sur `http://localhost:4200`.

## Fonctionnalités

- Collage automatique depuis le presse-papier avec analyse instantanée
- Détection automatique de la plateforme
- Choix de la qualité (meilleure qualité recommandée + formats alternatifs)
- Renommage du fichier avant téléchargement
- Messages d'erreur explicites en français

## Licence

[MIT](LICENSE)
