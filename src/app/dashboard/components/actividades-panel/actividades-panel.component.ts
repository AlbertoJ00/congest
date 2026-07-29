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
    this.actividadesService.getAll().subscribe({ next: data => this.actividades = data });
  }

  getDotClass(tipo: string): string {
    return `actividad__dot--${tipo}`;
  }
}
