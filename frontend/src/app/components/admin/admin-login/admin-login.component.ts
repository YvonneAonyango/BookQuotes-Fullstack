import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, LoginRequest, AuthResponse } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });

    // Redirect immediately if already logged in
    if (this.authService.isAuthenticated()) {
      const role = this.authService.getCurrentRole();
      this.redirectByRole(role);
    }
  }

  onSubmit(): void {
    if (!this.loginForm.valid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const loginData: LoginRequest = {
      username: this.loginForm.value.username,
      password: this.loginForm.value.password
    };

    this.authService.login(loginData).subscribe({
      next: (res: AuthResponse) => {
        this.isLoading = false;
        // Ensure role is stored lowercase
        localStorage.setItem('role', res.role.toLowerCase());
        this.redirectByRole(res.role.toLowerCase());
      },
      error: (err: any) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || err.message || 'Login failed';
      }
    });
  }

  redirectByRole(role: string | null) {
    if (!role) return;
    if (role === 'admin') {
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.router.navigate(['/books']);
    }
  }

  onInputChange(): void {
    if (this.errorMessage) this.errorMessage = '';
  }

  hasError(controlName: string, errorName: string): boolean {
    const control = this.loginForm.get(controlName);
    return control ? control.hasError(errorName) && control.touched : false;
  }
}