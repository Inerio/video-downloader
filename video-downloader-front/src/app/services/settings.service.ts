import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private autoDownloadSignal = signal<boolean>(this.getInitialAutoDownload());

  isAutoDownload = computed(() => this.autoDownloadSignal());

  toggleAutoDownload() {
    const newValue = !this.autoDownloadSignal();
    this.autoDownloadSignal.set(newValue);
    localStorage.setItem('downloadit-auto-download', String(newValue));
  }

  private getInitialAutoDownload(): boolean {
    return localStorage.getItem('downloadit-auto-download') === 'true';
  }
}
