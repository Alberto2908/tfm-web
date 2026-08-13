import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardStats } from '../interfaces/dashboard-stats';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly apiUrl = `${environment.BACKEND_URL}/api/dashboard`;

  constructor(private http: HttpClient) {}

  obtenerEstadisticas(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/stats`, {
      withCredentials: true,
    });
  }

  exportarPdf(): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiUrl}/export`, {
      responseType: 'blob',
      observe: 'response',
      withCredentials: true,
    });
  }
}
