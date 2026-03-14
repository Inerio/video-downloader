import { Component, ChangeDetectionStrategy } from '@angular/core';
import { PLATFORMS, PlatformInfo } from '../../models/platform.model';
import { TranslationService } from '../../services/translation.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-supported-platforms',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="platforms-section" aria-label="Supported platforms">
      <h3>{{ t.t()('platforms.title') }}</h3>
      <p class="subtitle">{{ t.t()('platforms.subtitle') }}</p>
      <div class="platforms-grid" role="list">
        @for (p of platforms; track p.name) {
          <div class="platform-chip" [style.border-color]="p.color + '40'" role="listitem">
            <i [class]="p.icon" [style.color]="getIconColor(p)" aria-hidden="true"></i>
            <span>{{ p.label }}</span>
          </div>
        }
        <div class="platform-chip more" role="listitem">
          <span>{{ t.t()('platforms.more') }}</span>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .platforms-section {
      max-width: var(--max-content-width);
      margin: 3rem auto 2rem;
      padding: 0 1rem 4.5rem;
      text-align: center;
    }

    h3 {
      color: var(--text-muted);
      font-size: 0.95rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin: 0 0 0.4rem;
      font-weight: 500;
    }

    .subtitle {
      color: var(--text-muted);
      font-size: 0.9rem;
      margin: 0 0 1rem;
    }

    .platforms-grid {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.5rem;
    }

    .platform-chip {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.4rem 0.8rem;
      background: var(--bg-input);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      font-size: 0.9rem;
      transition: border-color 0.2s;

      &:hover { border-color: var(--accent-primary); }
      &.more { color: var(--text-secondary); font-style: italic; }
    }
  `]
})
export class SupportedPlatformsComponent {
  platforms: PlatformInfo[] = Object.values(PLATFORMS).filter(p => p.name !== 'unknown');

  constructor(public t: TranslationService, public themeService: ThemeService) {}

  getIconColor(p: PlatformInfo): string {
    if (p.color === '#000000') {
      return this.themeService.isDark() ? '#EBE7DF' : '#2A2315';
    }
    if (p.color === '#FFFC00' && !this.themeService.isDark()) {
      return '#B8A600';
    }
    return p.color;
  }
}
