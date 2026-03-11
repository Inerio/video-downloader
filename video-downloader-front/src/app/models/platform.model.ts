export interface PlatformInfo {
  name: string;
  label: string;
  color: string;
  icon: string;
}

export const PLATFORMS: Record<string, PlatformInfo> = {
  youtube: { name: 'youtube', label: 'YouTube', color: '#FF0000', icon: 'fab fa-youtube' },
  tiktok: { name: 'tiktok', label: 'TikTok', color: '#000000', icon: 'fab fa-tiktok' },
  instagram: { name: 'instagram', label: 'Instagram', color: '#E4405F', icon: 'fab fa-instagram' },
  twitter: { name: 'twitter', label: 'Twitter / X', color: '#000000', icon: 'fab fa-x-twitter' },
  facebook: { name: 'facebook', label: 'Facebook', color: '#1877F2', icon: 'fab fa-facebook' },
  reddit: { name: 'reddit', label: 'Reddit', color: '#FF4500', icon: 'fab fa-reddit' },
  vimeo: { name: 'vimeo', label: 'Vimeo', color: '#1AB7EA', icon: 'fab fa-vimeo-v' },
  dailymotion: { name: 'dailymotion', label: 'Dailymotion', color: '#0066DC', icon: 'fab fa-dailymotion' },
  twitch: { name: 'twitch', label: 'Twitch', color: '#9146FF', icon: 'fab fa-twitch' },
  pinterest: { name: 'pinterest', label: 'Pinterest', color: '#E60023', icon: 'fab fa-pinterest' },
  snapchat: { name: 'snapchat', label: 'Snapchat', color: '#FFFC00', icon: 'fab fa-snapchat' },
  linkedin: { name: 'linkedin', label: 'LinkedIn', color: '#0A66C2', icon: 'fab fa-linkedin' },
  unknown: { name: 'unknown', label: 'Autre', color: '#6B7280', icon: 'fas fa-video' },
};

const PLATFORM_PATTERNS: [RegExp, string][] = [
  [/(youtube\.com|youtu\.be)/, 'youtube'],
  [/tiktok\.com/, 'tiktok'],
  [/instagram\.com/, 'instagram'],
  [/(x\.com|twitter\.com)/, 'twitter'],
  [/(facebook\.com|fb\.watch)/, 'facebook'],
  [/reddit\.com/, 'reddit'],
  [/vimeo\.com/, 'vimeo'],
  [/dailymotion\.com/, 'dailymotion'],
  [/(twitch\.tv|clips\.twitch\.tv)/, 'twitch'],
  [/pinterest\.com/, 'pinterest'],
  [/snapchat\.com/, 'snapchat'],
  [/linkedin\.com/, 'linkedin'],
];

export function detectPlatform(url: string): string {
  for (const [pattern, name] of PLATFORM_PATTERNS) {
    if (pattern.test(url)) return name;
  }
  return 'unknown';
}

export function getPlatformInfo(name: string): PlatformInfo {
  return PLATFORMS[name] || PLATFORMS['unknown'];
}
