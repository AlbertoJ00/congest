import { Component, OnInit } from '@angular/core';
import { IncidenciasService } from '../../../core/services/incidencias.service';
import { Incidencia, ResumenIncidencias } from '../../../core/models/incidencia.model';

@Component({
  selector: 'app-incidencias-panel',
  standalone: false,
  templateUrl: './incidencias-panel.component.html',
  styleUrls: ['./incidencias-panel.component.scss']
})
export class IncidenciasPanelComponent implements OnInit {
  incidencias: Incidencia[] = [];
  resumen: ResumenIncidencias = { abiertas: 0, resueltasHoy: 0 };

  constructor(private incidenciasService: IncidenciasService) {}

  ngOnInit(): void {
    this.incidenciasService.getAll().subscribe({ next: data => this.incidencias = data });
    this.incidenciasService.getResumen().subscribe({ next: data => this.resumen = data });
  }
}
