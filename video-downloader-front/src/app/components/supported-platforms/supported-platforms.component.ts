import { Component } from '@angular/core';
import { PLATFORMS, PlatformInfo } from '../../models/platform.model';

@Component({
  selector: 'app-supported-platforms',
  standalone: true,
  template: `
    <section class="platforms-section">
      <h3>Plateformes supportées</h3>
      <div class="platforms-grid">
        @for (p of platforms; track p.name) {
          <div class="platform-chip" [style.border-color]="p.color + '40'">
            <i [class]="p.icon" [style.color]="p.color === '#000000' ? '#e5e5e5' : p.color"></i>
            <span>{{ p.label }}</span>
          </div>
        }
        <div class="platform-chip more">
          <span>+ 1000 autres</span>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .platforms-section {
      max-width: 700px;
      margin: 3rem auto 2rem;
      padding: 0 1rem;
      text-align: center;
    }

    h3 {
      color: #6b7280;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin: 0 0 1rem;
      font-weight: 500;
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
      background: #1e1e2e;
      border: 1px solid #2d2d3f;
      border-radius: 8px;
      color: #d1d5db;
      font-size: 0.8rem;
      transition: border-color 0.2s;

      &:hover {
        border-color: #6366f1;
      }

      &.more {
        color: #9ca3af;
        font-style: italic;
      }
    }
  `]
})
export class SupportedPlatformsComponent {
  platforms: PlatformInfo[] = Object.values(PLATFORMS).filter(p => p.name !== 'unknown');
}
