import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CondominiosListComponent } from './condominios-list/condominios-list.component';

const routes: Routes = [
  { path: '', component: CondominiosListComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CondominiosRoutingModule { }
