import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Incidencia } from '../../core/models/incidencia.model';
import { IncidenciasService } from '../../core/services/incidencias.service';
import { AuthService } from '../../core/services/auth.service';
@Component({ selector: 'app-incidencia-detail', standalone: false, templateUrl: './incidencia-detail.component.html' })
export class IncidenciaDetailComponent implements OnInit {
  incidencia?: Incidencia;
  editable = false;
  estados: Incidencia['estado'][] = ['Pendiente', 'En proceso', 'Asignado', 'Resuelto'];
  constructor(private route: ActivatedRoute, private service: IncidenciasService, private auth: AuthService) {}
  ngOnInit(): void { 
    this.service.getById(Number(this.route.snapshot.paramMap.get('id'))).subscribe({ next: data => this.incidencia = data });
    this.editable = this.auth.hasRole('Administrador', 'Propietario');
  }

  changeEstado(nuevoEstado: Incidencia['estado']): void {
    if (!this.incidencia || !this.editable || this.incidencia.estado === nuevoEstado) return;
    this.service.update(this.incidencia.id, { estado: nuevoEstado }).subscribe({ next: data => this.incidencia = data });
  }
}
