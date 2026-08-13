import { Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { VulnerabilidadesComponent } from './pages/vulnerabilidades/vulnerabilidades.component';
import { AnadirComponent } from './pages/anadir/anadir.component';
import { VerificarComponent } from './pages/verificar/verificar.component';
import { PerfilComponent } from './pages/perfil/perfil.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'registrar',
    component: RegisterComponent,
  },
  {
    path: 'vulnerabilidades/crear',
    component: AnadirComponent,
    canActivate: [authGuard],
  },
  {
    path: 'vulnerabilidades/verificar',
    component: VerificarComponent,
    canActivate: [adminGuard],
  },
  {
    path: 'vulnerabilidades',
    component: VulnerabilidadesComponent,
    canActivate: [authGuard],
  },
  {
    path: 'perfil',
    component: PerfilComponent,
    canActivate: [authGuard],
  },
];