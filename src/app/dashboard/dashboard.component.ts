import { Component, OnInit } from '@angular/core';
import { EstadosCuentaService } from '../core/services/estados-cuenta.service';
import { ResumenKPI } from '../core/models/estado-cuenta.model';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  // KPI data — mock inicial (se actualiza con la API)
  kpis = {
    recaudacion: '$284,500',
    gastos: '$82,000',
    pagosAlDia: '8/9',
    ganancias: '$202,500'
  };

  constructor(private estadosCuentaService: EstadosCuentaService) {}

  ngOnInit(): void {
    this.estadosCuentaService.getResumen().subscribe({
      next: (resumen: ResumenKPI) => {
        this.kpis = {
          recaudacion: this.formatCurrency(resumen.recaudacionMes),
          gastos: this.formatCurrency(resumen.gastosMes),
          pagosAlDia: `${resumen.pagosAlDia}/${resumen.totalPagos}`,
          ganancias: this.formatCurrency(resumen.gananciasMes)
        };
      },
      error: () => {
        // Mantener datos mock si el backend no está disponible
      }
    });
  }

  private formatCurrency(amount: number): string {
    return '$' + amount.toLocaleString('en-US');
  }
}
