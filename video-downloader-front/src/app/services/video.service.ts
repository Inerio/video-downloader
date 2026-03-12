import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VideoInfo } from '../models/video-info.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class VideoService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getVideoInfo(url: string): Observable<VideoInfo> {
    return this.http.post<VideoInfo>(`${this.apiUrl}/video/info`, { url });
  }

  getDownloadUrl(url: string, formatId: string, filename?: string): string {
    let downloadUrl = `${this.apiUrl}/video/download?url=${encodeURIComponent(url)}&formatId=${encodeURIComponent(formatId)}`;
    if (filename) {
      downloadUrl += `&filename=${encodeURIComponent(filename)}`;
    }
    return downloadUrl;
  }
}
