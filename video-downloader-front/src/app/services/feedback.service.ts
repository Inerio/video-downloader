import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface FeedbackRequest {
  type: 'BUG' | 'LINK' | 'SUGGESTION';
  message: string;
  url?: string;
  email?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private apiUrl = `${environment.apiUrl}/feedback`;

  constructor(private http: HttpClient) {}

  sendFeedback(data: FeedbackRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(this.apiUrl, data);
  }
}
