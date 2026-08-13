import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpResponse } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { ChartConfiguration, ChartData, TooltipItem } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzButtonModule } from 'ng-zorro-antd/button';
import Swal from 'sweetalert2';

import { DashboardService } from '../../service/dashboard.service';
import { ThemeService } from '../../services/theme.service';
import { DashboardStats, LatestVulnerability } from '../../interfaces/dashboard-stats';

interface StatTile {
  label: string;
  value: number;
  icon: string;
  colorVar: string;
}

const SEVERITY_ORDER = ['Crítica', 'Alta', 'Media', 'Baja', 'Informativa'];

const SEVERITY_COLORS: Record<string, string> = {
  Crítica: '#ef4444',
  Alta: '#f97316',
  Media: '#eab308',
  Baja: '#22c55e',
  Informativa: '#94a3b8',
};

const SEVERITY_TAG_COLORS: Record<string, string> = {
  Crítica: 'red',
  Alta: 'orange',
  Media: 'gold',
  Baja: 'green',
  Informativa: 'default',
};

const PALETTE = [
  '#00d4aa',
  '#7c3aed',
  '#f59e0b',
  '#3b82f6',
  '#ef4444',
  '#22c55e',
  '#eab308',
  '#ec4899',
  '#8b5cf6',
  '#14b8a6',
  '#f97316',
  '#94a3b8',
];

/**
 * Separador de miles manual: Intl.NumberFormat con locale 'es'/'es-ES' no
 * agrupa números de exactamente 4 cifras (p.ej. 9303 -> "9303" pero
 * 14303 -> "14.303"), por el `minimumGroupingDigits` de esa locale en el CLDR.
 */
export function formatNumberEs(value: number): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    BaseChartDirective,
    NzCardModule,
    NzGridModule,
    NzSpinModule,
    NzEmptyModule,
    NzIconModule,
    NzTagModule,
    NzButtonModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  isLoading = true;
  hasError = false;
  isExporting = false;
  stats: DashboardStats | null = null;

  statTiles: StatTile[] = [];
  latestVulnerability: LatestVulnerability | null = null;

  severityChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  categoryChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  yearChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  frameworksChartData: ChartData<'bar'> = { labels: [], datasets: [] };

  doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {};
  horizontalBarOptions: ChartConfiguration<'bar'>['options'] = {};
  verticalBarOptions: ChartConfiguration<'bar'>['options'] = {};

  readonly formatNumber = formatNumberEs;

  private destroy$ = new Subject<void>();

  constructor(
    private dashboardService: DashboardService,
    private themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    this.buildChartOptions();
    this.loadStats();

    this.themeService.theme$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.buildChartOptions();
        if (this.stats) {
          this.buildCharts(this.stats);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get totalByYearEntries(): number {
    return this.stats ? Object.keys(this.stats.byYear).length : 0;
  }

  getSeverityTagColor(severity: string): string {
    return SEVERITY_TAG_COLORS[severity] ?? 'default';
  }

  exportPdf(): void {
    if (this.isExporting) return;

    this.isExporting = true;
    this.dashboardService.exportarPdf().subscribe({
      next: (response) => {
        this.isExporting = false;
        if (!response.body) {
          this.showExportError();
          return;
        }
        this.downloadFile(response.body, this.resolveFilename(response));
      },
      error: () => {
        this.isExporting = false;
        this.showExportError();
      },
    });
  }

  private showExportError(): void {
    void Swal.fire({
      icon: 'error',
      title: 'Error al exportar',
      text: 'No se pudo generar el PDF del dashboard. Por favor, inténtalo de nuevo.',
    });
  }

  /** Usa el nombre que envía el servidor y, si no llega, lo compone en cliente. */
  private resolveFilename(response: HttpResponse<Blob>): string {
    const disposition = response.headers.get('content-disposition') ?? '';

    const encoded = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
    if (encoded) {
      return decodeURIComponent(encoded[1].trim());
    }

    const plain = /filename="?([^";]+)"?/i.exec(disposition);
    if (plain) {
      return plain[1].trim();
    }

    return 'dashboard.pdf';
  }

  private downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  private loadStats(): void {
    this.isLoading = true;
    this.hasError = false;

    this.dashboardService.obtenerEstadisticas().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.latestVulnerability = stats.latestVulnerability;
        this.buildStatTiles(stats);
        this.buildCharts(stats);
        this.isLoading = false;
      },
      error: () => {
        this.hasError = true;
        this.isLoading = false;
      },
    });
  }

  private buildStatTiles(stats: DashboardStats): void {
    this.statTiles = [
      {
        label: 'Vulnerabilidades totales',
        value: stats.totalVulnerabilities,
        icon: 'database',
        colorVar: 'var(--tfm-primary)',
      },
      {
        label: 'Añadidas últimos 7 días',
        value: stats.addedLast7Days,
        icon: 'calendar',
        colorVar: 'var(--tfm-success)',
      },
      {
        label: 'Añadidas último mes',
        value: stats.addedLast30Days,
        icon: 'clock-circle',
        colorVar: 'var(--tfm-warning)',
      },
    ];
  }

  private buildCharts(stats: DashboardStats): void {
    // Severidad
    const severityLabels = SEVERITY_ORDER.filter(
      (s) => stats.bySeverity[s] !== undefined,
    );
    Object.keys(stats.bySeverity).forEach((key) => {
      if (!severityLabels.includes(key)) severityLabels.push(key);
    });
    this.severityChartData = {
      labels: severityLabels,
      datasets: [
        {
          data: severityLabels.map((label) => stats.bySeverity[label] ?? 0),
          backgroundColor: severityLabels.map(
            (label) => SEVERITY_COLORS[label] ?? '#94a3b8',
          ),
          borderWidth: 0,
        },
      ],
    };

    // Categoría (top 10 por volumen)
    const categoryEntries = Object.entries(stats.byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    this.categoryChartData = {
      labels: categoryEntries.map(([name]) => name),
      datasets: [
        {
          label: 'Vulnerabilidades',
          data: categoryEntries.map(([, count]) => count),
          backgroundColor: categoryEntries.map(
            (_, i) => PALETTE[i % PALETTE.length],
          ),
          borderRadius: 6,
        },
      ],
    };

    // Por año de publicación
    const yearEntries = Object.entries(stats.byYear).sort(
      (a, b) => Number(a[0]) - Number(b[0]),
    );
    this.yearChartData = {
      labels: yearEntries.map(([year]) => year),
      datasets: [
        {
          label: 'CVEs publicados',
          data: yearEntries.map(([, count]) => count),
          backgroundColor: '#00d4aa',
          borderRadius: 4,
        },
      ],
    };

    // Top frameworks
    const frameworks = stats.topFrameworks.slice(0, 10);
    this.frameworksChartData = {
      labels: frameworks.map((f) => f.name),
      datasets: [
        {
          label: 'Vulnerabilidades',
          data: frameworks.map((f) => f.count),
          backgroundColor: frameworks.map((_, i) => PALETTE[i % PALETTE.length]),
          borderRadius: 6,
        },
      ],
    };
  }

  private buildChartOptions(): void {
    const isDark = this.themeService.isDark();
    const textColor = isDark ? '#d6d3d1' : '#44403c';
    const gridColor = isDark
      ? 'rgba(250, 250, 249, 0.08)'
      : 'rgba(28, 25, 23, 0.08)';

    const doughnutTooltipLabel = (ctx: TooltipItem<'doughnut'>): string => {
      const value = typeof ctx.parsed === 'number' ? ctx.parsed : 0;
      return `${ctx.label}: ${formatNumberEs(value)}`;
    };

    // indexAxis:'y' (barras horizontales) -> el valor real está en parsed.x,
    // no en parsed.y (que ahí representa la posición de la categoría, un
    // número también, por lo que un check por "typeof === number" elegía
    // el eje equivocado y mostraba la posición en vez del recuento real).
    const horizontalBarTooltipLabel = (ctx: TooltipItem<'bar'>): string =>
      formatNumberEs(ctx.parsed.x ?? 0);

    const verticalBarTooltipLabel = (ctx: TooltipItem<'bar'>): string =>
      formatNumberEs(ctx.parsed.y ?? 0);

    this.doughnutOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: textColor, boxWidth: 12, padding: 16 },
        },
        tooltip: { callbacks: { label: doughnutTooltipLabel } },
      },
    };

    this.horizontalBarOptions = {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: horizontalBarTooltipLabel } },
      },
      scales: {
        x: {
          ticks: {
            color: textColor,
            precision: 0,
            callback: (value) => formatNumberEs(Number(value)),
          },
          grid: { color: gridColor },
        },
        y: {
          ticks: { color: textColor },
          grid: { display: false },
        },
      },
    };

    this.verticalBarOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: verticalBarTooltipLabel } },
      },
      scales: {
        x: {
          ticks: { color: textColor },
          grid: { display: false },
        },
        y: {
          ticks: {
            color: textColor,
            precision: 0,
            callback: (value) => formatNumberEs(Number(value)),
          },
          grid: { color: gridColor },
        },
      },
    };
  }
}
