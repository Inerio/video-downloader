import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { HeaderComponent } from './components/header/header.component';
import { UrlInputComponent } from './components/url-input/url-input.component';
import { VideoResultComponent } from './components/video-result/video-result.component';
import { SupportedPlatformsComponent } from './components/supported-platforms/supported-platforms.component';
import { FeedbackComponent } from './components/feedback/feedback.component';
import { VideoService } from './services/video.service';
import { VideoInfo } from './models/video-info.model';
import { TranslationService } from './services/translation.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeaderComponent, UrlInputComponent, VideoResultComponent, SupportedPlatformsComponent, FeedbackComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app">
      <app-header />

      <main>
        <app-url-input [loading]="loading" (analyze)="onAnalyze($event)" />

        @if (error) {
          <div class="error-banner" role="alert">
            <p>{{ error }}</p>
          </div>
        }

        @if (videoInfo) {
          <app-video-result [videoInfo]="videoInfo" [videoUrl]="currentUrl" />
        }
      </main>

      <app-supported-platforms />
      <app-feedback />
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
      max-width: var(--max-content-width);
      margin: 1rem auto 0;
      padding: 0.75rem 1rem;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 10px;
      animation: slideUp 0.3s ease;

      p {
        margin: 0;
        color: var(--error-light);
        font-size: 0.9rem;
      }
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  videoInfo: VideoInfo | null = null;
  currentUrl = '';
  error = '';
  loading = false;

  private analyzeSub?: Subscription;

  constructor(
    private videoService: VideoService,
    private t: TranslationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    document.documentElement.lang = this.t.lang();
    document.title = this.t.t()('meta.title');
  }

  ngOnDestroy() {
    this.analyzeSub?.unsubscribe();
  }

  onAnalyze(url: string) {
    this.error = '';
    this.videoInfo = null;
    this.currentUrl = url;
    this.loading = true;

    this.analyzeSub?.unsubscribe();
    this.analyzeSub = this.videoService.getVideoInfo(url).subscribe({
      next: (info) => {
        this.videoInfo = info;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = err.error?.message || this.t.t()('app.error.analyze');
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }
}
