import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import Swal from 'sweetalert2';

import { AuthService } from '../../service/auth.service';
import { PasswordInputComponent } from '../../components/password-input/password-input.component';
import {
  PASSWORD_RULES,
  isStrongPassword,
  PasswordRule,
} from '../../utils/password-rules';
import { profileEmailAvailableValidator } from '../../validators/availability.validators';

@Component({
  selector: 'app-perfil',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzCardModule,
    NzSpinModule,
    PasswordInputComponent,
  ],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css',
})
export class PerfilComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = true;
  isSubmitting = false;
  originalEmail = '';
  readonly passwordRules: PasswordRule[] = PASSWORD_RULES;

  profileForm: FormGroup = this.fb.group(
    {
      username: [{ value: '', disabled: true }],
      email: ['', [Validators.required, Validators.email]],
      currentPassword: [''],
      newPassword: [''],
      confirmPassword: [''],
    },
    { validators: this.passwordChangeValidator },
  );

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadProfile();
  }

  private loadProfile(): void {
    this.isLoading = true;
    this.authService.getProfile().subscribe({
      next: (user) => {
        this.originalEmail = user.email;
        this.profileForm.patchValue({
          username: user.username,
          email: user.email,
        });
        this.profileForm
          .get('email')
          ?.setAsyncValidators(
            profileEmailAvailableValidator(this.authService, () => this.originalEmail),
          );
        this.profileForm.get('email')?.updateValueAndValidity();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar tus datos personales.',
        }).then(() => this.router.navigate(['/']));
      },
    });
  }

  passwordChangeValidator(form: FormGroup): { [key: string]: boolean } | null {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    const currentPassword = form.get('currentPassword')?.value;

    if (newPassword || confirmPassword) {
      if (!currentPassword) {
        return { currentPasswordRequired: true };
      }
      if (newPassword && !isStrongPassword(newPassword)) {
        return { passwordWeak: true };
      }
      if (newPassword !== confirmPassword) {
        return { passwordMismatch: true };
      }
    }

    return null;
  }

  get newPasswordValue(): string {
    return this.profileForm.get('newPassword')?.value || '';
  }

  isPasswordRuleMet(rule: PasswordRule): boolean {
    return rule.test(this.newPasswordValue);
  }

  showPasswordRequirements(): boolean {
    return this.newPasswordValue.length > 0;
  }

  get confirmPasswordValue(): string {
    return this.profileForm.get('confirmPassword')?.value || '';
  }

  showPasswordMatchStatus(): boolean {
    return this.confirmPasswordValue.length > 0;
  }

  passwordsMatch(): boolean {
    return (
      this.newPasswordValue.length > 0 &&
      this.confirmPasswordValue.length > 0 &&
      this.newPasswordValue === this.confirmPasswordValue
    );
  }

  passwordsMismatch(): boolean {
    return (
      this.confirmPasswordValue.length > 0 &&
      this.newPasswordValue !== this.confirmPasswordValue
    );
  }

  submitForm(): void {
    if (this.profileForm.invalid) {
      Object.values(this.profileForm.controls).forEach((control) => {
        control.markAsDirty();
        control.updateValueAndValidity();
      });
      return;
    }

    const { email, currentPassword, newPassword } = this.profileForm.getRawValue();
    const payload = {
      email,
      ...(newPassword
        ? { currentPassword, newPassword }
        : {}),
    };

    this.isSubmitting = true;
    this.authService.updateProfile(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.originalEmail = this.profileForm.getRawValue().email;
        this.profileForm.patchValue({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        Swal.fire({
          icon: 'success',
          title: 'Perfil actualizado',
          text: 'Tus datos se han guardado correctamente.',
          timer: 2000,
          showConfirmButton: false,
        });
      },
      error: (err) => {
        this.isSubmitting = false;
        const message =
          err.error?.message || 'No se pudo actualizar el perfil. Inténtalo de nuevo.';
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: message,
        });
      },
    });
  }

  resetPasswordFields(): void {
    this.profileForm.patchValue({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  }
}
