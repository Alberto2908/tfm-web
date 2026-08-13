export interface AgentRunResult {
  discoveredName: string | null;
  reviewedCount: number;
}

export interface NvdCheckResult {
  added: number;
  checkedFrom: string;
  checkedTo: string;
}
