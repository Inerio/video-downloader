import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="header">
      <div class="lang-switch" role="radiogroup" aria-label="Language">
        <button
          role="radio"
          [attr.aria-checked]="t.lang() === 'fr'"
          [class.active]="t.lang() === 'fr'"
          (click)="t.switchLang('fr')">
          FR
        </button>
        <button
          role="radio"
          [attr.aria-checked]="t.lang() === 'en'"
          [class.active]="t.lang() === 'en'"
          (click)="t.switchLang('en')">
          EN
        </button>
      </div>
      <div class="header-content">
        <div class="logo">
          <span class="logo-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/>
              <rect x="2" y="6" width="14" height="12" rx="2"/>
            </svg>
          </span>
          <h1>VideoGrab</h1>
        </div>
        <p class="tagline">{{ t.t()('header.tagline') }}</p>
      </div>
    </header>
  `,
  styles: [`
    .header {
      text-align: center;
      padding: 2rem 1rem 1rem;
      position: relative;
    }

    .lang-switch {
      position: absolute;
      top: 1rem;
      right: 1.5rem;
      display: flex;
      background: var(--bg-input);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      overflow: hidden;

      button {
        padding: 0.35rem 0.7rem;
        background: transparent;
        border: none;
        color: var(--text-muted);
        font-size: 0.75rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: inherit;

        &:hover { color: var(--text-primary); }
        &.active { background: var(--accent-primary); color: white; }
      }
    }

    .logo {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
    }

    .logo-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      background: var(--gradient-primary);
      border-radius: var(--radius-lg);
      color: white;
    }

    h1 {
      font-size: 2rem;
      font-weight: 800;
      margin: 0;
      background: var(--gradient-primary);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .tagline {
      color: var(--text-secondary);
      margin: 0.5rem 0 0;
      font-size: 1rem;
    }

    @media (max-width: 480px) {
      .lang-switch { top: 0.5rem; right: 0.75rem; }
      h1 { font-size: 1.5rem; }
      .tagline { font-size: 0.85rem; padding: 0 2rem; }
    }
  `]
})
export class HeaderComponent {
  constructor(public t: TranslationService) {}
}
