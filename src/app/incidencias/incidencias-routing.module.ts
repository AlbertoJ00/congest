import { NgModule } from '@angular/core'; import { RouterModule, Routes } from '@angular/router'; import { IncidenciasListComponent } from './incidencias-list/incidencias-list.component'; import { IncidenciaDetailComponent } from './incidencia-detail/incidencia-detail.component';
const routes: Routes = [{ path: '', component: IncidenciasListComponent }, { path: ':id', component: IncidenciaDetailComponent }];
@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] }) export class IncidenciasRoutingModule {}
