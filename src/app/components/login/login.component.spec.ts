import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule }         from '@angular/forms';
import { RouterTestingModule }         from '@angular/router/testing';
import { LoginComponent }              from './login.component';
import { AuthService }                 from '../../services/auth.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router }                      from '@angular/router';
import { environment }                 from '../../../environments/environment';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture:   ComponentFixture<LoginComponent>;
  let authService: AuthService;
  let httpMock:  HttpTestingController;
  let router:    Router;

  const LOGIN_URL = `${environment.apiUrl}/auth/login`;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([]) // no real routes needed
      ],
      declarations: [LoginComponent],
      providers: [AuthService]
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    httpMock     = TestBed.inject(HttpTestingController);
    router       = TestBed.inject(Router);

    spyOn(router, 'navigate'); // prevent real navigation
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should call login and navigate to /view if token has Admin role', fakeAsync(() => {
    // Fill out the form
    component.loginForm.setValue({
      name: 'adminUser',
      password: 'anyPass123!'
    });

    // Trigger onSubmit() (which does authService.login(...))
    component.onSubmit();

    // Expect a single POST to LOGIN_URL (no duplicate "/api")
    const req = httpMock.expectOne(LOGIN_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      username: 'adminUser',
      password: 'anyPass123!'
    });

    const payloadObj = {
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'Admin'
    };
    const headerBase64  = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
    const payloadBase64 = btoa(JSON.stringify(payloadObj));
    const fakeJwt       = `${headerBase64}.${payloadBase64}.`;

    req.flush({ token: fakeJwt });
    tick();        
    fixture.detectChanges();

    expect(router.navigate).toHaveBeenCalledWith(['/view']);
  }));
});
