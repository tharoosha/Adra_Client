// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

import { LoginRequest } from '../models/login-request.model';
import { LoginResponse } from '../models/login-response.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly tokenKey = 'adra_jwt_token';
  private readonly roleKey  = 'adra_user_role';

  private loggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  public  loggedIn$     = this.loggedInSubject.asObservable();

  private roleSubject = new BehaviorSubject<string | null>(this.getRole());
  public  role$     = this.roleSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  private hasToken(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  private parseRoleFromJwt(token: string): string | null {
    try {
      const payload = token.split('.')[1];
      const decoded = atob(payload);
      const obj: any = JSON.parse(decoded);
      return obj['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || null;
    } catch {
      return null;
    }
  }

  getRole(): string | null {
    return localStorage.getItem(this.roleKey);
  }

  isAdmin(): boolean {
    return this.getRole() === 'Admin';
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  login(username: string, password: string): Observable<LoginResponse> {
    const url = `${environment.apiUrl}/auth/login`;
    const payload: LoginRequest = { username, password };

    return this.http.post<LoginResponse>(url, payload).pipe(
      tap(res => {
        localStorage.setItem(this.tokenKey, res.token);
        const role = this.parseRoleFromJwt(res.token);
        if (role) {
          localStorage.setItem(this.roleKey, role);
          this.roleSubject.next(role);
        } else {
          localStorage.removeItem(this.roleKey);
          this.roleSubject.next(null);
        }
        this.loggedInSubject.next(true);
      }),
      catchError((err: HttpErrorResponse) => {
        let message = 'Login failed. Please try again.';
        if (err.status === 401) {
          message = 'Invalid username or password.';
        } else if (err.error && typeof err.error === 'string') {
          message = err.error;
        } else if (err.error && err.error.message) {
          message = err.error.message;
        }
        return throwError(() => new Error(message));
      })
    );
  }

  logout(): void {
    const url = `${environment.apiUrl}/auth/logout`;
    this.http.post(url, {}).subscribe({
      next: () => this.clearAuthState(),
      error: () => this.clearAuthState()
    });
  }

  private clearAuthState() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.roleKey);
    this.loggedInSubject.next(false);
    this.roleSubject.next(null);
    this.router.navigate(['/login']);
  }

  /**
   * Add a new user. Available only to Admins.
   * Calls POST /api/auth/adduser with { username, password, role }.
   * On success, returns { message: string }.
   */
  addUser(username: string, password: string, role: string): Observable<{ message: string }> {
    const url = `${environment.apiUrl}/auth/adduser`;
    const payload = { username, password, role };
    return this.http.post<{ message: string }>(url, payload).pipe(
      catchError((err: HttpErrorResponse) => {
        let message = 'Failed to add user.';
        if (err.status === 409) {
          // Conflict → username already exists
          message = 'Username already exists.';
        } else if (err.error && typeof err.error === 'string') {
          message = err.error;
        } else if (err.error && err.error.message) {
          message = err.error.message;
        }
        return throwError(() => new Error(message));
      })
    );
  }
}
