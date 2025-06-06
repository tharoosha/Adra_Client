// src/app/components/navbar/navbar.component.spec.ts

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavbarComponent } from './navbar.component';
import { AuthService } from '../../services/auth.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule }      from '@angular/router/testing';
import { of } from 'rxjs';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let authService: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NavbarComponent],
      imports: [
        HttpClientTestingModule, // <-- Provides HttpClient for AuthService
        RouterTestingModule      // <-- Provides Router
      ],
      providers: [AuthService]
    }).compileComponents();

    authService = TestBed.inject(AuthService);

    (authService as any).loggedIn$ = of(true);
    spyOn(authService, 'isAdmin').and.returnValue(false);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
