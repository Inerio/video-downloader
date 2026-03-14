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
import { SettingsService } from './services/settings.service';
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

      @if (showInstallLink) {
        <button class="install-link" [class.fading]="installLinkFading" (click)="openInstallPopup()">
          <i class="fas fa-download" aria-hidden="true"></i>
          {{ t.t()('app.install.link') }}
        </button>
      }

      @if (showInstallPopup) {
        <div class="install-overlay" (click)="closeInstallPopup(false)">
          <div class="install-popup" (click)="$event.stopPropagation()">
            <h3>{{ t.t()('app.install.title') }}</h3>
            <div class="install-steps">
              <p>{{ t.t()('app.install.step1') }}</p>
              <p>{{ t.t()('app.install.step2') }}</p>
              <p>{{ t.t()('app.install.step3') }}</p>
            </div>
            <label class="install-checkbox">
              <input type="checkbox" #dontShow>
              {{ t.t()('app.install.dontshow') }}
            </label>
            <button class="install-close-btn" (click)="closeInstallPopup(dontShow.checked)">
              {{ t.t()('app.install.ok') }}
            </button>
          </div>
        </div>
      }

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
      color: var(--text-on-accent);
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

    .install-link {
      display: none;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      margin: 0 auto;
      padding: 0.4rem 1rem;
      background: transparent;
      color: var(--accent-primary);
      border: none;
      font-family: inherit;
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      opacity: 1;
      animation: slideDown 0.3s ease;
      transition: opacity 0.5s ease;

      &:hover { text-decoration: underline; }
      &.fading { opacity: 0; }
      i { font-size: 0.7rem; }
    }

    @media (max-width: 768px) {
      .install-link { display: flex; }
    }

    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .install-overlay {
      position: fixed;
      inset: 0;
      z-index: 1000;
      background: var(--overlay-bg);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      animation: fadeIn 0.2s ease;
    }

    .install-popup {
      background: var(--bg-card);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      max-width: 350px;
      width: 100%;
      animation: slideUp 0.3s ease;

      h3 {
        margin: 0 0 1rem;
        color: var(--text-primary);
        font-size: 1.1rem;
        text-align: center;
      }
    }

    .install-steps {
      margin-bottom: 1.25rem;

      p {
        margin: 0.5rem 0;
        color: var(--text-secondary);
        font-size: 0.9rem;
        line-height: 1.4;
      }
    }

    .install-checkbox {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      color: var(--text-muted);
      font-size: 0.85rem;
      cursor: pointer;

      input { accent-color: var(--accent-primary); }
    }

    .install-close-btn {
      display: block;
      width: 100%;
      padding: 0.6rem;
      background: var(--gradient-primary);
      color: var(--text-on-accent);
      border: none;
      border-radius: var(--radius-md);
      font-family: inherit;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;

      &:hover { opacity: 0.9; }
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy, AfterViewChecked {
  videoInfo: VideoInfo | null = null;
  currentUrl = '';
  error = '';
  loading = false;
  clipboardUrl: string | null = null;
  showInstallLink = false;
  showInstallPopup = false;
  installLinkFading = false;
  private shouldScroll = false;
  private lastClipboardUrl = '';
  private installFadeTimeout?: ReturnType<typeof setTimeout>;

  get hasContent(): boolean {
    return !!(this.videoInfo || this.loading || this.error);
  }

  private analyzeSub?: Subscription;

  constructor(
    private videoService: VideoService,
    public t: TranslationService,
    private themeService: ThemeService,
    private settingsService: SettingsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    document.documentElement.lang = this.t.lang();
    document.title = this.t.t()('meta.title');
    this.handleShareTarget();
    this.setupClipboardWatch();
    this.setupInstallBanner();
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

  openInstallPopup() {
    this.showInstallLink = false;
    this.installLinkFading = false;
    if (this.installFadeTimeout) clearTimeout(this.installFadeTimeout);
    this.showInstallPopup = true;
    this.cdr.markForCheck();
  }

  closeInstallPopup(dontShowAgain: boolean) {
    this.showInstallPopup = false;
    if (dontShowAgain) {
      localStorage.setItem('downloadit-pwa-hide-install', 'true');
    }
    this.cdr.markForCheck();
  }

  onClipboardAccept() {
    if (this.clipboardUrl) {
      this.onAnalyze(this.clipboardUrl);
      this.clipboardUrl = null;
    }
  }

  private setupInstallBanner() {
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (localStorage.getItem('downloadit-pwa-hide-install')) return;
    if (!/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) return;

    this.showInstallLink = true;
    this.installFadeTimeout = setTimeout(() => {
      this.installLinkFading = true;
      this.cdr.markForCheck();
      setTimeout(() => {
        this.showInstallLink = false;
        this.cdr.markForCheck();
      }, 500);
    }, 15000);
  }

  private handleShareTarget() {
    const params = new URLSearchParams(window.location.search);
    const sharedUrl = params.get('shared_url');
    const sharedText = params.get('shared_text');

    const url = this.extractUrl(sharedUrl, sharedText);
    if (!url) return;

    window.history.replaceState({}, '', '/');

    if (this.settingsService.isAutoDownload()) {
      this.autoDownload(url);
    } else {
      this.onAnalyze(url);
    }
  }

  private autoDownload(url: string) {
    this.currentUrl = url;
    this.loading = true;
    this.error = '';
    this.cdr.markForCheck();

    this.analyzeSub?.unsubscribe();
    this.analyzeSub = this.videoService.getVideoInfo(url).subscribe({
      next: (info) => {
        const format = info.formats?.[0];
        if (format) {
          const filename = info.title?.replace(/[<>:"/\\|?*]/g, '').substring(0, 200) || 'download';
          const downloadUrl = this.videoService.getDownloadUrl(url, format.formatId, filename);
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
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
