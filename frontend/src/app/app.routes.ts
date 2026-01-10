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

import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';

export const routes: Routes = [
  //  Public routes
  { path: '', component: HomeComponent },
  { path: 'books', component: BooksComponent },   // ✅ PUBLIC
  { path: 'quotes', component: QuotesComponent }, // ✅ PUBLIC

  {
    path: 'login',
    component: LoginComponent,
    canActivate: [AuthGuard],
    data: { requiresGuest: true }
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [AuthGuard],
    data: { requiresGuest: true }
  },

  // Protected book actions
  { path: 'books/new', component: BookFormComponent, canActivate: [AuthGuard] },
  { path: 'books/edit/:id', component: BookFormComponent, canActivate: [AuthGuard] },

  //  Admin
  {
    path: 'admin/login',
    component: AdminLoginComponent,
    canActivate: [AuthGuard],
    data: { requiresGuest: true }
  },
  { path: 'admin/dashboard', component: AdminDashboardComponent, canActivate: [AdminGuard] },
  { path: 'admin/users', component: AdminUsersComponent, canActivate: [AdminGuard] },
  { path: 'admin/books', component: AdminBooksComponent, canActivate: [AdminGuard] },
  { path: 'admin/quotes', component: AdminQuotesComponent, canActivate: [AdminGuard] },

  { path: '**', redirectTo: '' }
];
