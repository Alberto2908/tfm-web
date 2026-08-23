import { CommonModule, AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import { ThemeService } from '../../services/theme.service';
import { Observable } from 'rxjs';
import { User } from '../../interfaces/user';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);

  isAuthenticated$ = this.authService.isAuthenticated$;
  currentUser$ = this.authService.currentUser$;

  get isLoggedIn(): boolean {
    return this.authService.isAuthenticated();
  }

  get username(): string {
    const user = this.authService.getCurrentUser();
    return user?.username || '';
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  isDark(): boolean {
    return this.themeService.isDark();
  }
}
