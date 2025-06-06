// src/app/app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './components/login/login.component';
import { ViewComponent } from './components/view/view.component';
import { UploadComponent } from './components/upload/upload.component';

import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: LoginComponent },

  // Any authenticated user can see “view”
  {
    path: 'view',
    component: ViewComponent,
    canActivate: [AuthGuard]
  },

  // Only Admin can see “upload”
  {
    path: 'upload',
    component: UploadComponent,
    canActivate: [AdminGuard]
  },

  // Wildcard: redirect unknown paths to /view (or /login if not logged in)
  { path: '**', redirectTo: 'view' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
