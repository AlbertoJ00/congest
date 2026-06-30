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
    this.incidenciasService.getAll().subscribe({
      next: (data) => this.incidencias = data,
      error: () => {
        this.incidencias = [
          { id: 1, titulo: 'Fuga en estacionamiento', ubicacion: 'Sótano N-2', tiempo: 'Hace 2h', estado: 'En proceso', severidad: 'alta' },
          { id: 2, titulo: 'Elevador 3 fuera de servicio', ubicacion: 'Torre B', tiempo: 'Hace 5h', estado: 'Asignado', severidad: 'media' },
          { id: 3, titulo: 'Iluminación pasillo 4to piso', ubicacion: 'Torre A', tiempo: 'Ayer', estado: 'Resuelto', severidad: 'baja' },
          { id: 4, titulo: 'Iluminación pasillo 3to piso', ubicacion: 'Torre A', tiempo: 'Ayer', estado: 'Resuelto', severidad: 'baja' },
        ];
      }
    });

    this.incidenciasService.getResumen().subscribe({
      next: (data) => this.resumen = data,
      error: () => this.resumen = { abiertas: 7, resueltasHoy: 3 }
    });
  }
}
