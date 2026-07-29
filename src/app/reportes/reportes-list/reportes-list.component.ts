import { Component, OnInit } from '@angular/core';
import { Reporte } from '../../core/models/reporte.model';
import { ReportesService } from '../../core/services/reportes.service';
import { CondominiosService } from '../../core/services/condominios.service';
import { Condominio } from '../../core/models/condominio.model';

@Component({ selector: 'app-reportes-list', standalone: false, templateUrl: './reportes-list.component.html', styleUrls: ['./reportes-list.component.scss'] })
export class ReportesListComponent implements OnInit {
  reportes: Reporte[] = [];
  filteredReportes: Reporte[] = [];
  isCreateModalOpen = false;
  searchTerm = '';
  condominios: Condominio[] = [];
  constructor(private reportesService: ReportesService, private condominiosService: CondominiosService) {}
  ngOnInit(): void {
    this.reportesService.getAll().subscribe({ next: data => { this.reportes = data; this.filteredReportes = data; } });
    this.condominiosService.getAll().subscribe({ next: data => this.condominios = data });
  }
  onSearch(term: string): void { this.searchTerm = term; this.applyFilter(); }
  openCreateModal(): void { this.isCreateModalOpen = true; }
  closeCreateModal(): void { this.isCreateModalOpen = false; }
  handleCreateReporte(payload: Record<string, unknown>): void {
    const condominioId = Number(payload['condominioId']);
    const condominio = this.condominios.find(item => item.id === condominioId);
    const reporte: Partial<Reporte> = { condominioId, prioridad: (payload['prioridad'] as Reporte['prioridad']) || 'Alta', problema: String(payload['concepto'] || ''), condominio: condominio?.nombre || '', estado: (payload['estado'] as Reporte['estado']) || 'En proceso' };
    this.reportesService.create(reporte).subscribe({ next: () => { this.ngOnInit(); this.closeCreateModal(); } });
  }
  getPriorityClass(priority: Reporte['prioridad']): string { return `badge badge--${priority.toLowerCase()}`; }
  getStateClass(state: Reporte['estado']): string { return `badge badge--state-${state.replace(/\s+/g, '-').toLowerCase()}`; }
  private applyFilter(): void { const term = this.searchTerm.trim().toLowerCase(); this.filteredReportes = !term ? this.reportes : this.reportes.filter(r => [r.prioridad, r.fecha, r.problema, r.condominio, r.estado].some(v => String(v || '').toLowerCase().includes(term))); }
}
