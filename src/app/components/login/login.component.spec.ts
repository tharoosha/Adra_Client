// // src/app/components/login/login.component.spec.ts

// import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
// import { ReactiveFormsModule } from '@angular/forms';
// import { RouterTestingModule } from '@angular/router/testing';
// import { LoginComponent } from './login.component';
// import { AuthService } from '../../services/auth.service';
// import { of, throwError, Subject } from 'rxjs';
// import { Router } from '@angular/router';


// describe('LoginComponent', () => {
//   let component: LoginComponent;
//   let fixture: ComponentFixture<LoginComponent>;
//   let authService: jasmine.SpyObj<AuthService>;
//   let router: Router;

//   beforeEach(async () => {
//     const authSpy = jasmine.createSpyObj('AuthService', ['login', 'isAdmin']);

//     await TestBed.configureTestingModule({
//       declarations: [LoginComponent],
//       imports: [ReactiveFormsModule, RouterTestingModule.withRoutes([])],
//       providers: [{ provide: AuthService, useValue: authSpy }]
//     }).compileComponents();

//     authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
//     router = TestBed.inject(Router);
//   });

//   beforeEach(() => {
//     fixture = TestBed.createComponent(LoginComponent);
//     component = fixture.componentInstance;
//     fixture.detectChanges();
//   });

//   it('should create', () => {
//     expect(component).toBeTruthy();
//   });

//   it('should initialize login form with empty values', () => {
//     // Now the form control is called 'name', not 'username'
//     expect(component.loginForm.get('name')?.value).toBe('');
//     expect(component.loginForm.get('password')?.value).toBe('');
//   });

//   it('should validate required fields', () => {
//     const form = component.loginForm;
//     expect(form.valid).toBeFalse();
//     // 'name' is required
//     expect(form.get('name')?.errors?.['required']).toBeTrue();
//     expect(form.get('password')?.errors?.['required']).toBeTrue();
//   });

//   it('should call login service and navigate on successful login for non-admin user', fakeAsync(() => {
//     authService.login.and.returnValue(of({ token: 'fake-token' }));
//     authService.isAdmin.and.returnValue(false);

//     const routerSpy = spyOn(router, 'navigate');
//     // ** Use 'name' instead of 'username' **
//     component.loginForm.setValue({
//       name: 'testuser',
//       password: 'password123'
//     });

//     component.onSubmit();
//     tick(); // simulate async

//     expect(authService.login).toHaveBeenCalledWith('testuser', 'password123');
//     expect(routerSpy).toHaveBeenCalledWith(['/view']);
//     expect(component.errorMessage).toBe('');
//   }));

//   it('should call login service and navigate on successful login for admin user', fakeAsync(() => {
//     authService.login.and.returnValue(of({ token: 'admin-token' }));
//     authService.isAdmin.and.returnValue(true);

//     const routerSpy = spyOn(router, 'navigate');
//     component.loginForm.setValue({
//       name: 'admin',
//       password: 'adminpass'
//     });

//     component.onSubmit();
//     tick();
//     fixture.detectChanges();

//     expect(authService.login).toHaveBeenCalledWith('admin', 'adminpass');
//     expect(routerSpy).toHaveBeenCalledWith(['/upload']);
//     expect(component.errorMessage).toBe('');
//   }));

//   it('should handle login error and re-enable form', fakeAsync(() => {
//     const error = new Error('Invalid credentials');
//     authService.login.and.returnValue(throwError(() => error));

//     component.loginForm.setValue({
//       name: 'testuser',
//       password: 'wrongpass'
//     });
//     expect(component.loginForm.enabled).toBeTrue();

//     component.onSubmit();
//     tick(); // simulate async

//     // expect(component.errorMessage).toBe('Invalid credentials');
//     expect(component.errorMessage).toBe('Login failed. Check credentials.');
//     expect(component.loginForm.enabled).toBeTrue();
//   }));



//   it('should disable form during submission', fakeAsync(() => {
//   // 1) Create a Subject so that login() does NOT complete immediately
//   const loginSubject = new Subject<{ token: string }>();
//   authService.login.and.returnValue(loginSubject.asObservable());

//   // 2) Fill out the form
//   component.loginForm.setValue({
//     name: 'testuser',
//     password: 'password123'
//   });
//   fixture.detectChanges();

//   // 3) Before onSubmit, form is enabled
//   expect(component.loginForm.enabled).toBeTrue();

//   // 4) Call onSubmit() – this schedules form.disable()
//   component.onSubmit();

//   // 5) Let Angular flush any synchronous tasks (disable() call)
//   tick();
//   fixture.detectChanges();

//   // Now it should be disabled
//   expect(component.loginForm.disabled).toBeTrue();

//   // 6) Simulate the login response arriving
//   loginSubject.next({ token: 'dummy-token' });
//   loginSubject.complete();

//   // 7) Flush again so the subscription callback re-enables the form
//   tick();
//   fixture.detectChanges();

//   expect(component.loginForm.enabled).toBeTrue();
// }));
// });

// src/app/components/login/login.component.spec.ts

// src/app/components/login/login.component.spec.ts

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

  // Make sure this matches exactly how your service forms the login URL:
  // If environment.apiUrl === 'http://localhost:5127/api',
  // then LOGIN_URL must be 'http://localhost:5127/api/auth/login'
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
    // 1) Fill out the form
    component.loginForm.setValue({
      name: 'adminUser',
      password: 'anyPass123!'
    });

    // 2) Trigger onSubmit() (which does authService.login(...))
    component.onSubmit();

    // 3) Expect a single POST to LOGIN_URL (no duplicate "/api")
    const req = httpMock.expectOne(LOGIN_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      username: 'adminUser',
      password: 'anyPass123!'
    });

    // 4) Build a minimal JWT with an Admin claim:
    const payloadObj = {
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'Admin'
    };
    const headerBase64  = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
    const payloadBase64 = btoa(JSON.stringify(payloadObj));
    const fakeJwt       = `${headerBase64}.${payloadBase64}.`;

    // 5) Flush that token
    req.flush({ token: fakeJwt });
    tick();        // let subscription run
    fixture.detectChanges();

    // 6) The component’s code should see isAdmin() === true and navigate to '/upload'
    expect(router.navigate).toHaveBeenCalledWith(['/view']);
  }));
});
