// src/app/services/auth.service.spec.ts

import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  const LOGIN_URL = `${environment.apiUrl}/auth/login`;
  const LOGOUT_URL = `${environment.apiUrl}/auth/logout`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([]) // no real routes
      ],
      providers: [AuthService]
    });

    service  = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router   = TestBed.inject(Router);

    spyOn(router, 'navigate'); // prevent real navigation
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('login() should POST credentials, store token, and emit loggedIn$', (done) => {
    let loggedInValue: boolean | undefined;
    service.loggedIn$.subscribe(v => (loggedInValue = v));

    // Call login('user', 'pass')
    service.login('user@domain.com', 'SecurePass!').subscribe({
      next: (res) => {
        expect(res.token).toBe('fake-jwt-token');

        // Token should be stored under 'adra_jwt_token'
        expect(localStorage.getItem('adra_jwt_token')).toBe('fake-jwt-token');
        // Since parseRoleFromJwt fails on a non-JWT string, no role stored
        expect(localStorage.getItem('adra_user_role')).toBeNull();

        // loggedIn$ should have emitted true
        expect(loggedInValue).toBeTrue();
        done();
      },
      error: () => fail('Should not error on 200')
    });

    // Expect one POST to /api/auth/login
    const req = httpMock.expectOne(LOGIN_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      username: 'user@domain.com',
      password: 'SecurePass!'
    });

    // Flush a simple token string
    req.flush({ token: 'fake-jwt-token' });
  });

  it('login() should error on 401 and leave storage empty', (done) => {
    service.login('baduser', 'badpass').subscribe({
      next: () => fail('Expected login() to error'),
      error: (err: Error) => {
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toContain('Invalid username or password.');
        expect(localStorage.getItem('adra_jwt_token')).toBeNull();
        done();
      }
    });

    const req = httpMock.expectOne(LOGIN_URL);
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
  });

  it('logout() should POST then clear storage and emit loggedIn$=false', (done) => {
    localStorage.setItem('adra_jwt_token', 'some-token');
    localStorage.setItem('adra_user_role', 'User');
    let last: boolean | undefined;
    service.loggedIn$.subscribe(v => (last = v));

    service.logout();

    const req = httpMock.expectOne(LOGOUT_URL);
    expect(req.request.method).toBe('POST');
    req.flush({});

    expect(localStorage.getItem('adra_jwt_token')).toBeNull();
    expect(localStorage.getItem('adra_user_role')).toBeNull();
    expect(last).toBeFalse();
    done();
  });

  it('logout() should clear storage even if POST fails', (done) => {
    localStorage.setItem('adra_jwt_token', 'some-token');
    localStorage.setItem('adra_user_role', 'User');
    let last: boolean | undefined;
    service.loggedIn$.subscribe(v => (last = v));

    service.logout();

    const req = httpMock.expectOne(LOGOUT_URL);
    expect(req.request.method).toBe('POST');
    req.flush({}, { status: 500, statusText: 'Server Error' });

    expect(localStorage.getItem('adra_jwt_token')).toBeNull();
    expect(localStorage.getItem('adra_user_role')).toBeNull();
    expect(last).toBeFalse();
    done();
  });
});
