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

      @if (isLongVideo) {
        <div class="duration-warning" role="note">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {{ t.t()('result.duration.warning') }}
        </div>
      }

      <app-format-selector
        [formats]="videoInfo.formats"
        [contentType]="videoInfo.contentType"
        (selectFormat)="onDownload($event)"
        [disabled]="downloading"
      />

      @if (downloading) {
        <div class="download-progress" role="status">
          <div class="progress-top">
            <span class="progress-format">{{ selectedFormatLabel }}</span>
          </div>
          <div class="progress-header">
            <span class="progress-label">
              <span class="spinner--sm"></span>
              {{ t.t()('result.downloading') }}
            </span>
          </div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill indeterminate"></div>
          </div>
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

    .duration-warning {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 1rem;
      padding: 0.6rem 0.9rem;
      background: var(--download-status-bg);
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      font-size: 0.85rem;

      svg { flex-shrink: 0; color: var(--accent-primary); }
    }

    .download-progress {
      margin-top: 1rem;
      padding: 0.75rem 1rem;
      background: var(--bg-elevated);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-lg);
      animation: slideUp 0.3s ease;
    }

    .progress-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.4rem;
    }

    .progress-format {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--accent-primary);
    }

    .progress-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.4rem;
    }

    .progress-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-secondary);
      font-size: 0.85rem;
      font-weight: 500;
    }

    .progress-bar-track {
      width: 100%;
      height: 8px;
      background: var(--download-status-bg);
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      background: var(--accent-primary);
      border-radius: 4px;

      &.indeterminate {
        width: 40%;
        animation: indeterminate 1.5s ease-in-out infinite;
      }
    }

    @keyframes indeterminate {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(350%); }
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
  thumbnailError = false;
  downloading = false;
  selectedFormatLabel = '';
  private downloadTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private videoService: VideoService,
    public t: TranslationService,
    private cdr: ChangeDetectorRef
  ) {}

  get isLongVideo(): boolean {
    if (!this.videoInfo?.duration) return false;
    const parts = this.videoInfo.duration.split(':').map(Number);
    if (parts.some(isNaN)) return false;
    let totalSeconds: number;
    if (parts.length === 3) totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    else if (parts.length === 2) totalSeconds = parts[0] * 60 + parts[1];
    else totalSeconds = parts[0] || 0;
    return totalSeconds > 600; // > 10 min
  }

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
      this.downloading = false;
    }
  }

  onThumbnailError() {
    this.thumbnailError = true;
    this.cdr.markForCheck();
  }

  ngOnDestroy() {
    if (this.downloadTimer) clearTimeout(this.downloadTimer);
  }

  onDownload(formatId: string) {
    this.selectedFormatLabel = this.buildFormatLabel(formatId);

    const downloadUrl = this.videoService.getDownloadUrl(this.videoUrl, formatId, this.filename);

    // Trigger browser download via hidden link
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = this.filename || '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Show downloading indicator with progress bar
    this.downloading = true;
    this.cdr.markForCheck();
    if (this.downloadTimer) clearTimeout(this.downloadTimer);
    this.downloadTimer = setTimeout(() => {
      this.downloading = false;
      this.cdr.markForCheck();
    }, 5000);
  }

  private buildFormatLabel(formatId: string): string {
    const format = this.videoInfo.formats.find(f => f.formatId === formatId);
    if (format) {
      const parts: string[] = [];
      if (format.quality) parts.push(format.quality);
      if (format.extension) parts.push(format.extension.toUpperCase());
      if (format.hasVideo && format.hasAudio) parts.push('Video + Audio');
      else if (format.hasVideo) parts.push('Video');
      else if (format.hasAudio) parts.push('Audio');
      return parts.join(' · ');
    }
    if (formatId === 'best') return this.t.t()('format.download.best').replace('Télécharger — ', '').replace('Download — ', '');
    return formatId;
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

// ==================================================================================
// HD MERGE + SSE PROGRESS BAR — DISABLED (Cloudflare Tunnel TOS)
//
// The code below implements an async download system with real-time progress tracking
// via Server-Sent Events (SSE). It was disabled because serving large merged HD video
// files through Cloudflare Tunnel violates the free-tier CDN disproportionate-content
// policy. To re-enable, restore the SSE flow in onDownload() and the DownloadProgress
// interface usage.
//
// Key concepts:
// - POST /api/video/download/start → taskId
// - GET /api/video/download/{taskId}/progress → SSE stream with DownloadProgressDto
// - GET /api/video/download/{taskId}/file → retrieve merged file
// - Unified progress: single-stream 0→90%, dual-stream video 0→50% + audio 50→90%,
//   merge 95%, complete 100%
//
// See also: DownloadTaskService.java, AsyncConfig.java, DownloadProgressDto.java
// ==================================================================================
