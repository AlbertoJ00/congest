import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { HeaderComponent } from './components/header/header.component';
import { StatusBadgeComponent } from './components/status-badge/status-badge.component';
import { KpiCardComponent } from './components/kpi-card/kpi-card.component';
import { SearchBarComponent } from './components/search-bar/search-bar.component';

@NgModule({
  declarations: [
    HeaderComponent,
    StatusBadgeComponent,
    KpiCardComponent,
    SearchBarComponent
  ],
  imports: [
    CommonModule,
    RouterModule
  ],
  exports: [
    // Re-exportar módulos comunes
    CommonModule,
    RouterModule,
    // Exportar componentes compartidos
    HeaderComponent,
    StatusBadgeComponent,
    KpiCardComponent,
    SearchBarComponent
  ]
})
export class SharedModule { }
