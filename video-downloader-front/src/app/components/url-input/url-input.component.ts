import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PlatformBadgeComponent } from '../platform-badge/platform-badge.component';
import { detectPlatform } from '../../models/platform.model';

@Component({
  selector: 'app-url-input',
  standalone: true,
  imports: [FormsModule, PlatformBadgeComponent],
  template: `
    <div class="input-wrapper">
      <div class="input-container" [class.has-platform]="detectedPlatform && detectedPlatform !== 'unknown'">
        @if (detectedPlatform && detectedPlatform !== 'unknown') {
          <app-platform-badge [platformName]="detectedPlatform" />
        }
        <input
          type="url"
          [(ngModel)]="url"
          (ngModelChange)="onUrlChange($event)"
          (paste)="onPaste($event)"
          (keydown.enter)="onSubmit()"
          placeholder="Collez le lien de votre vidéo ici..."
          class="url-field"
          [disabled]="loading"
        />
        <button
          class="submit-btn"
          (click)="onSubmit()"
          [disabled]="!url.trim() || loading"
        >
          @if (loading) {
            <span class="spinner"></span>
          } @else {
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
            Analyser
          }
        </button>
      </div>
      @if (errorMessage) {
        <p class="error">{{ errorMessage }}</p>
      }
    </div>
  `,
  styles: [`
    .input-wrapper {
      max-width: 700px;
      margin: 0 auto;
      padding: 0 1rem;
    }

    .input-container {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #1e1e2e;
      border: 2px solid #2d2d3f;
      border-radius: 16px;
      padding: 0.5rem;
      transition: border-color 0.2s;

      &:focus-within {
        border-color: #6366f1;
      }

      &.has-platform {
        padding-left: 0.75rem;
      }
    }

    .url-field {
      flex: 1;
      background: none;
      border: none;
      outline: none;
      color: #e5e5e5;
      font-size: 1rem;
      padding: 0.75rem 0.5rem;
      min-width: 0;

      &::placeholder {
        color: #6b7280;
      }

      &:disabled {
        opacity: 0.6;
      }
    }

    .submit-btn {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.75rem 1.25rem;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: opacity 0.2s, transform 0.1s;

      &:hover:not(:disabled) {
        opacity: 0.9;
        transform: translateY(-1px);
      }

      &:active:not(:disabled) {
        transform: translateY(0);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error {
      color: #ef4444;
      font-size: 0.85rem;
      margin: 0.5rem 0 0 0.5rem;
    }
  `]
})
export class UrlInputComponent {
  url = '';
  detectedPlatform = '';
  @Input() loading = false;
  errorMessage = '';

  @Output() analyze = new EventEmitter<string>();

  onUrlChange(value: string) {
    this.errorMessage = '';
    this.detectedPlatform = value.trim() ? detectPlatform(value.trim()) : '';
  }

  onPaste(event: ClipboardEvent) {
    setTimeout(() => {
      if (this.url.trim()) {
        this.onUrlChange(this.url);
        this.onSubmit();
      }
    }, 0);
  }

  onSubmit() {
    const trimmed = this.url.trim();
    if (!trimmed) return;

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      this.errorMessage = "L'URL doit commencer par http:// ou https://";
      return;
    }

    this.analyze.emit(trimmed);
  }
}
