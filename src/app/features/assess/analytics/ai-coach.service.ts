import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface AiGeneratedDto {
  type: 'PLAN' | 'TOPIC_HELP';
  attemptId?: string;
  topicId?: string;
  content: string;
  cached: boolean;
  createdAt: string;
}

export interface AiPlanRequestDto {
  attemptId: string;
  language?: string; // 'ru'|'kk'|'en'
}

export interface AiTopicHelpRequestDto {
  language?: string;
  mode?: 'coach' | 'short' | 'practice';
}

@Injectable({
  providedIn: 'root'
})
export class AiCoachService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/student/ai`;

  generatePlan(req: AiPlanRequestDto): Observable<AiGeneratedDto> {
    return this.http.post<AiGeneratedDto>(`${this.apiUrl}/plan`, req);
  }

  generateTopicHelp(
    attemptId: string,
    topicId: string,
    req: AiTopicHelpRequestDto = {}
  ): Observable<AiGeneratedDto> {
    return this.http.post<AiGeneratedDto>(
      `${this.apiUrl}/attempts/${attemptId}/topics/${topicId}/help`,
      req
    );
  }
}
