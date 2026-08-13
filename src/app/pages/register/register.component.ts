import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthService, RegisterRequest } from '../../service/auth.service';
import { PasswordInputComponent } from '../../components/password-input/password-input.component';
import {
  emailAvailableValidator,
  usernameAvailableValidator,
} from '../../validators/availability.validators';
import {
  PASSWORD_RULES,
  isStrongPassword,
  PasswordRule,
} from '../../utils/password-rules';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, PasswordInputComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  readonly passwordRules: PasswordRule[] = PASSWORD_RULES;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.registerForm = this.fb.group(
      {
        username: [
          '',
          [Validators.required, Validators.minLength(3)],
          [usernameAvailableValidator(this.authService)],
        ],
        email: [
          '',
          [Validators.required, Validators.email],
          [emailAvailableValidator(this.authService)],
        ],
        password: ['', [Validators.required]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator },
    );
  }

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
    }

    this.setupAvailabilityFeedback('username');
    this.setupAvailabilityFeedback('email');
    this.setupPasswordFeedback('password');
    this.setupPasswordFeedback('confirmPassword');
  }

  private setupAvailabilityFeedback(controlName: 'username' | 'email'): void {
    const control = this.registerForm.get(controlName);
    control?.valueChanges.subscribe(() => {
      control.markAsDirty({ onlySelf: true });
    });
  }

  private setupPasswordFeedback(
    controlName: 'password' | 'confirmPassword',
  ): void {
    const control = this.registerForm.get(controlName);
    control?.valueChanges.subscribe(() => {
      control.markAsDirty({ onlySelf: true });
      this.registerForm.updateValueAndValidity({ emitEvent: false });
    });
  }

  passwordMatchValidator(form: FormGroup): { [key: string]: boolean } | null {
    const password = form.get('password')?.value || '';
    const confirmPassword = form.get('confirmPassword')?.value || '';

    if (!password && !confirmPassword) {
      return null;
    }

    if (password && !isStrongPassword(password)) {
      return { passwordWeak: true };
    }

    if (confirmPassword && password !== confirmPassword) {
      return { passwordMismatch: true };
    }

    return null;
  }

  get passwordValue(): string {
    return this.registerForm.get('password')?.value || '';
  }

  get confirmPasswordValue(): string {
    return this.registerForm.get('confirmPassword')?.value || '';
  }

  isPasswordRuleMet(rule: PasswordRule): boolean {
    return rule.test(this.passwordValue);
  }

  showPasswordRequirements(): boolean {
    return this.passwordValue.length > 0;
  }

  showPasswordMatchStatus(): boolean {
    return this.confirmPasswordValue.length > 0;
  }

  passwordsMatch(): boolean {
    return (
      this.passwordValue.length > 0 &&
      this.confirmPasswordValue.length > 0 &&
      this.passwordValue === this.confirmPasswordValue
    );
  }

  passwordsMismatch(): boolean {
    return (
      this.confirmPasswordValue.length > 0 &&
      this.passwordValue !== this.confirmPasswordValue
    );
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      Object.values(this.registerForm.controls).forEach((control) => {
        control.markAsDirty();
        control.updateValueAndValidity();
      });
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const registerData: RegisterRequest = {
      username: this.registerForm.value.username.trim(),
      email: this.registerForm.value.email.trim(),
      password: this.registerForm.value.password,
    };

    this.authService.register(registerData).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: '¡Cuenta creada!',
          text: 'Tu cuenta ha sido creada correctamente',
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          this.router.navigate(['/']);
        });
      },
      error: (error) => {
        this.errorMessage =
          error.error?.message ||
          'Error al registrarse. Por favor, inténtalo de nuevo.';
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: this.errorMessage,
        });
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }
}
