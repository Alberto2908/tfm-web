import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../service/auth.service';
import { Observable } from 'rxjs';
import { Theme } from '../../services/theme.service';
import Swal from 'sweetalert2';

type NavLink = {
  route: string;
  label: string;
};

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  private themeService = inject(ThemeService);
  private authService = inject(AuthService);
  private router = inject(Router);

  theme$: Observable<Theme> = this.themeService.theme$;
  isAuthenticated$ = this.authService.isAuthenticated$;
  currentUser$ = this.authService.currentUser$;

  isMenuOpen = false;

  authLinks: NavLink[] = [
    { route: '/login', label: 'Login' },
    { route: '/registrar', label: 'Registrar' },
  ];

  dashboardLink: NavLink = {
    route: '/dashboard',
    label: 'Dashboard',
  };

  mainLinks: NavLink[] = [
    { route: '/vulnerabilidades', label: 'Vulnerabilidades' },
    { route: '/vulnerabilidades/crear', label: 'Añadir' },
  ];

  adminLink: NavLink = {
    route: '/vulnerabilidades/verificar',
    label: 'Verificar',
  };

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
    const user = this.authService.getCurrentUser();
    if (user) {
      this.authService.updateDarkmode(this.themeService.isDark()).subscribe();
    }
  }

  isDark(): boolean {
    return this.themeService.isDark();
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  logout(): void {
    Swal.fire({
      icon: 'warning',
      title: '¿Cerrar sesión?',
      text: '¿Estás seguro de que quieres cerrar sesión?',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar',
    }).then((result: { isConfirmed: boolean }) => {
      if (result.isConfirmed) {
        this.authService.logout().subscribe({
          next: () => {
            this.closeMenu();
            Swal.fire({
              icon: 'success',
              title: 'Sesión cerrada',
              text: 'Has cerrado sesión correctamente',
              timer: 1500,
              showConfirmButton: false,
            }).then(() => {
              // Forzar redirección y recarga para asegurar estado limpio
              this.router.navigate(['/']).then(() => {
                // Forzar detección de cambios
                window.location.reload();
              });
            });
          },
          error: () => {
            this.closeMenu();
            // Incluso en error, redirigir
            this.router.navigate(['/']).then(() => {
              window.location.reload();
            });
          },
        });
      }
    });
  }
}
