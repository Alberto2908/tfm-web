import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, map, of, filter, take } from 'rxjs';
import { User } from '../interfaces/user';
import { environment } from '../../environments/environment';
import { ThemeService } from '../services/theme.service';

export interface AuthResponse {
  authenticated: boolean;
  username: string;
  email: string;
  role: string;
  message: string;
  user: User;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  email: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface AvailabilityResponse {
  available: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = `${environment.BACKEND_URL}/api/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private authCheckedSubject = new BehaviorSubject<boolean>(false);
  private isBrowser: boolean;

  currentUser$ = this.currentUserSubject.asObservable();
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private themeService: ThemeService,
    @Inject(PLATFORM_ID) platformId: Object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    // Check authentication status on initialization
    this.checkAuthStatus();
  }

  /** Emite una vez cuando /auth/status ha respondido (éxito o error). */
  waitUntilChecked(): Observable<boolean> {
    if (this.authCheckedSubject.value) {
      return of(true);
    }
    return this.authCheckedSubject.pipe(
      filter((checked) => checked),
      take(1),
    );
  }

  private checkAuthStatus(): void {
    this.http
      .get<AuthResponse>(`${this.apiUrl}/status`, { withCredentials: true })
      .subscribe({
        next: (response) => {
          if (response.authenticated && response.user) {
            this.currentUserSubject.next(response.user);
            this.isAuthenticatedSubject.next(true);
            this.applyUserTheme(response.user);
          } else {
            this.currentUserSubject.next(null);
            this.isAuthenticatedSubject.next(false);
          }
          this.authCheckedSubject.next(true);
        },
        error: () => {
          this.currentUserSubject.next(null);
          this.isAuthenticatedSubject.next(false);
          this.authCheckedSubject.next(true);
        },
      });
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, credentials, {
        withCredentials: true,
      })
      .pipe(
        tap((response) => {
          if (response.authenticated && response.user) {
            this.currentUserSubject.next(response.user);
            this.isAuthenticatedSubject.next(true);
            // Aplicar tema del usuario
            this.applyUserTheme(response.user);
          }
        }),
      );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/register`, userData, {
        withCredentials: true,
      })
      .pipe(
        tap((response) => {
          if (response.authenticated && response.user) {
            this.currentUserSubject.next(response.user);
            this.isAuthenticatedSubject.next(true);
            // Aplicar tema del usuario
            this.applyUserTheme(response.user);
          }
        }),
      );
  }

  logout(): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(
        `${this.apiUrl}/logout`,
        {},
        { withCredentials: true },
      )
      .pipe(
        tap(() => {
          this.currentUserSubject.next(null);
          this.isAuthenticatedSubject.next(false);
        }),
      );
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    // Session-based auth doesn't use tokens
    return null;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'ADMIN';
  }

  updateDarkmode(darkmode: boolean): Observable<User> {
    return this.http
      .put<User>(
        `${environment.BACKEND_URL}/api/user/darkmode`,
        { darkmode },
        { withCredentials: true },
      )
      .pipe(
        tap((updatedUser) => {
          this.currentUserSubject.next(updatedUser);
        }),
      );
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${environment.BACKEND_URL}/api/user/profile`, {
      withCredentials: true,
    });
  }

  updateProfile(data: UpdateProfileRequest): Observable<User> {
    return this.http
      .put<User>(`${environment.BACKEND_URL}/api/user/profile`, data, {
        withCredentials: true,
      })
      .pipe(
        tap((updatedUser) => {
          this.currentUserSubject.next(updatedUser);
        }),
      );
  }

  checkUsernameAvailable(username: string): Observable<boolean> {
    return this.http
      .get<AvailabilityResponse>(`${this.apiUrl}/check-username`, {
        params: { username },
      })
      .pipe(map((response) => response.available));
  }

  checkEmailAvailable(email: string): Observable<boolean> {
    return this.http
      .get<AvailabilityResponse>(`${this.apiUrl}/check-email`, {
        params: { email },
      })
      .pipe(map((response) => response.available));
  }

  checkProfileEmailAvailable(email: string): Observable<boolean> {
    return this.http
      .get<AvailabilityResponse>(
        `${environment.BACKEND_URL}/api/user/check-email`,
        { params: { email }, withCredentials: true },
      )
      .pipe(map((response) => response.available));
  }

  applyUserTheme(user: User): void {
    if (!this.isBrowser) return;

    if (user && user.darkmode !== undefined) {
      const theme = user.darkmode ? 'dark' : 'light';
      this.themeService.setTheme(theme);
    }
  }
}
