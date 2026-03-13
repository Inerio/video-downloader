import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PlatformBadgeComponent } from '../platform-badge/platform-badge.component';
import { detectPlatform } from '../../models/platform.model';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-url-input',
  standalone: true,
  imports: [FormsModule, PlatformBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
          (paste)="onPaste()"
          (keydown.enter)="onSubmit()"
          [placeholder]="t.t()('input.placeholder')"
          class="url-field"
          [disabled]="loading"
          aria-label="Video URL"
        />
        @if (loading) {
          <div class="loading-indicator" aria-label="Loading">
            <span class="spinner--md"></span>
          </div>
        } @else {
          <button
            class="paste-btn"
            (click)="onPasteFromClipboard()"
            [attr.aria-label]="t.t()('input.paste.tooltip')">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
            </svg>
            <span class="paste-label">{{ t.t()('input.paste.button') }}</span>
          </button>
        }
      </div>
      @if (errorMessage) {
        <p class="error" role="alert">{{ errorMessage }}</p>
      }
      <p class="hint">
        <i class="fas fa-info-circle" aria-hidden="true"></i>
        {{ t.t()('input.hint') }}
      </p>
    </div>
  `,
  styles: [`
    .input-wrapper {
      max-width: var(--max-content-width);
      margin: 0 auto;
      padding: 0 1rem;
    }

    .input-container {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--bg-input);
      border: 2px solid var(--border-default);
      border-radius: var(--radius-xl);
      padding: 0.5rem;
      transition: border-color 0.2s, background-color 0.4s ease;

      &:focus-within { border-color: var(--accent-primary); }
      &.has-platform { padding-left: 0.75rem; }
    }

    .url-field {
      flex: 1;
      background: none;
      border: none;
      outline: none;
      color: var(--text-primary);
      font-size: 1rem;
      padding: 0.75rem 0.5rem;
      min-width: 0;

      &::placeholder { color: var(--text-muted); }
      &:disabled { opacity: 0.6; }
    }

    .paste-btn {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.75rem 1.25rem;
      background: var(--gradient-primary);
      color: white;
      border: none;
      border-radius: var(--radius-lg);
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: opacity 0.2s, transform 0.1s;

      &:hover { opacity: 0.9; transform: translateY(-1px); }
      &:active { transform: translateY(0); }
    }

    .loading-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.75rem 1.25rem;
    }

    .error {
      color: var(--error);
      font-size: 0.95rem;
      margin: 0.5rem 0 0 0.5rem;
    }

    .hint {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      color: var(--text-muted);
      font-size: 0.9rem;
      margin: 0.5rem 0 0 0.25rem;

      i { font-size: 0.85rem; color: var(--accent-light); }
    }

    @media (max-width: 480px) {
      .paste-btn {
        padding: 0.6rem 0.75rem;
        font-size: 0.88rem;
      }
      .paste-label { display: none; }
    }
  `]
})
export class UrlInputComponent {
  url = '';
  detectedPlatform = '';
  @Input() loading = false;
  @Input() set initialUrl(value: string) {
    if (value) {
      this.url = value;
      this.onUrlChange(value);
    }
  }
  errorMessage = '';

  @Output() analyze = new EventEmitter<string>();

  constructor(public t: TranslationService) {}

  onUrlChange(value: string) {
    this.errorMessage = '';
    this.detectedPlatform = value.trim() ? detectPlatform(value.trim()) : '';
  }

  onPaste() {
    setTimeout(() => {
      if (this.url.trim()) {
        this.onUrlChange(this.url);
        this.onSubmit();
      }
    }, 0);
  }

  async onPasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        this.url = text.trim();
        this.onUrlChange(this.url);
        this.onSubmit();
      }
    } catch {
      this.errorMessage = this.t.t()('input.error.clipboard');
    }
  }

  onSubmit() {
    const trimmed = this.url.trim();
    if (!trimmed || this.loading) return;

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      this.errorMessage = this.t.t()('input.error.url');
      return;
    }

    this.analyze.emit(trimmed);
  }
}
