// src/app/components/login/login.component.ts
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage = '';
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      name: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  async onSubmit() {
    console.log(
      'onSubmit() was called, form is valid? →',
      this.loginForm.valid
    );

    this.loginForm.markAllAsTouched();
    if (this.loginForm.invalid) {
      return;
    }
    console.log('Form valid, calling AuthService.login(...)');

    this.isSubmitting = true;
    this.errorMessage = '';

    const { name, password } = this.loginForm.value;
    this.auth.login(name, password).subscribe({
      next: () => {
        // After login, navigate to “view” page
        console.log('login succeeded, navigating to /view');

        this.router.navigate(['/view']);
      },
      error: (err) => {
        console.error('login failed:', err);

        console.error(err);
        this.errorMessage = 'Login failed. Check credentials.';
        this.isSubmitting = false;
      },
    });
  }
}
