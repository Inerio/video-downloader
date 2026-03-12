import { Injectable, signal, computed, effect } from '@angular/core';

export type Theme = 'obscure' | 'clair';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private themeSignal = signal<Theme>(this.getInitialTheme());

  theme = this.themeSignal.asReadonly();
  isDark = computed(() => this.themeSignal() === 'obscure');
  isClair = computed(() => this.themeSignal() === 'clair');

  constructor() {
    effect(() => {
      document.documentElement.setAttribute('data-theme', this.themeSignal());
    });
  }

  setTheme(theme: Theme) {
    this.themeSignal.set(theme);
    localStorage.setItem('downloadit-theme', theme);
  }

  toggleTheme() {
    this.setTheme(this.themeSignal() === 'obscure' ? 'clair' : 'obscure');
  }

  private getInitialTheme(): Theme {
    const saved = localStorage.getItem('downloadit-theme') as Theme;
    if (saved === 'obscure' || saved === 'clair') return saved;
    if (window.matchMedia?.('(prefers-color-scheme: light)').matches) return 'clair';
    return 'obscure';
  }
}
