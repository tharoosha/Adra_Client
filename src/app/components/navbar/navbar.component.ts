// src/app/components/navbar/navbar.component.ts
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  loggedIn$!: Observable<boolean>;
  isAdmin = false;

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.loggedIn$ = this.auth.loggedIn$;
    this.loggedIn$.subscribe((val) => {
      this.isAdmin = this.auth.isAdmin();
    });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
