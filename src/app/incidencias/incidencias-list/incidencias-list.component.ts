import { Component, OnDestroy, OnInit } from '@angular/core';
import { Incidencia } from '../../core/models/incidencia.model';
import { IncidenciasService } from '../../core/services/incidencias.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-incidencias-list',
  standalone: false,
  templateUrl: './incidencias-list.component.html'
})
export class IncidenciasListComponent implements OnInit, OnDestroy {
  incidencias: Incidencia[] = [];
  editable = false;
  estados: Incidencia['estado'][] = ['Pendiente', 'En proceso', 'Asignado', 'Resuelto'];
  errorMessage = '';
  private refreshTimer?: ReturnType<typeof setInterval>;

  constructor(private service: IncidenciasService, private auth: AuthService) {}

  ngOnInit(): void {
    this.editable = this.auth.hasRole('Administrador', 'Propietario');
    this.loadIncidencias();
    this.refreshTimer = setInterval(() => this.loadIncidencias(), 10000);
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }

  changeEstado(incidencia: Incidencia, nuevoEstado: Incidencia['estado']): void {
    if (!this.editable || incidencia.estado === nuevoEstado) return;
    this.service.update(incidencia.id, { estado: nuevoEstado }).subscribe({
      next: updated => incidencia.estado = updated.estado,
      error: error => this.errorMessage = error.error?.message || 'No se pudo actualizar el estado.'
    });
  }

  private loadIncidencias(): void {
    this.service.getAll().subscribe({
      next: data => this.incidencias = data,
      error: error => this.errorMessage = error.error?.message || 'No se pudieron cargar las incidencias.'
    });
  }
}
