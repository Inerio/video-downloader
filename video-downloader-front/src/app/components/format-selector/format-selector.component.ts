import { Component, EventEmitter, Input, Output } from '@angular/core';
import { VideoFormat } from '../../models/video-info.model';

@Component({
  selector: 'app-format-selector',
  standalone: true,
  template: `
    <div class="formats">
      <h3>Choisir la qualité</h3>
      <div class="format-list">
        @for (format of filteredFormats; track format.formatId) {
          <button
            class="format-item"
            [class.best]="format.formatId === 'best'"
            (click)="selectFormat.emit(format.formatId)"
          >
            <div class="format-info">
              <span class="format-quality">{{ format.quality }}</span>
              <span class="format-ext">.{{ format.extension }}</span>
              @if (format.filesize) {
                <span class="format-size">{{ formatFileSize(format.filesize) }}</span>
              }
            </div>
            <div class="format-tags">
              @if (format.hasVideo && format.hasAudio) {
                <span class="tag tag-full">Video + Audio</span>
              } @else if (format.hasVideo) {
                <span class="tag tag-video">Video only</span>
              } @else if (format.hasAudio) {
                <span class="tag tag-audio">Audio only</span>
              }
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="dl-icon">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
            </svg>
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .formats {
      margin-top: 1.5rem;
    }

    h3 {
      color: #e5e5e5;
      font-size: 1rem;
      margin: 0 0 0.75rem;
    }

    .format-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-height: 320px;
      overflow-y: auto;
      padding-right: 0.25rem;
    }

    .format-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: #252536;
      border: 1px solid #2d2d3f;
      border-radius: 10px;
      padding: 0.75rem 1rem;
      color: #e5e5e5;
      cursor: pointer;
      transition: all 0.15s;
      text-align: left;
      font: inherit;

      &:hover {
        border-color: #6366f1;
        background: #2a2a40;
      }

      &.best {
        border-color: #6366f1;
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.15));
      }
    }

    .format-info {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .format-quality {
      font-weight: 600;
    }

    .format-ext {
      color: #9ca3af;
      font-size: 0.8rem;
    }

    .format-size {
      color: #6b7280;
      font-size: 0.8rem;
    }

    .format-tags {
      display: flex;
      gap: 0.25rem;
    }

    .tag {
      font-size: 0.7rem;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-weight: 500;
    }

    .tag-full { background: #064e3b; color: #6ee7b7; }
    .tag-video { background: #1e3a5f; color: #93c5fd; }
    .tag-audio { background: #4a1d5e; color: #d8b4fe; }

    .dl-icon {
      color: #6366f1;
      flex-shrink: 0;
    }
  `]
})
export class FormatSelectorComponent {
  @Input() formats: VideoFormat[] = [];
  @Output() selectFormat = new EventEmitter<string>();

  get filteredFormats(): VideoFormat[] {
    return this.formats.filter(f =>
      f.formatId === 'best' || f.hasAudio || f.hasVideo
    );
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    return (bytes / 1073741824).toFixed(2) + ' GB';
  }
}
