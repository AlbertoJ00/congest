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
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['Administrador', 'Propietario', 'Inquilino'] }
  },
  { 
    path: 'condominios', 
    loadChildren: () => import('./condominios/condominios.module').then(m => m.CondominiosModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['Administrador', 'Propietario', 'Inquilino'] }
  },
  { 
    path: 'inquilinos', 
    loadChildren: () => import('./inquilinos/inquilinos.module').then(m => m.InquilinosModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['Administrador', 'Propietario'] }
  },
  {
    path: 'reportes',
    loadChildren: () => import('./reportes/reportes.module').then(m => m.ReportesModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['Administrador', 'Propietario', 'Inquilino'] }
  },
  {
    path: 'pagos',
    loadChildren: () => import('./pagos/pagos.module').then(m => m.PagosModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['Administrador', 'Propietario'] }
  },
  { path: 'incidencias', loadChildren: () => import('./incidencias/incidencias.module').then(m => m.IncidenciasModule), canActivate: [AuthGuard, RoleGuard], data: { roles: ['Administrador', 'Propietario', 'Inquilino'] } },
  { path: 'estados-cuenta', loadChildren: () => import('./estados-cuenta/estados-cuenta.module').then(m => m.EstadosCuentaModule), canActivate: [AuthGuard, RoleGuard], data: { roles: ['Administrador', 'Propietario'] } },
  {
    path: 'usuarios',
    loadChildren: () => import('./usuarios/usuarios.module').then(m => m.UsuariosModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['Administrador', 'Propietario'] }
  },
  { path: 'registro', redirectTo: 'login/registro', pathMatch: 'full' },
  { 
    path: '', 
    loadChildren: () => import('./landing/landing.module').then(m => m.LandingModule) 
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
