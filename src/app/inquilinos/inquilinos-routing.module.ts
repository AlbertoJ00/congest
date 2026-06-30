import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InquilinosListComponent } from './inquilinos-list/inquilinos-list.component';

const routes: Routes = [
  { path: '', component: InquilinosListComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InquilinosRoutingModule { }
