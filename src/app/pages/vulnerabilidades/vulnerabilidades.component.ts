import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';

import Swal from 'sweetalert2';

import { Vulnerability } from '../../interfaces/vulnerability';
import { VulnerabilityFilter } from '../../interfaces/vulnerability-filter';
import {
  ExportFormat,
  VulnerabilityService,
} from '../../service/vulnerability.service';

type SortOrder = string | null;

interface FilterForm {
  q: string;
  name: string;
  severity: string[];
  category: string | null;
  framework: string;
  endpoint: string;
  dateRange: (Date | null)[] | null;
}

@Component({
  selector: 'app-vulnerabilidades',
  imports: [
    CommonModule,
    FormsModule,
    NzTableModule,
    NzTagModule,
    NzButtonModule,
    NzIconModule,
    NzCardModule,
    NzInputModule,
    NzSelectModule,
    NzSpinModule,
    NzModalModule,
    NzDatePickerModule,
  ],
  templateUrl: './vulnerabilidades.component.html',
  styleUrls: ['./vulnerabilidades.component.css'],
})
export class VulnerabilidadesComponent implements OnInit {
  vulnerabilidades: Vulnerability[] = [];
  pageIndexVulnerabilidad = 1;
  pageSizeVulnerabilidad = 25;
  totalVulnerabilidad = 0;
  pageInputDraft: number | null = null;
  isLoading = false;
  filtersExpanded = false;
  searchExecuted = false;
  isDetailModalVisible = false;
  selectedVulnerability: Vulnerability | null = null;
  isExportModalVisible = false;
  isExporting = false;
  exportFormat: ExportFormat = 'json';

  // Por defecto, más recientes primero
  sortKeyVulnerabilidad: string | null = 'createdAt';
  sortValueVulnerabilidad: SortOrder = 'descend';

  readonly pageSizeOptions = [25, 50, 100];

  readonly exportFormatOptions: {
    value: ExportFormat;
    label: string;
    hint: string;
  }[] = [
    { value: 'json', label: 'JSON', hint: 'Estructurado, ideal para integrar con otras herramientas' },
    { value: 'xml', label: 'XML', hint: 'Estructurado, compatible con sistemas heredados' },
    { value: 'csv', label: 'CSV', hint: 'Tabla para Excel, Google Sheets o análisis de datos' },
    { value: 'pdf', label: 'PDF', hint: 'Informe con una ficha por vulnerabilidad, listo para imprimir' },
  ];

  filters: FilterForm = {
    q: '',
    name: '',
    severity: [],
    category: null,
    framework: '',
    endpoint: '',
    dateRange: null,
  };

  readonly severityOptions = [
    'Crítica',
    'Alta',
    'Media',
    'Baja',
    'Informativa',
  ];

  readonly categoryOptions = [
    'Injection',
    'XSS',
    'CSRF',
    'Authentication',
    'Authorization',
    'Data Exposure',
    'DoS',
    'Other',
  ];

  severityColors: Record<string, string> = {
    Crítica: 'red',
    Alta: 'orange',
    Media: 'gold',
    Baja: 'green',
    Informativa: 'default',
  };

  /**
   * Anchos fijos por columna, en el mismo orden que las <th> de la tabla.
   * En table-layout:auto el navegador ignora min/max-width cuando el
   * contenido "quiere" más espacio; nzWidthConfig es el mecanismo de
   * ng-zorro que sí fuerza el ancho real de cada columna.
   */
  readonly columnWidths = [
    '130px', // Nombre
    '190px', // Descripción
    '145px', // Severidad (la etiqueta "Informativa" necesita ~123px + padding)
    '100px', // Categoría
    '110px', // Framework
    '120px', // Endpoint
    '115px', // Payload
    '170px', // Impacto
    '170px', // Mitigación
    '120px', // URL
    '100px', // Fecha
  ];

  constructor(private vulnerabilityService: VulnerabilityService) {}

  ngOnInit(): void {
    this.loadVulnerabilidades();
  }

  get hasActiveFilters(): boolean {
    return !!(
      this.filters.q.trim() ||
      this.filters.name.trim() ||
      this.filters.severity.length ||
      this.filters.category ||
      this.filters.framework.trim() ||
      this.filters.endpoint.trim() ||
      this.filters.dateRange?.[0] ||
      this.filters.dateRange?.[1]
    );
  }

  get totalPages(): number {
    if (this.totalVulnerabilidad <= 0) return 0;
    return Math.ceil(this.totalVulnerabilidad / this.pageSizeVulnerabilidad);
  }

  get canGoPrev(): boolean {
    return this.pageIndexVulnerabilidad > 1;
  }

  get canGoNext(): boolean {
    return this.totalPages > 0 && this.pageIndexVulnerabilidad < this.totalPages;
  }

  getSeverityColor(severity: string): string {
    return this.severityColors[severity] || 'default';
  }

  /** Dominio legible para la tabla; la URL completa va en title / modal. */
  getUrlHost(url: string): string {
    if (!url) return '';
    try {
      const host = new URL(url).hostname.replace(/^www\./i, '');
      return host || url;
    } catch {
      return url.replace(/^https?:\/\//i, '').split('/')[0] || url;
    }
  }

  openDetail(item: Vulnerability): void {
    this.selectedVulnerability = item;
    this.isDetailModalVisible = true;
  }

  closeDetail(): void {
    this.isDetailModalVisible = false;
    this.selectedVulnerability = null;
  }

  onRowKeydown(event: KeyboardEvent, item: Vulnerability): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openDetail(item);
    }
  }

  onSortVulnerabilidad(key: string, order: SortOrder): void {
    this.sortKeyVulnerabilidad = order ? key : null;
    this.sortValueVulnerabilidad = order;
    this.pageIndexVulnerabilidad = 1;
    this.loadVulnerabilidades();
  }

  goToPrevPage(): void {
    if (!this.canGoPrev) return;
    this.onPageIndexChange(this.pageIndexVulnerabilidad - 1);
  }

  goToNextPage(): void {
    if (!this.canGoNext) return;
    this.onPageIndexChange(this.pageIndexVulnerabilidad + 1);
  }

  onPageIndexChange(pageIndex: number): void {
    this.pageIndexVulnerabilidad = pageIndex;
    this.pageInputDraft = null;
    this.loadVulnerabilidades();
  }

  commitPageInput(): void {
    const draft = this.pageInputDraft;
    this.pageInputDraft = null;

    if (draft === null || draft === undefined || Number.isNaN(Number(draft))) {
      return;
    }

    const max = Math.max(this.totalPages, 1);
    const next = Math.min(Math.max(1, Math.trunc(Number(draft))), max);

    if (next === this.pageIndexVulnerabilidad) {
      return;
    }

    this.onPageIndexChange(next);
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSizeVulnerabilidad = pageSize;
    this.pageIndexVulnerabilidad = 1;
    this.pageInputDraft = null;
    this.loadVulnerabilidades();
  }

  applyFilters(): void {
    this.searchExecuted = true;
    this.pageIndexVulnerabilidad = 1;
    this.loadVulnerabilidades();
  }

  clearFilters(): void {
    this.filters = {
      q: '',
      name: '',
      severity: [],
      category: null,
      framework: '',
      endpoint: '',
      dateRange: null,
    };
    this.searchExecuted = false;
    this.pageIndexVulnerabilidad = 1;
    this.loadVulnerabilidades();
  }

  toggleFilters(): void {
    this.filtersExpanded = !this.filtersExpanded;
  }

  onFilterKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.applyFilters();
    }
  }

  private buildFilterPayload(): VulnerabilityFilter {
    const [dateFrom, dateTo] = this.filters.dateRange ?? [null, null];
    return {
      verified: true,
      q: this.filters.q.trim() || undefined,
      name: this.filters.name.trim() || undefined,
      severity: this.filters.severity.length ? this.filters.severity : undefined,
      category: this.filters.category || undefined,
      framework: this.filters.framework.trim() || undefined,
      endpoint: this.filters.endpoint.trim() || undefined,
      dateFrom: dateFrom ? this.toIsoDate(dateFrom) : undefined,
      dateTo: dateTo ? this.toIsoDate(dateTo) : undefined,
    };
  }

  /** Fecha local en yyyy-MM-dd, sin desplazamiento por zona horaria (a diferencia de toISOString). */
  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private loadVulnerabilidades(): void {
    this.isLoading = true;
    const payload = this.buildFilterPayload();

    const sortBy = this.sortKeyVulnerabilidad ?? undefined;
    const sortDirection = this.sortValueVulnerabilidad === 'descend' ? 'desc' : 'asc';

    this.vulnerabilityService
      .filtrar(
        payload,
        this.pageIndexVulnerabilidad - 1,
        this.pageSizeVulnerabilidad,
        sortBy,
        sortBy ? sortDirection : undefined,
      )
      .subscribe({
        next: (response) => {
          this.vulnerabilidades = response.content;
          this.totalVulnerabilidad = response.totalElements;

          const maxPage =
            response.totalElements <= 0
              ? 1
              : Math.ceil(response.totalElements / this.pageSizeVulnerabilidad);

          if (
            response.totalElements > 0 &&
            this.pageIndexVulnerabilidad > maxPage
          ) {
            this.pageIndexVulnerabilidad = maxPage;
            this.loadVulnerabilidades();
            return;
          }

          if (response.totalElements === 0) {
            this.pageIndexVulnerabilidad = 1;
          }

          this.isLoading = false;
        },
        error: () => {
          // No poner el total a 0: dejaría el pager en "página N de 0".
          this.vulnerabilidades = [];
          this.isLoading = false;
          if (this.totalPages > 0 && this.pageIndexVulnerabilidad > this.totalPages) {
            this.pageIndexVulnerabilidad = this.totalPages;
          } else if (this.totalPages === 0) {
            this.pageIndexVulnerabilidad = 1;
          }
        },
      });
  }

  openExportModal(): void {
    this.isExportModalVisible = true;
  }

  closeExportModal(): void {
    if (this.isExporting) return;
    this.isExportModalVisible = false;
  }

  confirmExport(): void {
    if (this.isExporting) return;

    this.isExporting = true;
    const format = this.exportFormat;
    const sortBy = this.sortKeyVulnerabilidad ?? undefined;
    const sortDirection =
      this.sortValueVulnerabilidad === 'descend' ? 'desc' : 'asc';

    this.vulnerabilityService
      .exportar(
        this.buildFilterPayload(),
        format,
        sortBy,
        sortBy ? sortDirection : undefined,
      )
      .subscribe({
        next: (response) => {
          this.isExporting = false;
          if (!response.body) {
            this.showExportError();
            return;
          }
          this.downloadFile(response.body, this.resolveFilename(response, format));
          this.isExportModalVisible = false;
        },
        error: (error) => {
          this.isExporting = false;
          this.showExportError();
          console.error('Error exporting vulnerabilities:', error);
        },
      });
  }

  private showExportError(): void {
    void Swal.fire({
      icon: 'error',
      title: 'Error al exportar',
      text: 'No se pudo generar el fichero. Por favor, inténtalo de nuevo.',
    });
  }

  /** Usa el nombre que envía el servidor y, si no llega, lo compone en cliente. */
  private resolveFilename(
    response: HttpResponse<Blob>,
    format: ExportFormat,
  ): string {
    const disposition = response.headers.get('content-disposition') ?? '';

    const encoded = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
    if (encoded) {
      return decodeURIComponent(encoded[1].trim());
    }

    const plain = /filename="?([^";]+)"?/i.exec(disposition);
    if (plain) {
      return plain[1].trim();
    }

    return `vulnerabilidades_${this.getTimestamp()}.${format}`;
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

  private getTimestamp(): string {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  }
}
