import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, LoginRequest, AuthResponse } from '../../services/auth.service';
import { Meta, Title } from '@angular/platform-browser';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ThemeService } from '../../services/theme.service';

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
  isAdminLogin = false; // toggle for admin login

  private meta = inject(Meta);
  private titleService = inject(Title);
  private translate = inject(TranslateService);
  private themeService = inject(ThemeService);

  isDarkMode = this.themeService.isDarkMode;

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
    // If already authenticated, redirect
    if (this.authService.isAuthenticated()) {
      if (this.authService.isAdmin()) {
        this.router.navigate(['/admin/dashboard']);
      } else {
        this.router.navigate(['/books']);
      }
      return;
    }

    // SEO
    this.translate.get(['login', 'loginDescription']).subscribe(translations => {
      this.titleService.setTitle(`Book Quotes Buddy - ${translations['login']}`);
      this.meta.updateTag({ name: 'description', content: translations['loginDescription'] });
    });
  }

  toggleAdminLogin(): void {
    this.isAdminLogin = !this.isAdminLogin;
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

    const loginObservable = this.isAdminLogin
      ? this.authService.adminLogin(loginData) // admin login
      : this.authService.login(loginData); // regular login

    loginObservable.subscribe({
      next: (res: AuthResponse) => {
        this.isLoading = false;
        if (res.role.toLowerCase() === 'admin') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/books']);
        }
      },
      error: err => {
        this.isLoading = false;
        this.translate.get('invalidCredentials').subscribe(translated => {
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
