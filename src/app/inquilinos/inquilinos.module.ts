import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { InquilinosRoutingModule } from './inquilinos-routing.module';
import { InquilinosListComponent } from './inquilinos-list/inquilinos-list.component';

@NgModule({
  declarations: [
    InquilinosListComponent
  ],
  imports: [
    SharedModule,
    InquilinosRoutingModule
  ]
})
export class InquilinosModule { }
