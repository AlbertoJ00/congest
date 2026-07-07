import { Component, OnInit } from '@angular/core';

interface ReporteItem {
  id: number;
  prioridad: 'Alta' | 'Media' | 'Baja';
  fecha: string;
  problema: string;
  condominio: string;
  estado: 'En proceso' | 'Asignado' | 'Resuelto';
}

@Component({
  selector: 'app-reportes-list',
  standalone: false,
  templateUrl: './reportes-list.component.html',
  styleUrls: ['./reportes-list.component.scss']
})
export class ReportesListComponent implements OnInit {
  reportes: ReporteItem[] = [];
  filteredReportes: ReporteItem[] = [];
  isCreateModalOpen = false;
  searchTerm = '';

  ngOnInit(): void {
    this.reportes = [
      { id: 1, prioridad: 'Alta', fecha: '30/06/2026 10:24 AM', problema: 'Cobranza cuotas mantenimiento', condominio: 'Brisa del este #56', estado: 'En proceso' },
      { id: 2, prioridad: 'Media', fecha: '30/06/2026 10:24 AM', problema: 'Reparación bomba hidráulica', condominio: 'Brisa del este #56', estado: 'En proceso' },
      { id: 3, prioridad: 'Media', fecha: '30/06/2026 10:24 AM', problema: 'Cobranza cuotas mantenimiento', condominio: 'Brisa del este #56', estado: 'En proceso' },
      { id: 4, prioridad: 'Alta', fecha: '30/06/2026 10:24 AM', problema: 'Cobranza cuotas mantenimiento', condominio: 'Brisa del este #56', estado: 'En proceso' },
      { id: 5, prioridad: 'Media', fecha: '30/06/2026 10:24 AM', problema: 'Reparación bomba hidráulica', condominio: 'Brisa del este #56', estado: 'En proceso' },
      { id: 6, prioridad: 'Media', fecha: '30/06/2026 10:24 AM', problema: 'Reparación bomba hidráulica', condominio: 'Brisa del este #56', estado: 'En proceso' },
      { id: 7, prioridad: 'Baja', fecha: '30/06/2026 10:24 AM', problema: 'Cobranza cuotas mantenimiento', condominio: 'Brisa del este #56', estado: 'En proceso' },
      { id: 8, prioridad: 'Baja', fecha: '30/06/2026 10:24 AM', problema: 'Cobranza cuotas mantenimiento', condominio: 'Brisa del este #56', estado: 'En proceso' },
      { id: 9, prioridad: 'Baja', fecha: '30/06/2026 10:24 AM', problema: 'Cobranza cuotas mantenimiento', condominio: 'Brisa del este #56', estado: 'En proceso' },
      { id: 10, prioridad: 'Alta', fecha: '30/06/2026 10:24 AM', problema: 'Cobranza cuotas mantenimiento', condominio: 'Brisa del este #56', estado: 'En proceso' }
    ];
    this.filteredReportes = this.reportes;
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.applyFilter();
  }

  openCreateModal(): void {
    this.isCreateModalOpen = true;
  }

  closeCreateModal(): void {
    this.isCreateModalOpen = false;
  }

  handleCreateReporte(payload: Record<string, unknown>): void {
    const reporte: ReporteItem = {
      id: this.reportes.length ? Math.max(...this.reportes.map(r => r.id)) + 1 : 1,
      prioridad: (payload['prioridad'] as ReporteItem['prioridad']) || 'Alta',
      fecha: new Date().toLocaleString('es-DO'),
      problema: String(payload['concepto'] || ''),
      condominio: String(payload['condominioNombre'] || ''),
      estado: (payload['estado'] as ReporteItem['estado']) || 'En proceso'
    };

    this.reportes = [reporte, ...this.reportes];
    this.applyFilter();
    this.closeCreateModal();
  }

  getPriorityClass(priority: ReporteItem['prioridad']): string {
    return `badge badge--${priority.toLowerCase()}`;
  }

  getStateClass(state: ReporteItem['estado']): string {
    return `badge badge--state-${state.replace(/\s+/g, '-').toLowerCase()}`;
  }

  private applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      this.filteredReportes = this.reportes;
      return;
    }

    this.filteredReportes = this.reportes.filter(reporte =>
      reporte.prioridad.toLowerCase().includes(term) ||
      reporte.fecha.toLowerCase().includes(term) ||
      reporte.problema.toLowerCase().includes(term) ||
      reporte.condominio.toLowerCase().includes(term) ||
      reporte.estado.toLowerCase().includes(term)
    );
  }
}
