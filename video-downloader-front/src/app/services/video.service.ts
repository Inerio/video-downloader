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

  startDownload(url: string, formatId: string): Observable<{ taskId: string }> {
    return this.http.post<{ taskId: string }>(
      `${this.apiUrl}/video/download/start`,
      null,
      { params: { url, formatId } }
    );
  }

  getProgressUrl(taskId: string): string {
    return `${this.apiUrl}/video/download/${taskId}/progress`;
  }

  getTaskFileUrl(taskId: string, filename?: string): string {
    let url = `${this.apiUrl}/video/download/${taskId}/file`;
    if (filename) {
      url += `?filename=${encodeURIComponent(filename)}`;
    }
    return url;
  }
}
