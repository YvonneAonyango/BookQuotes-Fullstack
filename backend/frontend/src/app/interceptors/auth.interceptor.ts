import { HttpInterceptorFn } from '@angular/common/http';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {

  // Skip static assets (translations, images, etc.)
  if (req.url.includes('/assets/')) {
    return next(req);
  }

  console.log('Interceptor triggered for:', req.url);

  // List of public endpoints that should NEVER get auth headers
  const publicEndpoints = [
    '/api/books',
    '/api/quotes/global',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/test',
    '/api/auth/logout',
    '/api/auth/admin/login'
  ];

  // Check if this is a public endpoint
  const isPublicEndpoint = publicEndpoints.some(endpoint => req.url.includes(endpoint));

  console.log('Is public endpoint?', isPublicEndpoint);

  // For public endpoints: NEVER add Authorization header
  if (isPublicEndpoint) {
    console.log('Public endpoint detected - SENDING WITHOUT Authorization header');
    
    // Clone request WITHOUT Authorization header
    const publicReq = req.clone({
      headers: req.headers.delete('Authorization')
    });
    
    return next(publicReq);
  }

  // Only for private endpoints: check for token
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

  console.log('No token found for private endpoint, sending without Authorization');
  return next(req);
};