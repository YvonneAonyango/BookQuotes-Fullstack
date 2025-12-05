import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { environment } from '../../../environments/environment';


@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient
  ) {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: AbstractControl) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit() {
    if (!this.registerForm.valid) {
      this.registerForm.markAllAsTouched();
      this.errorMessage = 'Please fill in all fields correctly.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    const registerData = {
      username: this.registerForm.get('username')?.value,
      password: this.registerForm.get('password')?.value,
      confirmPassword: this.registerForm.get('confirmPassword')?.value
    };

    this.http.post<any>(`${environment.apiUrl}/auth/register`, registerData)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 400) {
            this.errorMessage = error.error?.message || 'Registration failed. Please check your information.';
          } else if (error.status === 401) {
            this.errorMessage = 'Invalid credentials';
          } else if (error.status === 500) {
            this.errorMessage = 'Server error. Please try again later.';
          } else {
            this.errorMessage = `An error occurred: ${error.message}`;
          }
          return throwError(() => new Error(this.errorMessage));
        }),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          this.successMessage = response.message || 'Registration successful!';
          
          if (response.token) {
            localStorage.setItem('authToken', response.token);
            localStorage.setItem('username', response.username);
            localStorage.setItem('role', response.role);
          }
          
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: () => {
          // Error message is already set in catchError
        }
      });
  }

  clearMessages() {
    this.errorMessage = '';
    this.successMessage = '';
  }
}
