import { HttpInterceptorFn } from '@angular/common/http';

// Session-based auth - no token needed
// Credentials (cookies) are automatically sent with requests
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Just pass through - session cookie is sent automatically
  return next(req);
};
