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
  formats: VideoFormat[];
}
