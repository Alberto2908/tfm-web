import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';

import { Vulnerability } from '../../interfaces/vulnerability';
import { VulnerabilityService } from '../../service/vulnerability.service';
import { AuthService } from '../../service/auth.service';
import { AgentService } from '../../service/agent.service';
import Swal from 'sweetalert2';

type SortOrder = string | null;

@Component({
  selector: 'app-verificar',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzTableModule,
    NzTagModule,
    NzButtonModule,
    NzIconModule,
    NzCardModule,
    NzPaginationModule,
    NzModalModule,
    NzFormModule,
    NzGridModule,
    NzSelectModule,
    NzInputModule,
  ],
  templateUrl: './verificar.component.html',
  styleUrls: ['./verificar.component.css'],
})
export class VerificarComponent implements OnInit {
  vulnerabilidades: Vulnerability[] = [];
  pageIndexVulnerabilidad = 1;
  pageSizeVulnerabilidad = 10;
  totalVulnerabilidad = 0;

  sortKeyVulnerabilidad: string | null = null;
  sortValueVulnerabilidad: SortOrder = null;

  severityColors: Record<string, string> = {
    Crítica: 'red',
    Alta: 'orange',
    Media: 'gold',
    Baja: 'green',
    Informativa: 'default',
  };

  // Modal de edición
  isEditModalVisible = false;
  editForm!: FormGroup;
  editingId: string | null = null;

  // Herramientas de administrador (agente IA / comprobación NVD)
  isRunningAgent = false;
  isCheckingNvd = false;

  constructor(
    private vulnerabilityService: VulnerabilityService,
    private authService: AuthService,
    private agentService: AgentService,
    private fb: FormBuilder,
  ) {
    this.editForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      severity: ['', Validators.required],
      category: ['', Validators.required],
      framework: ['', Validators.required],
      affectedEndpoint: ['', Validators.required],
      payloadExample: [''],
      impact: ['', Validators.required],
      mitigation: ['', Validators.required],
      referenceURL: [''],
    });
  }

  ngOnInit(): void {
    this.loadPendientes();
  }

  getSeverityColor(severity: string): string {
    return this.severityColors[severity] || 'default';
  }

  openReference(url: string): void {
    window.open(url, '_blank');
  }

  runAgentNow(): void {
    if (this.isRunningAgent) return;

    this.isRunningAgent = true;
    this.agentService.runAgentCycle().subscribe({
      next: (result) => {
        this.isRunningAgent = false;
        const discoveredText = result.discoveredName
          ? `Nueva vulnerabilidad descubierta: ${result.discoveredName}.`
          : 'No se ha descubierto ninguna vulnerabilidad nueva en este ciclo.';
        void Swal.fire({
          icon: 'success',
          title: 'Agente ejecutado',
          html: `${discoveredText}<br>Propuestas revisadas: ${result.reviewedCount}.`,
        });
        this.loadPendientes();
      },
      error: (error) => {
        this.isRunningAgent = false;
        void Swal.fire({
          icon: 'error',
          title: 'No se pudo ejecutar el agente',
          text:
            error.status === 404
              ? 'El agente de IA no está activado en el servidor (agents.enabled=false o falta la API key).'
              : 'Ha ocurrido un error inesperado. Inténtalo de nuevo más tarde.',
        });
      },
    });
  }

  checkNvdUpdates(): void {
    if (this.isCheckingNvd) return;

    this.isCheckingNvd = true;
    this.agentService.checkNvdUpdates().subscribe({
      next: (result) => {
        this.isCheckingNvd = false;
        void Swal.fire({
          icon: 'success',
          title: 'Comprobación de NVD completada',
          text:
            result.added > 0
              ? `Se han añadido ${result.added} nuevas vulnerabilidades publicadas desde la última comprobación.`
              : 'No hay vulnerabilidades nuevas desde la última comprobación.',
        });
      },
      error: () => {
        this.isCheckingNvd = false;
        void Swal.fire({
          icon: 'error',
          title: 'No se pudo comprobar NVD',
          text: 'Ha ocurrido un error al consultar el National Vulnerability Database. Inténtalo de nuevo más tarde.',
        });
      },
    });
  }

  onSortVulnerabilidad(key: string, order: SortOrder): void {
    this.sortKeyVulnerabilidad = order ? key : null;
    this.sortValueVulnerabilidad = order;
    this.pageIndexVulnerabilidad = 1;
    this.loadPendientes();
  }

  onPageIndexChange(pageIndex: number): void {
    this.pageIndexVulnerabilidad = pageIndex;
    this.loadPendientes();
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSizeVulnerabilidad = pageSize;
    this.pageIndexVulnerabilidad = 1;
    this.loadPendientes();
  }

  private loadPendientes(): void {
    const sortBy = this.sortKeyVulnerabilidad ?? undefined;
    const sortDirection = this.sortValueVulnerabilidad === 'descend' ? 'desc' : 'asc';

    this.vulnerabilityService
      .filtrar(
        { verified: false },
        this.pageIndexVulnerabilidad - 1,
        this.pageSizeVulnerabilidad,
        sortBy,
        sortBy ? sortDirection : undefined,
      )
      .subscribe((response) => {
        // Si tras verificar/eliminar la página actual se queda vacía (y no es
        // la primera), retrocede una página en vez de mostrar una tabla vacía.
        if (response.content.length === 0 && this.pageIndexVulnerabilidad > 1) {
          this.pageIndexVulnerabilidad--;
          this.loadPendientes();
          return;
        }
        this.vulnerabilidades = response.content;
        this.totalVulnerabilidad = response.totalElements;
      });
  }

  showEditVulnerabilidad(vulnerabilidad: any): void {
    const current = this.vulnerabilidades.find(
      (v) => v.id === vulnerabilidad?.id,
    );
    if (!current) return;

    this.editingId = current.id;
    this.editForm.patchValue({
      name: current.name,
      description: current.description,
      severity: current.severity,
      category: current.category,
      framework: current.framework,
      affectedEndpoint: current.affectedEndpoint,
      payloadExample: current.payloadExample,
      impact: current.impact,
      mitigation: current.mitigation,
      referenceURL: current.referenceURL,
    });
    this.isEditModalVisible = true;
  }

  handleEditOk(): void {
    if (this.editForm.invalid || !this.editingId) return;

    const current = this.vulnerabilidades.find(
      (v) => v.id === this.editingId,
    );
    if (!current) return;

    const updated: Vulnerability = {
      ...current,
      ...this.editForm.value,
      verified: false,
    };

    this.vulnerabilityService.actualizar(this.editingId, updated).subscribe({
      next: () => {
        this.isEditModalVisible = false;
        this.loadPendientes();
        void Swal.fire({
          icon: 'success',
          title: 'Guardado',
          timer: 1400,
          showConfirmButton: false,
        });
      },
      error: () => {
        void Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo actualizar la vulnerabilidad',
        });
      },
    });
  }

  handleEditCancel(): void {
    this.isEditModalVisible = false;
    this.editForm.reset();
    this.editingId = null;
  }

  verificarVulnerabilidad(vulnerabilidad: any): void {
    const id = vulnerabilidad?.id as string | undefined;
    if (!id) return;

    const adminUsername = this.authService.getCurrentUser()?.username;
    if (!adminUsername) {
      void Swal.fire({
        icon: 'error',
        title: 'No autenticado',
        text: 'Necesitas iniciar sesión para verificar vulnerabilidades.',
      });
      return;
    }

    void Swal.fire({
      icon: 'question',
      title: 'Verificar vulnerabilidad',
      text: '¿Quieres marcar esta vulnerabilidad como verificada?',
      showCancelButton: true,
      confirmButtonText: 'Verificar',
      cancelButtonText: 'Cancelar',
    }).then((res) => {
      if (!res.isConfirmed) return;

      this.vulnerabilityService.verificar(id, adminUsername).subscribe({
        next: () => {
          this.loadPendientes();
          void Swal.fire({
            icon: 'success',
            title: 'Verificada',
            timer: 1200,
            showConfirmButton: false,
          });
        },
        error: () => {
          void Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo verificar la vulnerabilidad.',
          });
        },
      });
    });
  }

  eliminarVulnerabilidad(id: string): void {
    if (!id) return;

    void Swal.fire({
      icon: 'warning',
      title: 'Eliminar vulnerabilidad',
      text: 'Esta acción no se puede deshacer.',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
    }).then((res) => {
      if (!res.isConfirmed) return;

      this.vulnerabilityService.eliminar(id).subscribe({
        next: () => {
          this.loadPendientes();
          void Swal.fire({
            icon: 'success',
            title: 'Eliminada',
            timer: 1200,
            showConfirmButton: false,
          });
        },
        error: () => {
          void Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo eliminar la vulnerabilidad.',
          });
        },
      });
    });
  }
}
