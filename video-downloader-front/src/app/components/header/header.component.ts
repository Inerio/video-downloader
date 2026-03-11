import { Component } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  template: `
    <header class="header">
      <div class="header-content">
        <div class="logo">
          <span class="logo-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/>
              <rect x="2" y="6" width="14" height="12" rx="2"/>
            </svg>
          </span>
          <h1>VideoGrab</h1>
        </div>
        <p class="tagline">Téléchargez vos vidéos depuis n'importe quelle plateforme</p>
      </div>
    </header>
  `,
  styles: [`
    .header {
      text-align: center;
      padding: 2rem 1rem 1rem;
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
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border-radius: 12px;
      color: white;
    }

    h1 {
      font-size: 2rem;
      font-weight: 800;
      margin: 0;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .tagline {
      color: #9ca3af;
      margin: 0.5rem 0 0;
      font-size: 1rem;
    }
  `]
})
export class HeaderComponent {}
