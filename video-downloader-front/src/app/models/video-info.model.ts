export interface VideoFormat {
  formatId: string;
  quality: string;
  extension: string;
  filesize: number | null;
  resolution: string | null;
  hasAudio: boolean;
  hasVideo: boolean;
  note: string;
}

export interface VideoInfo {
  title: string;
  thumbnail: string | null;
  duration: string;
  platform: string;
  uploader: string | null;
  contentType: string;
  formats: VideoFormat[];
}

export interface DownloadProgress {
  status: 'pending' | 'downloading' | 'merging' | 'complete' | 'error';
  percent: number;
  speed: string;
  eta: string;
  error: string | null;
  downloadPass: number;
  phase: string;
  isMergeFormat: boolean;
}
