import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, LoginRequest } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.css']
})
export class AdminLoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    public authService: AuthService, // CHANGED: private → public
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const loginData: LoginRequest = {
        username: this.loginForm.get('username')?.value,
        password: this.loginForm.get('password')?.value
      };

      console.log('🔍 AdminLogin: Attempting login for', loginData.username);

      this.authService.login(loginData).subscribe({
        next: (response) => {
          console.log('🔍 AdminLogin: Response received', response);
          this.isLoading = false;
          
          // Check if user has Admin role
          if (response.role === 'Admin') {
            console.log('✅ AdminLogin: User is admin, redirecting to dashboard');
            this.router.navigate(['/admin/dashboard']);
          } else {
            console.log('❌ AdminLogin: User is not admin, role:', response.role);
            this.errorMessage = 'Access denied. Admin privileges required.';
            
            // Optional: Clear token if not admin
            this.authService.logout();
          }
        },
        error: (error) => {
          console.error('❌ AdminLogin: Error occurred', error);
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Admin login failed. Please check your credentials.';
          
          // More specific error messages
          if (error.status === 401) {
            this.errorMessage = 'Invalid username or password.';
          } else if (error.status === 0) {
            this.errorMessage = 'Cannot connect to server. Please check if backend is running.';
          }
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      this.loginForm.markAllAsTouched();
    }
  }

  // Helper method to check if field has error
  hasError(controlName: string, errorName: string): boolean {
    const control = this.loginForm.get(controlName);
    return control ? control.hasError(errorName) && control.touched : false;
  }

  // Clear error message when user starts typing
  onInputChange(): void {
    if (this.errorMessage) {
      this.errorMessage = '';
    }
  }
}