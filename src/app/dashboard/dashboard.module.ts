import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';
import { EstadosCuentaTableComponent } from './components/estados-cuenta-table/estados-cuenta-table.component';
import { IncidenciasPanelComponent } from './components/incidencias-panel/incidencias-panel.component';
import { ActividadesPanelComponent } from './components/actividades-panel/actividades-panel.component';
import { IngresosGastosChartComponent } from './components/ingresos-gastos-chart/ingresos-gastos-chart.component';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';

@NgModule({
  declarations: [
    DashboardComponent,
    EstadosCuentaTableComponent,
    IncidenciasPanelComponent,
    ActividadesPanelComponent,
    IngresosGastosChartComponent
  ],
  imports: [
    SharedModule,
    DashboardRoutingModule,
    BaseChartDirective
  ],
  providers: [
    provideCharts(withDefaultRegisterables())
  ]
})
export class DashboardModule { }
