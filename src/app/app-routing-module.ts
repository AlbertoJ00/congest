import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';

const routes: Routes = [
  { 
    path: 'login', 
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule) 
  },
  { 
    path: 'dashboard', 
    loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule),
    canActivate: [AuthGuard]
  },
  { 
    path: 'condominios', 
    loadChildren: () => import('./condominios/condominios.module').then(m => m.CondominiosModule),
    canActivate: [AuthGuard]
  },
  { 
    path: 'inquilinos', 
    loadChildren: () => import('./inquilinos/inquilinos.module').then(m => m.InquilinosModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'reportes',
    loadChildren: () => import('./reportes/reportes.module').then(m => m.ReportesModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'pagos',
    loadChildren: () => import('./pagos/pagos.module').then(m => m.PagosModule),
    canActivate: [AuthGuard]
  },
  { path: 'incidencias', loadChildren: () => import('./incidencias/incidencias.module').then(m => m.IncidenciasModule), canActivate: [AuthGuard] },
  { path: 'estados-cuenta', loadChildren: () => import('./estados-cuenta/estados-cuenta.module').then(m => m.EstadosCuentaModule), canActivate: [AuthGuard] },
  {
    path: 'usuarios',
    loadChildren: () => import('./usuarios/usuarios.module').then(m => m.UsuariosModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['Administrador'] }
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
