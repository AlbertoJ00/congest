import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PagosListComponent } from './pagos-list/pagos-list.component';

const routes: Routes = [
  { path: '', component: PagosListComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PagosRoutingModule { }
