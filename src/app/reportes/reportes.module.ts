import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { ReportesRoutingModule } from './reportes-routing.module';
import { ReportesListComponent } from './reportes-list/reportes-list.component';

@NgModule({
  declarations: [
    ReportesListComponent
  ],
  imports: [
    SharedModule,
    ReportesRoutingModule
  ]
})
export class ReportesModule { }
