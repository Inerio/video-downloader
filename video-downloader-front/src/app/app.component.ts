import { Component } from '@angular/core';
import { HeaderComponent } from './components/header/header.component';
import { UrlInputComponent } from './components/url-input/url-input.component';
import { VideoResultComponent } from './components/video-result/video-result.component';
import { SupportedPlatformsComponent } from './components/supported-platforms/supported-platforms.component';
import { VideoService } from './services/video.service';
import { VideoInfo } from './models/video-info.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeaderComponent, UrlInputComponent, VideoResultComponent, SupportedPlatformsComponent],
  template: `
    <div class="app">
      <app-header />

      <main>
        <app-url-input [loading]="loading" (analyze)="onAnalyze($event)" />

        @if (error) {
          <div class="error-banner">
            <p>{{ error }}</p>
          </div>
        }

        @if (videoInfo) {
          <app-video-result [videoInfo]="videoInfo" [videoUrl]="currentUrl" />
        }
      </main>

      <app-supported-platforms />
    </div>
  `,
  styles: [`
    .app {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    main {
      flex: 1;
      padding: 1rem 0;
    }

    .error-banner {
      max-width: 700px;
      margin: 1rem auto 0;
      padding: 0.75rem 1rem;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 10px;
      animation: slideUp 0.3s ease;

      p {
        margin: 0;
        color: #fca5a5;
        font-size: 0.9rem;
      }
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class AppComponent {
  videoInfo: VideoInfo | null = null;
  currentUrl = '';
  error = '';
  loading = false;

  constructor(private videoService: VideoService) {}

  onAnalyze(url: string) {
    this.error = '';
    this.videoInfo = null;
    this.currentUrl = url;
    this.loading = true;

    this.videoService.getVideoInfo(url).subscribe({
      next: (info) => {
        this.videoInfo = info;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || "Impossible d'analyser cette URL. Vérifiez le lien et réessayez.";
        this.loading = false;
      }
    });
  }
}
