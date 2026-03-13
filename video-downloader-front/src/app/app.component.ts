import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewChecked } from '@angular/core';
import { HeaderComponent } from './components/header/header.component';
import { UrlInputComponent } from './components/url-input/url-input.component';
import { VideoResultComponent } from './components/video-result/video-result.component';
import { SupportedPlatformsComponent } from './components/supported-platforms/supported-platforms.component';
import { FeedbackComponent } from './components/feedback/feedback.component';
import { DonationComponent } from './components/donation/donation.component';
import { VideoService } from './services/video.service';
import { VideoInfo } from './models/video-info.model';
import { TranslationService } from './services/translation.service';
import { ThemeService } from './services/theme.service';
import { detectPlatform } from './models/platform.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeaderComponent, UrlInputComponent, VideoResultComponent, SupportedPlatformsComponent, FeedbackComponent, DonationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app" [class.idle]="!hasContent">
      <app-header />

      <main>
        <app-url-input [loading]="loading" [initialUrl]="currentUrl" (analyze)="onAnalyze($event)" />

        @if (clipboardUrl && !loading && !videoInfo) {
          <button class="clipboard-banner" (click)="onClipboardAccept()">
            <i class="fas fa-link" aria-hidden="true"></i>
            {{ t.t()('app.clipboard.detected') }}
          </button>
        }

        @if (error) {
          <div class="error-banner" role="alert">
            <p>{{ error }}</p>
          </div>
        }

        @if (videoInfo) {
          <app-video-result #videoResult [videoInfo]="videoInfo" [videoUrl]="currentUrl" />
        }
      </main>

      <app-supported-platforms />
      <app-donation />
      <app-feedback />
    </div>
  `,
  styles: [`
    .app {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }

    main {
      flex: 1;
      padding: 1rem 0;
    }

    /* Idle state: center header + input vertically */
    .app.idle {
      justify-content: center;
    }

    .app.idle main {
      flex: 0 0 auto;
    }

    .error-banner {
      max-width: var(--max-content-width);
      margin: 1rem auto 0;
      padding: 0.75rem 1rem;
      background: var(--error-surface);
      border: 1px solid var(--error-border);
      border-radius: 10px;
      animation: slideUp 0.3s ease;

      p {
        margin: 0;
        color: var(--error-light);
        font-size: 0.9rem;
      }
    }

    .clipboard-banner {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      max-width: var(--max-content-width);
      margin: 0.75rem auto 0;
      padding: 0.75rem 1.25rem;
      background: var(--gradient-primary);
      color: white;
      border: none;
      border-radius: var(--radius-lg);
      font-family: inherit;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      animation: slideUp 0.3s ease;
      transition: opacity 0.2s, transform 0.1s;
      width: calc(100% - 2rem);

      &:hover { opacity: 0.9; transform: translateY(-1px); }
      &:active { transform: translateY(0); }

      i { font-size: 0.85rem; }
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy, AfterViewChecked {
  videoInfo: VideoInfo | null = null;
  currentUrl = '';
  error = '';
  loading = false;
  clipboardUrl: string | null = null;
  private shouldScroll = false;
  private lastClipboardUrl = '';

  get hasContent(): boolean {
    return !!(this.videoInfo || this.loading || this.error);
  }

  private analyzeSub?: Subscription;

  constructor(
    private videoService: VideoService,
    public t: TranslationService,
    private themeService: ThemeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    document.documentElement.lang = this.t.lang();
    document.title = this.t.t()('meta.title');
    this.handleShareTarget();
    this.setupClipboardWatch();
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      const el = document.querySelector('app-video-result');
      if (el) {
        this.shouldScroll = false;
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
      }
    }
  }

  ngOnDestroy() {
    this.analyzeSub?.unsubscribe();
  }

  onClipboardAccept() {
    if (this.clipboardUrl) {
      this.onAnalyze(this.clipboardUrl);
      this.clipboardUrl = null;
    }
  }

  private handleShareTarget() {
    const params = new URLSearchParams(window.location.search);
    const sharedUrl = params.get('shared_url');
    const sharedText = params.get('shared_text');

    const url = this.extractUrl(sharedUrl, sharedText);
    if (url) {
      window.history.replaceState({}, '', '/');
      this.onAnalyze(url);
    }
  }

  private setupClipboardWatch() {
    if (!window.matchMedia('(display-mode: standalone)').matches) return;

    document.addEventListener('visibilitychange', async () => {
      if (document.visibilityState !== 'visible' || this.loading) return;

      try {
        const text = await navigator.clipboard.readText();
        const url = this.extractUrlFromText(text);
        if (url && url !== this.lastClipboardUrl && url !== this.currentUrl && detectPlatform(url) !== 'unknown') {
          this.lastClipboardUrl = url;
          this.clipboardUrl = url;
          this.cdr.markForCheck();
        }
      } catch {
        // Clipboard permission denied — ignore
      }
    });
  }

  private extractUrl(sharedUrl: string | null, sharedText: string | null): string | null {
    if (sharedUrl && this.isValidUrl(sharedUrl)) return sharedUrl;

    if (sharedText) {
      const url = this.extractUrlFromText(sharedText);
      if (url) return url;
    }

    if (sharedUrl) {
      const url = this.extractUrlFromText(sharedUrl);
      if (url) return url;
    }

    return null;
  }

  private extractUrlFromText(text: string): string | null {
    const match = text?.match(/https?:\/\/[^\s<>"{}|\\^`\[\]]+/i);
    return match && this.isValidUrl(match[0]) ? match[0] : null;
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
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
        this.shouldScroll = true;
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
