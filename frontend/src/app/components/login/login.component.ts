import { Component, inject, OnInit, effect } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, LoginRequest } from '../../services/auth.service';
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

  private meta = inject(Meta);
  private titleService = inject(Title);
  private translate = inject(TranslateService);
  private themeService = inject(ThemeService);

  // Signal to track dark mode
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
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/books']);
      return;
    }

    this.translate.get(['login', 'loginDescription']).subscribe(translations => {
      this.titleService.setTitle(`Book Quotes Buddy - ${translations['login']}`);
      this.meta.updateTag({
        name: 'description',
        content: translations['loginDescription'] || 'Login to access your personal library and manage your books and quotes.'
      });
    });

    // Optional: effect to react to theme changes
    effect(() => {
      console.log('Current theme is dark?', this.isDarkMode());
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

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
