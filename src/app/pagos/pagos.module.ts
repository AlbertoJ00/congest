import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { PagosRoutingModule } from './pagos-routing.module';
import { PagosListComponent } from './pagos-list/pagos-list.component';

@NgModule({
  declarations: [
    PagosListComponent
  ],
  imports: [
    SharedModule,
    PagosRoutingModule
  ]
})
export class PagosModule { }
