import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, LoginRequest } from '../../services/auth.service';

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
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      console.log('🔍 LoginComponent: Form is valid');
      
      // DON'T use this.loginForm.value - it might have extra metadata
      // Instead, create a clean object:
      const loginData: LoginRequest = {
        username: this.loginForm.get('username')?.value?.trim(),
        password: this.loginForm.get('password')?.value?.trim()
      };
      
      console.log('🔍 Login data being sent:', loginData);
      console.log('🔍 JSON stringified:', JSON.stringify(loginData));
      
      // Compare with PowerShell format
      const powershellFormat = '{"username":"testuser","password":"test123"}';
      console.log('🔍 PowerShell format:', powershellFormat);
      console.log('🔍 Are they identical?', JSON.stringify(loginData) === powershellFormat.replace('testuser', loginData.username).replace('test123', loginData.password));
      
      this.isLoading = true;
      this.errorMessage = '';

      this.authService.login(loginData).subscribe({
        next: (response) => {
          console.log('✅ LoginComponent: Login successful!', response);
          this.isLoading = false;
          this.router.navigate(['/books']);
        },
        error: (error) => {
          console.error('❌ LoginComponent: Login failed', error);
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Login failed. Please try again.';
          console.error('Error status:', error.status);
          console.error('Error details:', error);
          
          // Test with direct fetch to compare
          this.testDirectFetch(loginData);
        }
      });
    } else {
      console.log('❌ LoginComponent: Form is invalid');
      this.loginForm.markAllAsTouched();
    }
  }

  // Test method to compare Angular vs direct fetch
  private testDirectFetch(loginData: LoginRequest): void {
    console.log('🔄 Testing with direct fetch...');
    
    fetch('http://localhost:5298/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData)
    })
    .then(response => {
      console.log('Direct fetch status:', response.status);
      return response.json();
    })
    .then(data => {
      console.log('✅ Direct fetch SUCCESS:', data);
      console.log('⚠️ This means Angular http client is modifying the request!');
    })
    .catch(err => {
      console.error('❌ Direct fetch also fails:', err);
    });
  }

  // Helper for template validation
  hasError(controlName: string, errorName: string): boolean {
    const control = this.loginForm.get(controlName);
    return control ? control.hasError(errorName) && control.touched : false;
  }
}