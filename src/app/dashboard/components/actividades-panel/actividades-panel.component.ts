import { Component, OnInit } from '@angular/core';
import { ActividadesService } from '../../../core/services/actividades.service';
import { Actividad } from '../../../core/models/actividad.model';

@Component({
  selector: 'app-actividades-panel',
  standalone: false,
  templateUrl: './actividades-panel.component.html',
  styleUrls: ['./actividades-panel.component.scss']
})
export class ActividadesPanelComponent implements OnInit {
  actividades: Actividad[] = [];

  constructor(private actividadesService: ActividadesService) {}

  ngOnInit(): void {
    this.actividadesService.getAll().subscribe({
      next: (data) => this.actividades = data,
      error: () => {
        // Mock data
        this.actividades = [
          { id: 1, tipo: 'pago', nombrePersona: 'María López', descripcion: 'realizó un pago de', monto: 3200, unidad: 'B-108', tiempo: 'hace 5 min' },
          { id: 2, tipo: 'anuncio', nombrePersona: 'Admin. Ana', descripcion: 'publicó el anuncio Corte programado de agua', tiempo: 'hace 1 h' },
          { id: 3, tipo: 'incidencia', nombrePersona: 'Jorge Mendoza', descripcion: 'reportó incidencia Fuga en estacionamiento', tiempo: 'hace 2 h' },
          { id: 4, tipo: 'sistema', nombrePersona: 'Sistema', descripcion: 'generó recibos del mes de Julio · 84 unidades', tiempo: 'hace 6 h' },
          { id: 5, tipo: 'reserva', nombrePersona: 'Laura Vega', descripcion: 'reservó Salón social · 15 jul', tiempo: 'ayer' }
        ];
      }
    });
  }

  getDotClass(tipo: string): string {
    return `actividad__dot--${tipo}`;
  }
}
