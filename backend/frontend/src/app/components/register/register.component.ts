import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslateModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  private translate = inject(TranslateService);

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient
  ) {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.pattern(/(?=.*[a-z])/),
        Validators.pattern(/(?=.*[A-Z])/),
        Validators.pattern(/(?=.*\d)/),
        Validators.pattern(/(?=.*[!@#$%^&*])/)
      ]],
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

  get passwordErrors() {
    const password = this.registerForm.get('password');
    if (!password) return {};
    const value = password.value || '';
    return {
      hasLowercase: /[a-z]/.test(value),
      hasUppercase: /[A-Z]/.test(value),
      hasNumber: /\d/.test(value),
      hasSymbol: /[!@#$%^&*]/.test(value),
      minLength: value.length >= 6
    };
  }

  onSubmit() {
    if (!this.registerForm.valid) {
      this.registerForm.markAllAsTouched();
      this.translate.get('fillAllFieldsCorrectly').subscribe(translated => this.errorMessage = translated);
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
            this.translate.get('registrationFailed').subscribe(translated => {
              this.errorMessage = error.error?.message || translated;
            });
          } else if (error.status === 401) {
            this.translate.get('invalidCredentials').subscribe(translated => this.errorMessage = translated);
          } else if (error.status === 500) {
            this.translate.get('serverError').subscribe(translated => this.errorMessage = translated);
          } else {
            this.translate.get('anErrorOccurred').subscribe(translated => this.errorMessage = `${translated} ${error.message}`);
          }
          return throwError(() => new Error(this.errorMessage));
        }),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          this.translate.get('registrationSuccess').subscribe(translated => this.successMessage = response.message || translated);

          if (response.token) {
            localStorage.setItem('authToken', response.token);
            localStorage.setItem('username', response.username);
            localStorage.setItem('role', response.role);
          }

          setTimeout(() => this.router.navigate(['/login']), 2000);
        }
      });
  }

  clearMessages() {
    this.errorMessage = '';
    this.successMessage = '';
  }
}