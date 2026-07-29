import { Component, OnInit } from '@angular/core';
import { EstadosCuentaService } from '../core/services/estados-cuenta.service';
import { ResumenKPI } from '../core/models/estado-cuenta.model';
import { AuthService } from '../core/services/auth.service';
import { Usuario } from '../core/models/usuario.model';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  kpis = { recaudacion: '$0', gastos: '$0', pagosAlDia: '0/0', ganancias: '$0' };
  currentUser: Usuario | null = null;

  constructor(private estadosCuentaService: EstadosCuentaService, private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => this.currentUser = user);
    this.estadosCuentaService.getResumen().subscribe({
      next: (resumen: ResumenKPI) => {
        this.kpis = {
          recaudacion: this.formatCurrency(resumen.recaudacionMes),
          gastos: this.formatCurrency(resumen.gastosMes),
          pagosAlDia: `${resumen.pagosAlDia}/${resumen.totalPagos}`,
          ganancias: this.formatCurrency(resumen.gananciasMes)
        };
      }
    });
  }

  get isOwner(): boolean {
    return this.currentUser?.rol === 'Propietario';
  }

  private formatCurrency(amount: number): string {
    return '$' + amount.toLocaleString('en-US');
  }
}
