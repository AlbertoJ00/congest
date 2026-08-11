import { Component, OnDestroy, OnInit } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Actividad } from '../core/models/actividad.model';
import { Condominio } from '../core/models/condominio.model';
import { EstadoDeCuenta, ResumenKPI } from '../core/models/estado-cuenta.model';
import { Inquilino } from '../core/models/inquilino.model';
import { Reporte } from '../core/models/reporte.model';
import { Usuario } from '../core/models/usuario.model';
import { ActividadesService } from '../core/services/actividades.service';
import { AuthService } from '../core/services/auth.service';
import { CondominiosService } from '../core/services/condominios.service';
import { EstadosCuentaService } from '../core/services/estados-cuenta.service';
import { InquilinosService } from '../core/services/inquilinos.service';
import { ReportesService } from '../core/services/reportes.service';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  kpis = { recaudacion: '$0', gastos: '$0', pagosAlDia: '0/0', ganancias: '$0' };
  currentUser: Usuario | null = null;

  tenantCondominios: Condominio[] = [];
  tenantUsers: Inquilino[] = [];
  tenantAccounts: EstadoDeCuenta[] = [];
  tenantReportes: Reporte[] = [];
  tenantActividades: Actividad[] = [];
  tenantLoading = true;
  tenantError = false;

  private summaryLoaded = false;
  private tenantLoaded = false;
  private tenantRefreshTimer?: ReturnType<typeof setInterval>;
  private readonly tenantImages = [
    'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=85'
  ];

  constructor(
    private estadosCuentaService: EstadosCuentaService,
    private authService: AuthService,
    private condominiosService: CondominiosService,
    private inquilinosService: InquilinosService,
    private actividadesService: ActividadesService,
    private reportesService: ReportesService
  ) {}

  ngOnDestroy(): void {
    if (this.tenantRefreshTimer) clearInterval(this.tenantRefreshTimer);
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (!user) return;

      if (user.rol === 'Inquilino') {
        this.loadTenantDashboard();
      } else {
        this.loadManagementSummary();
      }
    });
  }

  get isTenant(): boolean {
    return this.currentUser?.rol === 'Inquilino';
  }

  get isOwner(): boolean {
    return this.currentUser?.rol === 'Propietario';
  }

  get tenantUser(): Inquilino | null {
    return this.tenantUsers.find(user =>
      user.usuarioId === this.currentUser?.id || user.email === this.currentUser?.email
    ) || this.tenantUsers[0] || null;
  }

  get tenantCondominio(): Condominio | null {
    return this.tenantCondominios.find(condominio => condominio.id === this.tenantUser?.condominioId)
      || this.tenantCondominios[0]
      || null;
  }

  get tenantAccount(): EstadoDeCuenta | null {
    return this.tenantAccounts.find(account => account.inquilinoId === this.tenantUser?.id) || this.tenantAccounts[0] || null;
  }

  get tenantBalance(): number {
    if (this.tenantAccount?.estado === 'Pagado' || this.tenantUser?.estado === 'Pagado') return 0;
    return this.tenantAccount?.cuota || this.tenantUser?.montoAlquiler || 0;
  }

  get tenantStatus(): string {
    const status = this.tenantAccount?.estado || this.tenantUser?.estado;
    return status === 'Pagado' ? 'Al corriente' : status || 'Pendiente';
  }

  get tenantActiveReportes(): Reporte[] {
    return this.tenantReportes.filter(reporte => reporte.estado !== 'Resuelto');
  }

  get tenantNextPayment(): string {
    const storedDate = this.tenantUser?.proximaFechaPago;
    const parsedDate = storedDate ? new Date(storedDate) : new Date();
    const baseDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
    const nextMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 1);

    return new Intl.DateTimeFormat('es-DO', {
      month: 'long',
      year: 'numeric'
    }).format(nextMonth);
  }

  get tenantImage(): string {
    return this.tenantCondominio?.imagen || this.tenantImages[(this.tenantCondominio?.id || 1) % this.tenantImages.length];
  }

  formatCurrency(amount: number): string {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  getInitials(name: string): string {
    return name.split(' ').filter(Boolean).map(part => part[0]).join('').toUpperCase().substring(0, 2);
  }

  getDotClass(tipo: string): string {
    return `tenant-activity-dot--${tipo}`;
  }

  private loadManagementSummary(): void {
    if (this.summaryLoaded) return;
    this.summaryLoaded = true;
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

  private loadTenantDashboard(): void {
    if (this.tenantLoaded) return;
    this.tenantLoaded = true;
    forkJoin({
      condominios: this.condominiosService.getAll().pipe(catchError(() => of([] as Condominio[]))),
      users: this.inquilinosService.getAll().pipe(catchError(() => of([] as Inquilino[]))),
      accounts: this.estadosCuentaService.getAll().pipe(catchError(() => of([] as EstadoDeCuenta[]))),
      reportes: this.reportesService.getAll().pipe(catchError(() => of([] as Reporte[]))),
      actividades: this.actividadesService.getAll().pipe(catchError(() => of([] as Actividad[])))
    }).subscribe({
      next: data => {
        this.tenantCondominios = data.condominios;
        this.tenantUsers = data.users;
        this.tenantAccounts = data.accounts;
        this.tenantReportes = data.reportes;
        const condominioId = this.tenantCondominio?.id;
        this.tenantActividades = data.actividades.filter(item => item.condominioId === condominioId).slice(0, 10);
        this.tenantLoading = false;
        this.tenantRefreshTimer = setInterval(() => this.refreshTenantStatuses(), 10000);
      },
      error: () => {
        this.tenantLoading = false;
        this.tenantError = true;
      }
    });
  }

  private refreshTenantStatuses(): void {
    this.reportesService.getAll().subscribe({ next: data => this.tenantReportes = data });
  }
}
