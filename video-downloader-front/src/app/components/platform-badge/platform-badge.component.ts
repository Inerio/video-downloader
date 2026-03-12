import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { PlatformInfo, getPlatformInfo } from '../../models/platform.model';

@Component({
  selector: 'app-platform-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="badge" [style.background]="platform.color" [style.color]="textColor" role="img" [attr.aria-label]="platform.label">
      <i [class]="platform.icon" aria-hidden="true"></i>
      {{ platform.label }}
    </span>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.3rem 0.75rem;
      border-radius: var(--radius-full);
      font-size: 0.88rem;
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
