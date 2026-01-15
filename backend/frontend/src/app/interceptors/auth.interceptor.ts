// src/app/interceptors/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {

  // Skip static assets (translations, images, etc.)
  if (req.url.includes('/assets/')) {
    return next(req);
  }

  console.log('Interceptor triggered for:', req.url, 'Method:', req.method);

  // List of public endpoints (GET requests only)
  const publicEndpoints = [
    '/api/books',
    '/api/quotes/global',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/test',
    '/api/auth/logout',
    '/api/auth/admin/login'
  ];

  // Only skip token for GET requests on public endpoints
  const isPublicGet = publicEndpoints.some(endpoint =>
    req.url.includes(endpoint) && req.method === 'GET'
  );

  console.log('Is public GET endpoint?', isPublicGet);

  if (isPublicGet) {
    console.log('Public GET - sending without Authorization header');
    return next(req);
  }

  // For all other requests (POST, PUT, DELETE, etc.) attach token
  const token = localStorage.getItem('authToken');
  console.log('Token exists:', !!token);
  console.log('Token value:', token ? `${token.substring(0, 20)}...` : 'none');

  if (token) {
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Adding Authorization header for private endpoint');
    return next(clonedReq);
  }

  console.log('No token found - sending request without Authorization');
  return next(req);
};
