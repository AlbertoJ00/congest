import { Component, OnDestroy, OnInit } from '@angular/core';
import { Reporte } from '../../core/models/reporte.model';
import { ReportesService } from '../../core/services/reportes.service';
import { CondominiosService } from '../../core/services/condominios.service';
import { Condominio } from '../../core/models/condominio.model';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-reportes-list',
  standalone: false,
  templateUrl: './reportes-list.component.html',
  styleUrls: ['./reportes-list.component.scss']
})
export class ReportesListComponent implements OnInit, OnDestroy {
  reportes: Reporte[] = [];
  filteredReportes: Reporte[] = [];
  isCreateModalOpen = false;
  searchTerm = '';
  condominios: Condominio[] = [];
  editable = false;
  errorMessage = '';
  estados: Reporte['estado'][] = ['Pendiente', 'En proceso', 'Asignado', 'Resuelto'];
  private refreshTimer?: ReturnType<typeof setInterval>;

  constructor(
    private reportesService: ReportesService,
    private condominiosService: CondominiosService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.editable = this.auth.hasRole('Administrador', 'Propietario');
    this.loadReportes();
    this.condominiosService.getAll().subscribe({ next: data => this.condominios = data });
    this.refreshTimer = setInterval(() => this.loadReportes(), 10000);
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }

  get canCreate(): boolean {
    return this.auth.hasRole('Administrador', 'Propietario', 'Inquilino');
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.applyFilter();
  }

  openCreateModal(): void { this.isCreateModalOpen = true; }
  closeCreateModal(): void { this.isCreateModalOpen = false; }

  handleCreateReporte(payload: Record<string, unknown>): void {
    const condominioId = Number(payload['condominioId']);
    const condominio = this.condominios.find(item => item.id === condominioId);
    const reporte: Partial<Reporte> = {
      condominioId,
      prioridad: (payload['prioridad'] as Reporte['prioridad']) || 'Alta',
      problema: String(payload['concepto'] || ''),
      condominio: condominio?.nombre || '',
      estado: (payload['estado'] as Reporte['estado']) || 'Pendiente'
    };
    this.reportesService.create(reporte).subscribe({
      next: () => { this.loadReportes(); this.closeCreateModal(); },
      error: error => this.errorMessage = error.error?.message || 'No se pudo crear el reporte.'
    });
  }

  getPriorityClass(priority: Reporte['prioridad']): string {
    return `badge badge--${priority.toLowerCase()}`;
  }

  getStateClass(state: Reporte['estado']): string {
    return `badge badge--state-${state.replace(/\s+/g, '-').toLowerCase()}`;
  }

  changeEstado(reporte: Reporte, nuevoEstado: Reporte['estado']): void {
    if (!this.editable || reporte.estado === nuevoEstado) return;
    this.reportesService.update(reporte.id, { estado: nuevoEstado }).subscribe({
      next: updated => {
        reporte.estado = updated.estado;
        this.applyFilter();
      },
      error: error => this.errorMessage = error.error?.message || 'No se pudo actualizar el estado.'
    });
  }

  private loadReportes(): void {
    this.reportesService.getAll().subscribe({
      next: data => {
        this.reportes = data;
        this.applyFilter();
      },
      error: error => this.errorMessage = error.error?.message || 'No se pudieron cargar los reportes.'
    });
  }

  private applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredReportes = !term
      ? this.reportes
      : this.reportes.filter(reporte => [
        reporte.prioridad, reporte.fecha, reporte.problema, reporte.condominio, reporte.estado
      ].some(value => String(value || '').toLowerCase().includes(term)));
  }
}
