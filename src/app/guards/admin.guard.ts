import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../service/auth.service';

/** Requiere sesión iniciada y rol ADMIN. */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.waitUntilChecked().pipe(
    map(() => {
      if (!auth.isAuthenticated()) {
        return router.createUrlTree(['/login']);
      }
      if (!auth.isAdmin()) {
        return router.createUrlTree(['/']);
      }
      return true;
    }),
  );
};
