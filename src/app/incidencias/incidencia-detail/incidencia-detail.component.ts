import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Incidencia } from '../../core/models/incidencia.model';
import { IncidenciasService } from '../../core/services/incidencias.service';
@Component({ selector: 'app-incidencia-detail', standalone: false, templateUrl: './incidencia-detail.component.html' })
export class IncidenciaDetailComponent implements OnInit {
  incidencia?: Incidencia;
  constructor(private route: ActivatedRoute, private service: IncidenciasService) {}
  ngOnInit(): void { this.service.getById(Number(this.route.snapshot.paramMap.get('id'))).subscribe({ next: data => this.incidencia = data }); }
}
