import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

import { HeaderComponent } from './components/header/header.component';
import { StatusBadgeComponent } from './components/status-badge/status-badge.component';
import { KpiCardComponent } from './components/kpi-card/kpi-card.component';
import { SearchBarComponent } from './components/search-bar/search-bar.component';
import { EntityModalComponent } from './components/entity-modal/entity-modal.component';

@NgModule({
  declarations: [
    HeaderComponent,
    StatusBadgeComponent,
    KpiCardComponent,
    SearchBarComponent,
    EntityModalComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule
  ],
  exports: [
    // Re-exportar módulos comunes
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    // Exportar componentes compartidos
    HeaderComponent,
    StatusBadgeComponent,
    KpiCardComponent,
    SearchBarComponent,
    EntityModalComponent
  ]
})
export class SharedModule { }
