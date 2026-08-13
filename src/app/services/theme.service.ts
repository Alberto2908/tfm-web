import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  private themeSubject = new BehaviorSubject<Theme>(this.getInitialTheme());

  theme$: Observable<Theme> = this.themeSubject.asObservable();

  constructor() {
    if (this.isBrowser) {
      this.applyTheme(this.themeSubject.value);
    }
  }

  private getInitialTheme(): Theme {
    if (!this.isBrowser) {
      return 'light';
    }

    const stored = localStorage.getItem('tfm-theme') as Theme | null;
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }

    return 'light';
  }

  private applyTheme(theme: Theme): void {
    if (!this.isBrowser) return;

    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tfm-theme', theme);

    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute(
        'content',
        theme === 'dark' ? '#0c0a09' : '#fafaf9',
      );
    }
  }

  get currentTheme(): Theme {
    return this.themeSubject.value;
  }

  setTheme(theme: Theme): void {
    this.themeSubject.next(theme);
    if (this.isBrowser) {
      this.applyTheme(theme);
    }
  }

  toggleTheme(): void {
    const newTheme = this.themeSubject.value === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  isDark(): boolean {
    return this.themeSubject.value === 'dark';
  }
}
