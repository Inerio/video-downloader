import { Injectable, signal, computed } from '@angular/core';

export type Lang = 'fr' | 'en';

const TRANSLATIONS: Record<Lang, Record<string, string>> = {
  fr: {
    // Header
    'header.tagline': 'Téléchargez vos vidéos et GIFs depuis n\'importe quelle plateforme',

    // URL Input
    'input.placeholder': 'Collez le lien de votre vidéo ici...',
    'input.paste.tooltip': 'Coller depuis le presse-papier',
    'input.paste.button': 'Coller',
    'input.error.clipboard': 'Impossible d\'accéder au presse-papier. Collez avec Ctrl+V.',
    'input.error.url': 'L\'URL doit commencer par http:// ou https://',
    'input.hint': 'Utilisez le lien de partage de la vidéo pour de meilleurs résultats',

    // Video Result
    'result.filename.label': 'Nom du fichier',
    'result.filename.placeholder': 'Nom du fichier...',
    'result.preparing': 'Préparation du téléchargement...',

    // Format Selector
    'format.recommended': 'Recommandé',
    'format.hide': 'Masquer',
    'format.show': 'Voir',
    'format.others': 'les autres formats',
    'format.download.gif': 'Télécharger le GIF',
    'format.download.short': 'Télécharger le Short',
    'format.download.clip': 'Télécharger le Clip',
    'format.download.audio': 'Télécharger l\'audio',
    'format.download.best': 'Télécharger — Meilleure qualité',

    // Supported Platforms
    'platforms.title': 'Plateformes supportées',
    'platforms.subtitle': 'Vidéos, GIFs, Shorts, Clips et plus encore',
    'platforms.more': '+ 1000 autres',

    // Feedback
    'feedback.open': 'Envoyer un retour',
    'feedback.title': 'Envoyer un retour',
    'feedback.success': 'Merci pour votre retour !',
    'feedback.type.bug': 'Bug',
    'feedback.type.link': 'Lien',
    'feedback.type.suggestion': 'Suggestion',
    'feedback.placeholder': 'Décrivez votre retour...',
    'feedback.hint.min': '10 caractères minimum',
    'feedback.url.placeholder': 'URL concernée (optionnel)',
    'feedback.email.placeholder': 'Votre email (optionnel)',
    'feedback.sending': 'Envoi...',
    'feedback.send': 'Envoyer',
    'feedback.error': 'Erreur lors de l\'envoi. Réessayez plus tard.',

    // App
    'app.error.analyze': 'Impossible d\'analyser cette URL. Vérifiez le lien et réessayez.',

    // Meta
    'meta.title': 'Download it - Téléchargez vos vidéos',
    'meta.description': 'Téléchargez des vidéos depuis YouTube, TikTok, Instagram, Twitter et plus encore. Gratuit et simple.',
  },
  en: {
    // Header
    'header.tagline': 'Download your videos and GIFs from any platform',

    // URL Input
    'input.placeholder': 'Paste your video link here...',
    'input.paste.tooltip': 'Paste from clipboard',
    'input.paste.button': 'Paste',
    'input.error.clipboard': 'Cannot access clipboard. Paste with Ctrl+V.',
    'input.error.url': 'URL must start with http:// or https://',
    'input.hint': 'Use the video\'s share link for best results',

    // Video Result
    'result.filename.label': 'File name',
    'result.filename.placeholder': 'File name...',
    'result.preparing': 'Preparing download...',

    // Format Selector
    'format.recommended': 'Recommended',
    'format.hide': 'Hide',
    'format.show': 'Show',
    'format.others': 'other formats',
    'format.download.gif': 'Download GIF',
    'format.download.short': 'Download Short',
    'format.download.clip': 'Download Clip',
    'format.download.audio': 'Download audio',
    'format.download.best': 'Download — Best quality',

    // Supported Platforms
    'platforms.title': 'Supported platforms',
    'platforms.subtitle': 'Videos, GIFs, Shorts, Clips and more',
    'platforms.more': '+ 1000 more',

    // Feedback
    'feedback.open': 'Send feedback',
    'feedback.title': 'Send feedback',
    'feedback.success': 'Thanks for your feedback!',
    'feedback.type.bug': 'Bug',
    'feedback.type.link': 'Link',
    'feedback.type.suggestion': 'Suggestion',
    'feedback.placeholder': 'Describe your feedback...',
    'feedback.hint.min': '10 characters minimum',
    'feedback.url.placeholder': 'Related URL (optional)',
    'feedback.email.placeholder': 'Your email (optional)',
    'feedback.sending': 'Sending...',
    'feedback.send': 'Send',
    'feedback.error': 'Failed to send. Please try again later.',

    // App
    'app.error.analyze': 'Unable to analyze this URL. Check the link and try again.',

    // Meta
    'meta.title': 'Download it - Download your videos',
    'meta.description': 'Download videos from YouTube, TikTok, Instagram, Twitter and more. Free and simple.',
  }
};

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private langSignal = signal<Lang>(this.getInitialLang());

  lang = this.langSignal.asReadonly();

  t = computed(() => {
    const currentLang = this.langSignal();
    return (key: string): string => {
      return TRANSLATIONS[currentLang][key] || key;
    };
  });

  switchLang(lang: Lang) {
    this.langSignal.set(lang);
    localStorage.setItem('downloadit-lang', lang);
    document.documentElement.lang = lang;
    document.title = this.t()(('meta.title'));
  }

  toggleLang() {
    this.switchLang(this.langSignal() === 'fr' ? 'en' : 'fr');
  }

  private getInitialLang(): Lang {
    const saved = localStorage.getItem('downloadit-lang') as Lang;
    if (saved && (saved === 'fr' || saved === 'en')) {
      return saved;
    }
    const browserLang = navigator.language.substring(0, 2);
    return browserLang === 'fr' ? 'fr' : 'en';
  }
}
