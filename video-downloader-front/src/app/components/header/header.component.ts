import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TranslationService } from '../../services/translation.service';
import { ThemeService } from '../../services/theme.service';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="header">
      <!-- Theme toggle: top-left (sun/moon) -->
      <button
        class="theme-toggle"
        (click)="themeService.toggleTheme()"
        [attr.aria-label]="t.t()('theme.label')">
        @if (themeService.isDark()) {
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        } @else {
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        }
      </button>

      <!-- Settings toggle: next to theme -->
      <button
        class="settings-toggle"
        (click)="toggleSettings()"
        [attr.aria-label]="t.t()('settings.title')">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      </button>

      @if (showSettings) {
        <div class="settings-overlay" (click)="toggleSettings()">
          <div class="settings-panel" (click)="$event.stopPropagation()">
            <h3>{{ t.t()('settings.title') }}</h3>
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-label">{{ t.t()('settings.autoDownload.label') }}</span>
                <span class="setting-desc">{{ t.t()('settings.autoDownload.description') }}</span>
              </div>
              <button class="toggle-switch" [class.active]="settingsService.isAutoDownload()" (click)="settingsService.toggleAutoDownload()">
                <span class="toggle-knob"></span>
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Language switch: top-right -->
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
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" x2="12" y1="15" y2="3"/>
            </svg>
          </span>
          <h1>Download it</h1>
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
      transition: var(--transition-theme);
    }

    .theme-toggle {
      position: fixed;
      top: 1rem;
      left: 1.5rem;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: var(--bg-input);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      color: var(--accent-primary);
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        border-color: var(--accent-primary);
        color: var(--accent-light);
        transform: scale(1.05);
      }
    }

    .settings-toggle {
      position: fixed;
      top: 1rem;
      left: calc(1.5rem + 48px);
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: var(--bg-input);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      color: var(--accent-primary);
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        border-color: var(--accent-primary);
        color: var(--accent-light);
        transform: scale(1.05);
      }
    }

    .settings-overlay {
      position: fixed;
      inset: 0;
      z-index: 1001;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      animation: fadeIn 0.2s ease;
    }

    .settings-panel {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      max-width: 380px;
      width: 100%;
      animation: slideUp 0.3s ease;

      h3 {
        margin: 0 0 1.25rem;
        color: var(--text-primary);
        font-size: 1.1rem;
        text-align: center;
      }
    }

    .setting-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .setting-info {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      flex: 1;
    }

    .setting-label {
      color: var(--text-primary);
      font-size: 0.95rem;
      font-weight: 600;
    }

    .setting-desc {
      color: var(--text-muted);
      font-size: 0.8rem;
      line-height: 1.3;
    }

    .toggle-switch {
      position: relative;
      width: 48px;
      height: 26px;
      background: var(--border-default);
      border: none;
      border-radius: 13px;
      cursor: pointer;
      transition: background 0.2s ease;
      flex-shrink: 0;

      &.active { background: var(--accent-primary); }

      .toggle-knob {
        position: absolute;
        top: 3px;
        left: 3px;
        width: 20px;
        height: 20px;
        background: white;
        border-radius: 50%;
        transition: transform 0.2s ease;
      }

      &.active .toggle-knob { transform: translateX(22px); }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .lang-switch {
      position: fixed;
      top: 1rem;
      right: 1.5rem;
      z-index: 100;
      display: flex;
      background: var(--bg-input);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      overflow: hidden;
      transition: var(--transition-theme);

      button {
        padding: 0.4rem 0.75rem;
        background: transparent;
        border: none;
        color: var(--text-muted);
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: 'Cormorant Garamond', serif;
        letter-spacing: 0.03em;

        &:hover { color: var(--text-primary); }
        &.active { background: var(--accent-primary); color: #111110; }
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
      font-size: 2.2rem;
      font-weight: 800;
      margin: 0;
      background: var(--gradient-primary);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      font-family: 'Cormorant Garamond', Georgia, serif;
      letter-spacing: -0.01em;
    }

    .tagline {
      color: var(--text-secondary);
      margin: 0.5rem 0 0;
      font-size: 1.1rem;
      font-style: italic;
      font-weight: 500;
    }

    @media (max-width: 480px) {
      .theme-toggle { top: 0.5rem; left: 0.75rem; width: 36px; height: 36px; z-index: 100; }
      .settings-toggle { top: 0.5rem; left: calc(0.75rem + 42px); width: 36px; height: 36px; }
      .lang-switch { top: 0.5rem; right: 0.75rem; z-index: 100; }
      h1 { font-size: 1.6rem; }
      .tagline { font-size: 0.9rem; padding: 0 2rem; }

      .lang-switch button {
        padding: 0.3rem 0.55rem;
        font-size: 0.85rem;
      }
    }
  `]
})
export class HeaderComponent {
  showSettings = false;

  constructor(
    public t: TranslationService,
    public themeService: ThemeService,
    public settingsService: SettingsService
  ) {}

  toggleSettings() {
    this.showSettings = !this.showSettings;
  }
}
