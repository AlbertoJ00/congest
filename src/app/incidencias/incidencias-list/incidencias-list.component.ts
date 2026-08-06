import { Component, OnInit } from '@angular/core';
import { Incidencia } from '../../core/models/incidencia.model';
import { IncidenciasService } from '../../core/services/incidencias.service';
@Component({ selector: 'app-incidencias-list', standalone: false, templateUrl: './incidencias-list.component.html' })
export class IncidenciasListComponent implements OnInit {
  incidencias: Incidencia[] = [];
  constructor(private service: IncidenciasService) {}
  ngOnInit(): void { this.service.getAll().subscribe({ next: data => this.incidencias = data }); }
}
