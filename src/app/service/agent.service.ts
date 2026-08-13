import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AgentRunResult, NvdCheckResult } from '../interfaces/agent-run-result';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AgentService {
  private readonly agentUrl = `${environment.BACKEND_URL}/api/agent`;
  private readonly nvdUrl = `${environment.BACKEND_URL}/api/nvd`;

  constructor(private http: HttpClient) {}

  /** Ejecuta un ciclo completo del agente (descubrir + verificar + sanear). Solo admin. */
  runAgentCycle(): Observable<AgentRunResult> {
    return this.http.post<AgentRunResult>(
      `${this.agentUrl}/run`,
      {},
      { withCredentials: true },
    );
  }

  /** Comprueba en NVD si hay CVEs publicados desde la última importación conocida. Solo admin. */
  checkNvdUpdates(): Observable<NvdCheckResult> {
    return this.http.post<NvdCheckResult>(
      `${this.nvdUrl}/check-updates`,
      {},
      { withCredentials: true },
    );
  }
}
