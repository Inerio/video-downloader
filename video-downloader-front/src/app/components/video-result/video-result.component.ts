import { Component, Input, OnChanges, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { VideoInfo, DownloadProgress } from '../../models/video-info.model';
import { VideoService } from '../../services/video.service';
import { PlatformBadgeComponent } from '../platform-badge/platform-badge.component';
import { FormatSelectorComponent } from '../format-selector/format-selector.component';
import { TranslationService } from '../../services/translation.service';
import { DecimalPipe } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-video-result',
  standalone: true,
  imports: [FormsModule, DecimalPipe, PlatformBadgeComponent, FormatSelectorComponent],
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
        [disabled]="!!downloadProgress"
      />

      @if (downloadProgress) {
        <div class="download-progress" role="status" [class.progress-error]="downloadProgress.status === 'error'">
          <div class="progress-top">
            <span class="progress-format">{{ selectedFormatLabel }}</span>
            @if (downloadProgress.status === 'downloading' && downloadProgress.speed) {
              <span class="progress-meta">{{ downloadProgress.speed }} — ETA {{ downloadProgress.eta }}</span>
            }
          </div>
          <div class="progress-header">
            <span class="progress-label">
              @if (downloadProgress.status === 'merging') {
                {{ t.t()('result.merging') }}
              } @else if (downloadProgress.status === 'error') {
                {{ downloadProgress.error || t.t()('app.error.analyze') }}
              } @else if (downloadProgress.status === 'downloading') {
                @if (downloadProgress.phase === 'audio') {
                  {{ t.t()('result.downloading.audio') }}
                } @else {
                  {{ t.t()('result.downloading.video') }}
                }
              } @else {
                <span class="spinner--sm"></span>
                {{ t.t()('result.preparing') }}
              }
            </span>
            <span class="progress-percent">{{ unifiedPercent | number:'1.0-0' }}%</span>
          </div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill" [style.width.%]="unifiedPercent"
                 [class.merging]="downloadProgress.status === 'merging'"
                 [class.error]="downloadProgress.status === 'error'"></div>
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

      &.progress-error {
        border-color: var(--error-border);
        background: var(--error-surface);
      }
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

    .progress-meta {
      color: var(--text-muted);
      font-size: 0.8rem;
      font-weight: 400;
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
      transition: width 0.4s ease;

      &.merging {
        background: var(--accent-surface);
        animation: pulse 1.5s ease-in-out infinite;
      }

      &.error {
        background: var(--error-light);
      }
    }

    .progress-percent {
      color: var(--text-primary);
      font-size: 0.85rem;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
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
  downloadProgress: DownloadProgress | null = null;
  selectedFormatLabel = '';
  private downloadTimer: ReturnType<typeof setTimeout> | null = null;
  private eventSource: EventSource | null = null;
  private sseRetryCount = 0;
  private startSub?: Subscription;

  private static readonly MAX_SSE_RETRIES = 3;
  private static readonly EMPTY_PROGRESS: DownloadProgress = {
    status: 'error', percent: 0, speed: '', eta: '', error: '',
    downloadPass: 0, phase: '', isMergeFormat: false
  };

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

  /** Remap raw per-stream progress into a single continuous 0→100% bar */
  get unifiedPercent(): number {
    if (!this.downloadProgress) return 0;
    const { status, percent, downloadPass, phase, isMergeFormat } = this.downloadProgress;
    const safePercent = (typeof percent === 'number' && !isNaN(percent)) ? percent : 0;

    if (status === 'complete') return 100;
    if (status === 'error' || status === 'pending') return 0;

    // Merge phase → 95%
    if (status === 'merging' || phase === 'merge') return 95;

    // Single-stream download (no merge needed): map 0→90% directly
    if (!isMergeFormat) {
      return Math.min(90, safePercent * 0.9);
    }

    // Dual-stream merge format
    if (downloadPass === 0) {
      // Video stream: 0→50%
      return Math.min(50, safePercent * 0.5);
    }
    if (downloadPass === 1) {
      // Audio stream: 50→90%
      return Math.min(90, 50 + safePercent * 0.4);
    }

    return Math.min(100, 90);
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
      this.cancelDownload();
    }
  }

  onThumbnailError() {
    this.thumbnailError = true;
    this.cdr.markForCheck();
  }

  ngOnDestroy() {
    if (this.downloadTimer) clearTimeout(this.downloadTimer);
    this.cleanupEventSource();
    this.startSub?.unsubscribe();
  }

  onDownload(formatId: string) {
    // Allow re-download: cancel any active progress/timer
    if (this.downloadProgress) {
      this.cancelDownload();
    }

    this.selectedFormatLabel = this.buildFormatLabel(formatId);
    this.downloadProgress = {
      status: 'pending', percent: 0, speed: '', eta: '', error: null,
      downloadPass: 0, phase: '', isMergeFormat: formatId.includes('+')
    };
    this.cdr.markForCheck();

    this.startSub?.unsubscribe();
    this.startSub = this.videoService.startDownload(this.videoUrl, formatId).subscribe({
      next: (res) => {
        this.sseRetryCount = 0;
        this.listenToProgress(res.taskId);
        this.cdr.markForCheck();
      },
      error: (err) => {
        const msg = err?.error?.message || this.t.t()('app.error.analyze');
        this.downloadProgress = { ...VideoResultComponent.EMPTY_PROGRESS, error: msg };
        this.cdr.markForCheck();
        this.resetProgressAfterDelay();
      }
    });
  }

  private listenToProgress(taskId: string) {
    this.cleanupEventSource();

    const url = this.videoService.getProgressUrl(taskId);
    this.eventSource = new EventSource(url);

    this.eventSource.addEventListener('progress', (event: MessageEvent) => {
      try {
        const data: DownloadProgress = JSON.parse(event.data);
        this.downloadProgress = data;
        this.sseRetryCount = 0; // reset on successful message
        this.cdr.markForCheck();

        if (data.status === 'complete') {
          this.cleanupEventSource();
          this.triggerFileDownload(taskId);
          this.resetProgressAfterDelay();
        } else if (data.status === 'error') {
          this.cleanupEventSource();
          this.resetProgressAfterDelay();
        }
      } catch {
        // Malformed JSON — ignore this event, wait for next
      }
    });

    this.eventSource.onerror = () => {
      // EventSource fires onerror on transient issues AND permanent failures
      // Only treat as fatal if readyState is CLOSED or max retries exceeded
      if (this.eventSource?.readyState === EventSource.CLOSED) {
        this.sseRetryCount++;
        this.cleanupEventSource();

        if (this.sseRetryCount < VideoResultComponent.MAX_SSE_RETRIES
            && this.downloadProgress?.status !== 'complete') {
          // Retry after short delay
          setTimeout(() => this.listenToProgress(taskId), 1000);
        } else if (this.downloadProgress?.status !== 'complete') {
          this.downloadProgress = {
            ...VideoResultComponent.EMPTY_PROGRESS,
            error: this.t.t()('app.error.analyze')
          };
          this.cdr.markForCheck();
          this.resetProgressAfterDelay();
        }
      }
      // If readyState is CONNECTING, the browser is auto-reconnecting — do nothing
    };
  }

  private triggerFileDownload(taskId: string) {
    const fileUrl = this.videoService.getTaskFileUrl(taskId, this.filename);
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = this.filename || '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private cancelDownload() {
    if (this.downloadTimer) {
      clearTimeout(this.downloadTimer);
      this.downloadTimer = null;
    }
    this.cleanupEventSource();
    this.startSub?.unsubscribe();
    this.downloadProgress = null;
  }

  private resetProgressAfterDelay() {
    if (this.downloadTimer) clearTimeout(this.downloadTimer);
    this.downloadTimer = setTimeout(() => {
      this.downloadProgress = null;
      this.cdr.markForCheck();
    }, 4000);
  }

  private cleanupEventSource() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
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
    const match = formatId.match(/height<=(\d+)/);
    if (match) return `${match[1]}p · MP4 · Video + Audio`;
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
