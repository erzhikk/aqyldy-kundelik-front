import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface AiPlanRequestDto {
  attemptId: string;
  language?: string; // 'ru'|'kk'|'en'
}

export interface AiPlanResponse {
  weakTopics: {
    topicId: string;
    topicName: string;
    accuracy: number;
    mainMistake: string;
  }[];
  weeklyPlan: {
    day: number;
    focus: string;
    actions: string[];
    timeMinutes: number;
  }[];
  rules: string[];
  selfCheck: {
    question: string;
    answer: string;
  }[];
}

export interface AiPlanEnvelope {
  type: 'PLAN';
  attemptId?: string;
  topicId?: string;
  payload: AiPlanResponse;
  cached: boolean;
  createdAt: string;
}

export type AiPlanResult = AiPlanResponse & {
  cached?: boolean;
  createdAt?: string;
};

export interface AiTopicHelpRequestDto {
  language?: string;
  mode?: 'coach' | 'short' | 'practice';
}

export interface AiTopicHelpResponse {
  topic: {
    topicId: string;
    topicName: string;
  };
  mainError: string;
  explanation: string;
  examples: {
    question: string;
    solution: string;
  }[];
  practice: {
    question: string;
    answer: string;
  }[];
}

export interface AiTopicHelpEnvelope {
  type: 'TOPIC_HELP';
  attemptId?: string;
  topicId?: string;
  payload: AiTopicHelpResponse;
  cached: boolean;
  createdAt: string;
}

export type AiTopicHelpResult = AiTopicHelpResponse & {
  cached?: boolean;
  createdAt?: string;
};

@Injectable({
  providedIn: 'root'
})
export class AiCoachService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/student/ai`;

  generatePlan(req: AiPlanRequestDto): Observable<AiPlanResult> {
    return this.http.post<AiPlanEnvelope>(`${this.apiUrl}/plan`, req).pipe(
      map((response) => ({
        ...response.payload,
        cached: response.cached,
        createdAt: response.createdAt
      }))
    );
  }

  generateTopicHelp(
    attemptId: string,
    topicId: string,
    req: AiTopicHelpRequestDto = {}
  ): Observable<AiTopicHelpResult> {
    return this.http
      .post<AiTopicHelpEnvelope>(
        `${this.apiUrl}/attempts/${attemptId}/topics/${topicId}/help`,
        req
      )
      .pipe(
        map((response) => ({
          ...response.payload,
          cached: response.cached,
          createdAt: response.createdAt
        }))
      );
  }
}
