// src/app/interceptors/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {

  // Skip static assets (translations, images, etc.)
  if (req.url.includes('/assets/')) {
    return next(req);
  }

  console.log('Interceptor triggered for:', req.url, 'Method:', req.method);

  // List of public GET endpoints (no Authorization required)
  const publicGetEndpoints = [
    '/api/books',
    '/api/quotes/global',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/test',
    '/api/auth/logout',
    '/api/auth/admin/login'
  ];

  const isPublicGet = publicGetEndpoints.some(endpoint =>
    req.url.includes(endpoint) && req.method === 'GET'
  );

  if (isPublicGet) {
    console.log('Public GET endpoint - sending request without Authorization header');
    return next(req);
  }

  // Attach token for all other requests (POST, PUT, DELETE, etc.)
  const token = localStorage.getItem('authToken');

  if (token) {
    console.log('Token found - attaching Authorization header');
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(clonedReq);
  }

  console.log('No token found - sending request without Authorization');
  return next(req);
};
