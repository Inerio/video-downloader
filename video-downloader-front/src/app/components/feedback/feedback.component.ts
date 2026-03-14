import { Component, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FeedbackService, FeedbackRequest } from '../../services/feedback.service';
import { TranslationService } from '../../services/translation.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Floating button -->
    <button
      class="fab"
      (click)="toggle()"
      [class.active]="isOpen"
      [attr.aria-label]="t.t()('feedback.open')"
      [attr.aria-expanded]="isOpen">
      <i class="fas" [class.fa-comment]="!isOpen" [class.fa-times]="isOpen" aria-hidden="true"></i>
    </button>

    <!-- Overlay -->
    @if (isOpen) {
      <div class="overlay" (click)="close()"></div>
    }

    <!-- Modal -->
    @if (isOpen) {
      <div class="modal" [class.success]="state === 'success'" role="dialog" [attr.aria-label]="t.t()('feedback.title')">
        @if (state === 'success') {
          <div class="success-content">
            <i class="fas fa-check-circle" aria-hidden="true"></i>
            <p>{{ t.t()('feedback.success') }}</p>
          </div>
        } @else {
          <h3>{{ t.t()('feedback.title') }}</h3>

          <div class="type-selector" role="radiogroup" [attr.aria-label]="t.t()('feedback.title')">
            <button
              role="radio"
              [attr.aria-checked]="type === 'BUG'"
              [class.selected]="type === 'BUG'"
              (click)="type = 'BUG'">
              <i class="fas fa-bug" aria-hidden="true"></i> {{ t.t()('feedback.type.bug') }}
            </button>
            <button
              role="radio"
              [attr.aria-checked]="type === 'LINK'"
              [class.selected]="type === 'LINK'"
              (click)="type = 'LINK'">
              <i class="fas fa-link" aria-hidden="true"></i> {{ t.t()('feedback.type.link') }}
            </button>
            <button
              role="radio"
              [attr.aria-checked]="type === 'SUGGESTION'"
              [class.selected]="type === 'SUGGESTION'"
              (click)="type = 'SUGGESTION'">
              <i class="fas fa-lightbulb" aria-hidden="true"></i> {{ t.t()('feedback.type.suggestion') }}
            </button>
          </div>

          <textarea
            [(ngModel)]="message"
            [placeholder]="t.t()('feedback.placeholder')"
            rows="4"
            maxlength="2000"
            [class.invalid]="submitted && message.trim().length < 10"
            [attr.aria-label]="t.t()('feedback.placeholder')">
          </textarea>
          @if (submitted && message.trim().length < 10) {
            <span class="hint" role="alert">{{ t.t()('feedback.hint.min') }}</span>
          }

          <input
            type="url"
            [(ngModel)]="url"
            [placeholder]="t.t()('feedback.url.placeholder')"
            [attr.aria-label]="t.t()('feedback.url.placeholder')"
          />

          <input
            type="email"
            [(ngModel)]="email"
            [placeholder]="t.t()('feedback.email.placeholder')"
            [attr.aria-label]="t.t()('feedback.email.placeholder')"
          />

          @if (errorMsg) {
            <p class="error" role="alert">{{ errorMsg }}</p>
          }

          <button class="submit-btn" (click)="send()" [disabled]="state === 'sending'" [attr.aria-label]="t.t()('feedback.send')">
            @if (state === 'sending') {
              <i class="fas fa-spinner fa-spin" aria-hidden="true"></i> {{ t.t()('feedback.sending') }}
            } @else {
              <i class="fas fa-paper-plane" aria-hidden="true"></i> {{ t.t()('feedback.send') }}
            }
          </button>
        }
      </div>
    }
  `,
  styles: [`
    .fab {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 52px;
      height: 52px;
      border-radius: 50%;
      border: none;
      background: var(--gradient-accent);
      color: var(--text-on-accent);
      font-size: 1.3rem;
      cursor: pointer;
      box-shadow: 0 4px 15px var(--fab-shadow);
      transition: all 0.3s ease;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover { transform: scale(1.1); box-shadow: 0 6px 20px var(--fab-shadow-hover); }
      &.active { background: var(--fab-active-bg); }
    }

    .overlay {
      position: fixed;
      inset: 0;
      background: var(--overlay-bg);
      z-index: 999;
      animation: fadeIn 0.2s ease;
    }

    .modal {
      position: fixed;
      bottom: 90px;
      right: 24px;
      width: 360px;
      max-width: calc(100vw - 48px);
      background: var(--bg-card);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-xl);
      padding: 1.5rem;
      z-index: 1001;
      animation: slideUp 0.3s ease;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;

      h3 {
        margin: 0;
        color: var(--text-primary);
        font-size: 1.1rem;
        font-weight: 600;
      }
    }

    .type-selector {
      display: flex;
      gap: 0.5rem;

      button {
        flex: 1;
        padding: 0.5rem;
        border: 1px solid var(--border-light);
        border-radius: var(--radius-md);
        background: transparent;
        color: var(--text-secondary);
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.35rem;

        &:hover { border-color: var(--accent-light); color: var(--text-primary); }
        &.selected { background: var(--selected-bg); border-color: var(--accent-light); color: var(--accent-light); }
      }
    }

    textarea, input {
      width: 100%;
      padding: 0.65rem 0.75rem;
      background: var(--bg-input);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-md);
      color: var(--text-primary);
      font-size: 0.95rem;
      font-family: inherit;
      resize: vertical;
      outline: none;
      transition: border-color 0.2s ease;
      box-sizing: border-box;

      &::placeholder { color: var(--text-placeholder); }
      &:focus { border-color: var(--accent-light); }
      &.invalid { border-color: var(--error); }
    }

    .hint { color: var(--error); font-size: 0.85rem; margin-top: -0.5rem; }

    .error {
      color: var(--error-light);
      font-size: 0.9rem;
      margin: 0;
      padding: 0.5rem;
      background: var(--error-surface);
      border-radius: var(--radius-sm);
    }

    .submit-btn {
      width: 100%;
      padding: 0.7rem;
      border: none;
      border-radius: 10px;
      background: var(--gradient-accent);
      color: var(--text-on-accent);
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;

      &:hover:not(:disabled) { box-shadow: 0 4px 15px var(--fab-shadow); }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }

    .success-content {
      text-align: center;
      padding: 1.5rem 0;

      i { font-size: 2.5rem; color: var(--success); margin-bottom: 0.75rem; display: block; }
      p { color: var(--text-primary); font-size: 1rem; margin: 0; }
    }

    @media (max-width: 480px) {
      .modal { right: 12px; bottom: 80px; width: calc(100vw - 24px); }
      .fab { bottom: 16px; right: 16px; }
    }
  `]
})
export class FeedbackComponent implements OnDestroy {
  isOpen = false;
  state: 'idle' | 'sending' | 'success' = 'idle';
  submitted = false;
  errorMsg = '';

  type: 'BUG' | 'LINK' | 'SUGGESTION' = 'BUG';
  message = '';
  url = '';
  email = '';

  private sendSub?: Subscription;
  private successTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private feedbackService: FeedbackService,
    public t: TranslationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnDestroy() {
    this.sendSub?.unsubscribe();
    if (this.successTimer) clearTimeout(this.successTimer);
  }

  toggle() {
    this.isOpen = !this.isOpen;
    if (!this.isOpen) this.reset();
  }

  close() {
    this.isOpen = false;
    this.reset();
  }

  send() {
    this.submitted = true;
    this.errorMsg = '';

    if (this.message.trim().length < 10) return;

    this.state = 'sending';

    const data: FeedbackRequest = {
      type: this.type,
      message: this.message.trim(),
      url: this.url.trim() || undefined,
      email: this.email.trim() || undefined
    };

    this.sendSub?.unsubscribe();
    this.sendSub = this.feedbackService.sendFeedback(data).subscribe({
      next: () => {
        this.state = 'success';
        this.cdr.markForCheck();
        this.successTimer = setTimeout(() => {
          this.close();
          this.cdr.markForCheck();
        }, 2000);
      },
      error: (err) => {
        this.state = 'idle';
        this.errorMsg = err.error?.message || this.t.t()('feedback.error');
        this.cdr.markForCheck();
      }
    });
  }

  private reset() {
    this.sendSub?.unsubscribe();
    if (this.successTimer) clearTimeout(this.successTimer);
    this.state = 'idle';
    this.submitted = false;
    this.errorMsg = '';
    this.type = 'BUG';
    this.message = '';
    this.url = '';
    this.email = '';
  }
}
