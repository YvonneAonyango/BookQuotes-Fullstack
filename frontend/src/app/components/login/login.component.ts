import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, LoginRequest } from '../../services/auth.service';
import { Meta, Title } from '@angular/platform-browser';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  private meta = inject(Meta);
  private titleService = inject(Title);
  private translate = inject(TranslateService);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/books']);
      return;
    }

    this.titleService.setTitle('BookWebApp - Login');
    
    this.translate.get('loginDescription').subscribe((translated: string) => {
      this.meta.updateTag({
        name: 'description',
        content: translated || 'Login to access your personal library and manage your books and quotes.'
      });
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const loginData: LoginRequest = {
      username: this.loginForm.value.username.trim(),
      password: this.loginForm.value.password.trim()
    };

    this.authService.login(loginData).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/books']);
      },
      error: err => {
        this.isLoading = false;
        this.translate.get('invalidCredentials').subscribe((translated: string) => {
          this.errorMessage = err.error?.message || translated;
        });
      }
    });
  }

  hasError(controlName: string): boolean {
    const control = this.loginForm.get(controlName);
    return control ? control.invalid && control.touched : false;
  }
}