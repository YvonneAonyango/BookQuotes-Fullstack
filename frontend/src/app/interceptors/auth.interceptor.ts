import { HttpInterceptorFn } from '@angular/common/http';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {

  // Skip static assets (translations, images, etc.)
  if (req.url.includes('/assets/')) {
    return next(req);
  }

  console.log('Interceptor triggered for:', req.url);

  const token = localStorage.getItem('authToken');
  console.log('Token exists:', !!token);
  console.log('Token value:', token ? `${token.substring(0, 20)}...` : 'none');

  if (token) {
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('Adding Authorization header');
    console.log('Final headers:', clonedReq.headers.keys());

    return next(clonedReq);
  }

  console.log('No token found, sending request without Authorization');
  return next(req);
};