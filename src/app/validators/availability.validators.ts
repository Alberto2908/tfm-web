import {
  AbstractControl,
  AsyncValidatorFn,
  ValidationErrors,
} from '@angular/forms';
import { Observable, of, timer } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { AuthService } from '../service/auth.service';

const DEBOUNCE_MS = 400;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function usernameAvailableValidator(
  authService: AuthService,
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const value = control.value?.trim();
    if (!value || value.length < 3) {
      return of(null);
    }

    return timer(DEBOUNCE_MS).pipe(
      switchMap(() => authService.checkUsernameAvailable(value)),
      map((available) => (available ? null : { usernameTaken: true })),
      catchError(() => of(null)),
    );
  };
}

export function emailAvailableValidator(
  authService: AuthService,
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const value = control.value?.trim();
    if (!value || !EMAIL_PATTERN.test(value)) {
      return of(null);
    }

    return timer(DEBOUNCE_MS).pipe(
      switchMap(() => authService.checkEmailAvailable(value)),
      map((available) => (available ? null : { emailTaken: true })),
      catchError(() => of(null)),
    );
  };
}

export function profileEmailAvailableValidator(
  authService: AuthService,
  getOriginalEmail: () => string,
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const value = control.value?.trim();
    const originalEmail = getOriginalEmail();

    if (!value || !EMAIL_PATTERN.test(value) || value === originalEmail) {
      return of(null);
    }

    return timer(DEBOUNCE_MS).pipe(
      switchMap(() => authService.checkProfileEmailAvailable(value)),
      map((available) => (available ? null : { emailTaken: true })),
      catchError(() => of(null)),
    );
  };
}
