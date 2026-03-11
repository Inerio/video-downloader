import { Component, Input } from '@angular/core';
import { VideoInfo } from '../../models/video-info.model';
import { VideoService } from '../../services/video.service';
import { PlatformBadgeComponent } from '../platform-badge/platform-badge.component';
import { FormatSelectorComponent } from '../format-selector/format-selector.component';

@Component({
  selector: 'app-video-result',
  standalone: true,
  imports: [PlatformBadgeComponent, FormatSelectorComponent],
  template: `
    <div class="result-card">
      <div class="video-preview">
        @if (videoInfo.thumbnail) {
          <img [src]="videoInfo.thumbnail" [alt]="videoInfo.title" class="thumbnail" />
        }
        <div class="video-meta">
          <app-platform-badge [platformName]="videoInfo.platform" />
          <h2 class="title">{{ videoInfo.title }}</h2>
          <div class="meta-row">
            @if (videoInfo.uploader) {
              <span class="uploader">{{ videoInfo.uploader }}</span>
            }
            <span class="duration">{{ videoInfo.duration }}</span>
          </div>
        </div>
      </div>

      <app-format-selector
        [formats]="videoInfo.formats"
        (selectFormat)="onDownload($event)"
      />

      @if (downloading) {
        <div class="download-status">
          <span class="spinner"></span>
          Préparation du téléchargement...
        </div>
      }
    </div>
  `,
  styles: [`
    .result-card {
      max-width: 700px;
      margin: 2rem auto 0;
      padding: 1.5rem;
      background: #1a1a2e;
      border: 1px solid #2d2d3f;
      border-radius: 16px;
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
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

    .video-meta {
      flex: 1;
      min-width: 0;
    }

    .title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #e5e5e5;
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
      color: #9ca3af;
      font-size: 0.85rem;
    }

    .download-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 1rem;
      padding: 0.75rem 1rem;
      background: rgba(99, 102, 241, 0.1);
      border-radius: 10px;
      color: #a5b4fc;
      font-size: 0.9rem;
    }

    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(165, 180, 252, 0.3);
      border-top-color: #a5b4fc;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 600px) {
      .video-preview {
        flex-direction: column;
      }

      .thumbnail {
        width: 100%;
        height: auto;
        aspect-ratio: 16 / 9;
      }
    }
  `]
})
export class VideoResultComponent {
  @Input() videoInfo!: VideoInfo;
  @Input() videoUrl!: string;

  downloading = false;

  constructor(private videoService: VideoService) {}

  onDownload(formatId: string) {
    this.downloading = true;
    const downloadUrl = this.videoService.getDownloadUrl(this.videoUrl, formatId);

    // Trigger download via hidden link
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      this.downloading = false;
    }, 3000);
  }
}
