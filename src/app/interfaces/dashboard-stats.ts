export interface NameCount {
  name: string;
  count: number;
}

export interface LatestVulnerability {
  id: string;
  name: string;
  severity: string;
  category: string;
  description: string;
  createdAt: string;
  createdBy: string;
}

export interface DashboardStats {
  totalVulnerabilities: number;
  addedLast7Days: number;
  addedLast30Days: number;
  bySeverity: Record<string, number>;
  byCategory: Record<string, number>;
  byYear: Record<string, number>;
  topFrameworks: NameCount[];
  latestVulnerability: LatestVulnerability | null;
}
