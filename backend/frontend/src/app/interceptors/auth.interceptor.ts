import { HttpInterceptorFn } from '@angular/common/http';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {

  // Skip static assets (translations, images, etc.)
  if (req.url.includes('/assets/')) {
    return next(req);
  }

  console.log('Interceptor triggered for:', req.url);

  // List of public endpoints that don't need auth
  const publicEndpoints = [
    '/api/books',
    '/api/quotes/global',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/test',
    '/api/auth/logout'
  ];

  // Check if this is a public endpoint
  const isPublicEndpoint = publicEndpoints.some(endpoint => req.url.includes(endpoint));

  // Get token
  const token = localStorage.getItem('authToken');
  console.log('Token exists:', !!token);
  console.log('Token value:', token ? `${token.substring(0, 20)}...` : 'none');

  // If it's a public endpoint, skip adding auth header
  if (isPublicEndpoint) {
    console.log('Public endpoint, skipping Authorization header');
    
    // But still add Content-Type for POST/PUT requests
    if (req.method === 'POST' || req.method === 'PUT') {
      const clonedReq = req.clone({
        setHeaders: {
          'Content-Type': 'application/json'
        }
      });
      return next(clonedReq);
    }
    
    return next(req);
  }

  // For private endpoints, add auth header if token exists
  if (token) {
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Adding Authorization header for private endpoint');
    console.log('Final headers:', clonedReq.headers.keys());

    return next(clonedReq);
  }

  console.log('No token found for private endpoint, sending without Authorization');
  
  // Still add Content-Type for POST/PUT
  if (req.method === 'POST' || req.method === 'PUT') {
    const clonedReq = req.clone({
      setHeaders: {
        'Content-Type': 'application/json'
      }
    });
    return next(clonedReq);
  }
  
  return next(req);
};