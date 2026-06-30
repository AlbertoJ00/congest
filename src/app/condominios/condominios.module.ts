import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { CondominiosRoutingModule } from './condominios-routing.module';
import { CondominiosListComponent } from './condominios-list/condominios-list.component';
import { CondominioCardComponent } from './components/condominio-card/condominio-card.component';

@NgModule({
  declarations: [
    CondominiosListComponent,
    CondominioCardComponent
  ],
  imports: [
    SharedModule,
    CondominiosRoutingModule
  ]
})
export class CondominiosModule { }
