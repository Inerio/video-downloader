import { Component, Input, OnChanges, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { VideoInfo } from '../../models/video-info.model';
import { VideoService } from '../../services/video.service';
import { PlatformBadgeComponent } from '../platform-badge/platform-badge.component';
import { FormatSelectorComponent } from '../format-selector/format-selector.component';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-video-result',
  standalone: true,
  imports: [FormsModule, PlatformBadgeComponent, FormatSelectorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="result-card">
      <div class="video-preview">
        @if (videoInfo.thumbnail && !thumbnailError) {
          <img [src]="videoInfo.thumbnail" [alt]="videoInfo.title" class="thumbnail" loading="lazy" (error)="onThumbnailError()" />
        } @else {
          <div class="thumbnail-fallback">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/>
              <rect x="2" y="6" width="14" height="12" rx="2"/>
            </svg>
          </div>
        }
        <div class="video-meta">
          <div class="badges-row">
            <app-platform-badge [platformName]="videoInfo.platform" />
            @if (videoInfo.contentType && videoInfo.contentType !== 'video') {
              <span class="content-type-badge" [class]="'badge-' + videoInfo.contentType">
                {{ contentTypeLabel }}
              </span>
            }
          </div>
          <h2 class="title">{{ videoInfo.title }}</h2>
          <div class="meta-row">
            @if (videoInfo.uploader) {
              <span class="uploader">{{ videoInfo.uploader }}</span>
            }
            <span class="duration">{{ videoInfo.duration }}</span>
          </div>
        </div>
      </div>

      <div class="filename-section">
        <label for="filename">{{ t.t()('result.filename.label') }}</label>
        <div class="filename-input-row">
          <input
            id="filename"
            type="text"
            [(ngModel)]="filename"
            class="filename-field"
            [placeholder]="t.t()('result.filename.placeholder')"
            aria-label="File name"
          />
        </div>
      </div>

      <app-format-selector
        [formats]="videoInfo.formats"
        [contentType]="videoInfo.contentType"
        (selectFormat)="onDownload($event)"
      />

      @if (downloading) {
        <div class="download-status" role="status">
          <span class="spinner--sm"></span>
          {{ t.t()('result.preparing') }}
        </div>
      }
    </div>
  `,
  styles: [`
    .result-card {
      max-width: var(--max-content-width);
      margin: 2rem auto 0;
      padding: 1.5rem;
      background: var(--bg-card);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-xl);
      animation: slideUp 0.3s ease;
    }

    .video-preview {
      display: flex;
      gap: 1.25rem;
    }

    .thumbnail {
      width: 200px;
      height: 120px;
      object-fit: cover;
      border-radius: 10px;
      flex-shrink: 0;
    }

    .thumbnail-fallback {
      width: 200px;
      height: 120px;
      border-radius: 10px;
      flex-shrink: 0;
      background: var(--bg-elevated);
      border: 1px solid var(--border-default);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
    }

    .video-meta {
      flex: 1;
      min-width: 0;
    }

    .badges-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .content-type-badge {
      font-size: 0.8rem;
      font-weight: 600;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .badge-gif { background: var(--tag-gif-bg); color: var(--tag-gif-text); }
    .badge-short { background: var(--tag-short-bg); color: var(--tag-short-text); }
    .badge-clip { background: var(--tag-clip-bg); color: var(--tag-clip-text); }
    .badge-audio { background: var(--tag-audio-bg); color: var(--tag-audio-text); }

    .title {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0.5rem 0 0.4rem;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .meta-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: var(--text-secondary);
      font-size: 0.95rem;
    }

    .filename-section {
      margin-top: 1.25rem;

      label {
        display: block;
        color: var(--text-secondary);
        font-size: 0.9rem;
        margin-bottom: 0.4rem;
      }
    }

    .filename-input-row {
      display: flex;
      gap: 0.5rem;
    }

    .filename-field {
      flex: 1;
      background: var(--bg-elevated);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      padding: 0.6rem 0.75rem;
      color: var(--text-primary);
      font-size: 0.9rem;
      font-family: inherit;
      outline: none;
      transition: border-color 0.2s;

      &:focus { border-color: var(--accent-primary); }
    }

    .download-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 1rem;
      padding: 0.75rem 1rem;
      background: var(--download-status-bg);
      border-radius: 10px;
      color: var(--accent-surface);
      font-size: 0.9rem;
    }

    @media (max-width: 600px) {
      .video-preview { flex-direction: column; }
      .thumbnail, .thumbnail-fallback { width: 100%; height: auto; aspect-ratio: 16 / 9; }
    }
  `]
})
export class VideoResultComponent implements OnChanges, OnDestroy {
  @Input() videoInfo!: VideoInfo;
  @Input() videoUrl!: string;

  filename = '';
  downloading = false;
  thumbnailError = false;
  private downloadTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private videoService: VideoService,
    public t: TranslationService,
    private cdr: ChangeDetectorRef
  ) {}

  get contentTypeLabel(): string {
    switch (this.videoInfo?.contentType) {
      case 'gif': return 'GIF';
      case 'short': return 'Short';
      case 'clip': return 'Clip';
      case 'audio': return 'Audio';
      default: return '';
    }
  }

  ngOnChanges() {
    if (this.videoInfo) {
      this.filename = this.sanitizeFilename(this.videoInfo.title);
      this.thumbnailError = false;
    }
  }

  onThumbnailError() {
    this.thumbnailError = true;
    this.cdr.markForCheck();
  }

  ngOnDestroy() {
    if (this.downloadTimer) {
      clearTimeout(this.downloadTimer);
    }
  }

  onDownload(formatId: string) {
    this.downloading = true;
    const downloadUrl = this.videoService.getDownloadUrl(this.videoUrl, formatId, this.filename);

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = this.filename || '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (this.downloadTimer) {
      clearTimeout(this.downloadTimer);
    }
    this.downloadTimer = setTimeout(() => {
      this.downloading = false;
      this.cdr.markForCheck();
    }, 3000);
  }

  private sanitizeFilename(name: string): string {
    return name
      .replace(/[\x00-\x1F\x7F\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '')
      .replace(/[<>:"/\\|?*#]/g, '')
      .replace(/\.\./g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 200);
  }
}
