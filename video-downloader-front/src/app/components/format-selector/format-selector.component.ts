import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy, OnChanges } from '@angular/core';
import { VideoFormat } from '../../models/video-info.model';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-format-selector',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="formats">
      @if (bestFormat) {
        <button class="best-btn" (click)="selectFormat.emit(bestFormat.formatId)" [disabled]="disabled" [attr.aria-label]="downloadLabel">
          <div class="best-left">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
            </svg>
            <span>{{ downloadLabel }}</span>
          </div>
          @if (contentType === 'video') {
            <span class="best-tag">{{ t.t()('format.recommended') }}</span>
          }
        </button>
      }

      @if (otherFormats.length > 0 && contentType !== 'gif') {
        <button
          class="toggle-btn"
          (click)="expanded = !expanded"
          [attr.aria-expanded]="expanded"
          aria-controls="format-list">
          <span>{{ expanded ? t.t()('format.hide') : t.t()('format.show') }} {{ t.t()('format.others') }} ({{ otherFormats.length }})</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [class.rotated]="expanded" aria-hidden="true">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        @if (expanded) {
          <div class="format-list" id="format-list" role="list">
            @for (format of otherFormats; track format.formatId) {
              <button class="format-item" (click)="selectFormat.emit(format.formatId)" [disabled]="disabled" role="listitem" [attr.aria-label]="format.quality + ' ' + format.extension">
                <div class="format-info">
                  <span class="format-quality">{{ format.quality }}</span>
                  <span class="format-ext">.{{ format.extension }}</span>
                  @if (format.filesize) {
                    <span class="format-size">{{ formatFileSize(format.filesize) }}</span>
                  }
                </div>
                <div class="format-tags">
                  @if (format.hasVideo && format.hasAudio) {
                    <span class="tag tag-full">{{ t.t()('format.tag.full') }}</span>
                  } @else if (format.hasVideo) {
                    <span class="tag tag-video">{{ t.t()('format.tag.video') }}</span>
                  } @else if (format.hasAudio) {
                    <span class="tag tag-audio">{{ t.t()('format.tag.audio') }}</span>
                  }
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="dl-icon" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
                </svg>
              </button>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .formats { margin-top: 1.5rem; }

    .best-btn {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 1rem 1.25rem;
      background: var(--gradient-primary);
      border: none;
      border-radius: var(--radius-lg);
      color: var(--text-on-accent);
      cursor: pointer;
      font: inherit;
      font-size: 1rem;
      font-weight: 600;
      transition: opacity 0.2s, transform 0.1s;

      &:hover { opacity: 0.92; transform: translateY(-1px); }
      &:active { transform: translateY(0); }
    }

    .best-left {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .best-tag {
      font-size: 0.85rem;
      padding: 0.25rem 0.6rem;
      background: rgba(0, 0, 0, 0.15);
      border-radius: var(--radius-sm);
      font-weight: 500;
    }

    .toggle-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      width: 100%;
      margin-top: 0.75rem;
      padding: 0.6rem;
      background: none;
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      cursor: pointer;
      font: inherit;
      font-size: 0.95rem;
      transition: color 0.2s, border-color 0.2s;

      &:hover { color: var(--text-primary); border-color: var(--accent-primary); }

      svg {
        transition: transform 0.2s;
        &.rotated { transform: rotate(180deg); }
      }
    }

    .format-list {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      margin-top: 0.5rem;
      max-height: 280px;
      overflow-y: auto;
      padding-right: 0.25rem;
      animation: fadeIn 0.2s ease;
    }

    .format-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: var(--bg-elevated);
      border: 1px solid var(--border-default);
      border-radius: 10px;
      padding: 0.6rem 0.85rem;
      color: var(--text-primary);
      cursor: pointer;
      transition: all 0.15s;
      text-align: left;
      font: inherit;
      font-size: 0.9rem;

      &:hover { border-color: var(--accent-primary); background: var(--format-item-hover-bg); }
    }

    .format-info {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .format-quality { font-weight: 600; }
    .format-ext { color: var(--text-secondary); font-size: 0.88rem; }
    .format-size { color: var(--text-muted); font-size: 0.88rem; }

    .format-tags { display: flex; gap: 0.25rem; }

    .tag {
      font-size: 0.8rem;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-weight: 500;
    }

    .tag-full { background: var(--tag-full-bg); color: var(--tag-full-text); }
    .tag-video { background: var(--tag-video-bg); color: var(--tag-video-text); }
    .tag-audio { background: var(--tag-audio-bg); color: var(--tag-audio-text); }

    .dl-icon { color: var(--accent-primary); flex-shrink: 0; }
  `]
})
export class FormatSelectorComponent implements OnChanges {
  @Input() formats: VideoFormat[] = [];
  @Input() contentType = 'video';
  @Input() disabled = false;
  @Output() selectFormat = new EventEmitter<string>();

  expanded = false;

  constructor(public t: TranslationService) {}

  ngOnChanges() {
    this.expanded = false;
  }

  get downloadLabel(): string {
    switch (this.contentType) {
      case 'gif': return this.t.t()('format.download.gif');
      case 'short': return this.t.t()('format.download.short');
      case 'clip': return this.t.t()('format.download.clip');
      case 'audio': return this.t.t()('format.download.audio');
      default: return this.t.t()('format.download.best');
    }
  }

  get bestFormat(): VideoFormat | undefined {
    return this.formats.find(f => f.formatId === 'best') || this.formats[0];
  }

  get otherFormats(): VideoFormat[] {
    const bestId = this.bestFormat?.formatId;
    return this.formats.filter(f =>
      f.formatId !== bestId && (f.hasAudio || f.hasVideo)
    );
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    return (bytes / 1073741824).toFixed(2) + ' GB';
  }
}
