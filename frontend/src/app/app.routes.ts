// app-routing.module.ts or your routes file
import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { BooksComponent } from './components/books/books.component';
import { BookFormComponent } from './components/book-form/book-form.component';
import { QuotesComponent } from './components/quotes/quotes.component';
import { HomeComponent } from './components/home/home.component';
import { AdminLoginComponent } from './components/admin/admin-login/admin-login.component';
import { AdminDashboardComponent } from './components/admin/admin-dashboard/admin-dashboard.component';
import { AdminUsersComponent } from './components/admin/admin-users/admin-users.component';
import { AdminBooksComponent } from './components/admin/admin-books/admin-books.component';
import { AdminQuotesComponent } from './components/admin/admin-quotes/admin-quotes.component';

// Import guards
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';

export const routes: Routes = [
  // Public routes (no authentication required)
  { 
    path: '', 
    component: HomeComponent 
  },
  { 
    path: 'login', 
    component: LoginComponent,
    canActivate: [AuthGuard], // Redirect if already logged in
    data: { requiresGuest: true }
  },
  { 
    path: 'register', 
    component: RegisterComponent,
    canActivate: [AuthGuard], // Redirect if already logged in
    data: { requiresGuest: true }
  },
  
  // Protected routes (require authentication, any role)
  { 
    path: 'books', 
    component: BooksComponent,
    canActivate: [AuthGuard]  // Must be logged in
  },
  { 
    path: 'books/new', 
    component: BookFormComponent,
    canActivate: [AuthGuard]  // Must be logged in
  },
  { 
    path: 'books/edit/:id', 
    component: BookFormComponent,
    canActivate: [AuthGuard]  // Must be logged in
  },
  { 
    path: 'quotes', 
    component: QuotesComponent,
    canActivate: [AuthGuard]  // Must be logged in
  },
  
  // Admin Routes (require Admin role)
  { 
    path: 'admin/login', 
    component: AdminLoginComponent,
    canActivate: [AuthGuard], // Redirect if already logged in
    data: { requiresGuest: true }
  },
  { 
    path: 'admin/dashboard', 
    component: AdminDashboardComponent,
    canActivate: [AdminGuard]  // Must be Admin
  },
  { 
    path: 'admin/users', 
    component: AdminUsersComponent,
    canActivate: [AdminGuard]  // Must be Admin
  },
  { 
    path: 'admin/books', 
    component: AdminBooksComponent,
    canActivate: [AdminGuard]  // Must be Admin
  },
  { 
    path: 'admin/quotes', 
    component: AdminQuotesComponent,
    canActivate: [AdminGuard]  // Must be Admin
  },
  
  // Redirect unknown paths to home
  { path: '**', redirectTo: '' }
];