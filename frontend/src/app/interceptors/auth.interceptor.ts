import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Get the token from localStorage
    const token = localStorage.getItem('authToken');

    if (token) {
      // Clone the request and set the Authorization header
      const cloned = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return next.handle(cloned);
    }

    // If no token, proceed with the request unmodified
    return next.handle(request);
  }
}
