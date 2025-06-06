// src/app/guards/admin.guard.ts
import { Injectable } from '@angular/core';
import {
  CanActivate,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot
} from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, map, take } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(
    _: ActivatedRouteSnapshot,
    __: RouterStateSnapshot
  ): Observable<boolean> {
    return this.auth.loggedIn$.pipe(
      take(1),
      map(isLogged => {
        if (!isLogged || !this.auth.isAdmin()) {
          this.router.navigate(['/view']); // redirect to view if not admin
          return false;
        }
        return true;
      })
    );
  }
}
