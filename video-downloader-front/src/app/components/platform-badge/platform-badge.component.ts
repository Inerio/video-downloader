import { Component, Input } from '@angular/core';
import { PlatformInfo, getPlatformInfo } from '../../models/platform.model';

@Component({
  selector: 'app-platform-badge',
  standalone: true,
  template: `
    <span class="badge" [style.background]="platform.color" [style.color]="textColor">
      <i [class]="platform.icon"></i>
      {{ platform.label }}
    </span>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.3rem 0.75rem;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 600;
      white-space: nowrap;
    }
  `]
})
export class PlatformBadgeComponent {
  platform: PlatformInfo = getPlatformInfo('unknown');
  textColor = '#fff';

  @Input() set platformName(value: string) {
    this.platform = getPlatformInfo(value);
    this.textColor = value === 'snapchat' ? '#000' : '#fff';
  }
}
