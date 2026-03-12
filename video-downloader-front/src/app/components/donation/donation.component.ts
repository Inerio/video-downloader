import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-donation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a
      href="https://buymeacoffee.com/inerio"
      target="_blank"
      rel="noopener noreferrer"
      class="bmc-btn"
      [attr.aria-label]="t.t()('donation.label')">
      <svg width="20" height="20" viewBox="0 0 884 1279" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M791.109 297.518L790.231 297.002L788.201 296.383C789.018 297.072 790.04 297.472 791.109 297.518Z" fill="#0D0C22"/>
        <path d="M803.896 388.891L802.916 389.166L803.896 388.891Z" fill="#0D0C22"/>
        <path d="M791.484 297.377C791.359 297.361 791.237 297.332 791.118 297.29C791.482 297.## 791.484 297.377Z" fill="#0D0C22"/>
        <path d="M804.34 388.769L803.896 388.891L804.34 388.769Z" fill="#0D0C22"/>
        <path d="M884 585.74C884 557.088 856.12 532.61 834.32 518.2L804.34 388.77L803.9 388.89C804.77 383.27 805.16 377.55 805.07 371.83C805.07 255.18 698.71 157.26 581.07 157.26C520.95 157.26 468.45 178.53 428.03 212.09C428.03 212.09 428.03 212.09 428.03 212.1C419.32 219.52 411.17 227.58 403.65 236.2C397.18 243.56 390.34 252.95 384.72 260.78C322.57 196.75 237.81 157.26 143.93 157.26C64.43 157.26 0 223.69 0 305.19C0 386.69 73.43 437.88 143.93 437.88C193.03 437.88 237.72 420.33 271.56 391.39L287.34 409.88L314.3 441.86C284.78 479.04 265.9 524.7 262.45 574.76C203.75 598.24 163.45 668.74 163.45 717.44C163.45 828.44 277.95 920.94 410.95 920.94C543.95 920.94 658.45 828.44 658.45 717.44C658.45 669.34 618.77 599.31 560.67 575.39C557.31 525.33 538.45 479.68 509 442.51L535.38 411.04L550.93 393.41C584.52 421.65 628.57 438.71 677.07 438.71C747.57 438.71 821 387.52 821 306.02C821 300.26 820.64 294.58 819.95 289.01L820.63 289.55C843.94 307.17 884 339.49 884 585.74Z" fill="#FFDD00"/>
        <path d="M410.95 1278.05C543.95 1278.05 658.45 1185.55 658.45 1074.55C658.45 963.55 543.95 871.05 410.95 871.05C277.95 871.05 163.45 963.55 163.45 1074.55C163.45 1185.55 277.95 1278.05 410.95 1278.05Z" fill="#FFDD00"/>
        <path d="M581.07 157.27C520.95 157.27 468.45 178.54 428.03 212.1C428.03 212.1 428.03 212.1 428.03 212.11C419.32 219.53 411.17 227.59 403.65 236.21C397.18 243.57 390.34 252.96 384.72 260.79C322.57 196.76 237.81 157.27 143.93 157.27C64.43 157.27 0 223.7 0 305.2C0 386.7 73.43 437.89 143.93 437.89C193.03 437.89 237.72 420.34 271.56 391.4L287.34 409.89L314.3 441.87C284.78 479.05 265.9 524.71 262.45 574.77C203.75 598.25 163.45 668.75 163.45 717.45C163.45 828.45 277.95 920.95 410.95 920.95C543.95 920.95 658.45 828.45 658.45 717.45C658.45 669.35 618.77 599.32 560.67 575.4C557.31 525.34 538.45 479.69 509 442.52L535.38 411.05L550.93 393.42C584.52 421.66 628.57 438.72 677.07 438.72C747.57 438.72 821 387.53 821 306.03C821 224.53 747.57 157.27 677.07 157.27H581.07Z" fill="#0D0C22"/>
      </svg>
      <span>{{ t.t()('donation.button') }}</span>
    </a>
  `,
  styles: [`
    .bmc-btn {
      position: fixed;
      bottom: 24px;
      left: 24px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 1rem;
      background: var(--donation-bg);
      color: var(--donation-text);
      border-radius: 12px;
      text-decoration: none;
      font-size: 0.95rem;
      font-weight: 700;
      font-family: inherit;
      box-shadow: 0 4px 15px var(--donation-shadow);
      transition: all 0.3s ease;
      z-index: 1000;

      &:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 20px var(--donation-shadow-hover);
      }

      svg { flex-shrink: 0; }
    }

    @media (max-width: 480px) {
      .bmc-btn {
        bottom: 16px;
        left: 16px;
        padding: 0.5rem 0.75rem;
        font-size: 0.85rem;

        svg { width: 16px; height: 16px; }
      }
    }
  `]
})
export class DonationComponent {
  constructor(public t: TranslationService) {}
}
