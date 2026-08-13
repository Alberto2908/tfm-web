import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

// NG-ZORRO Modules
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';

import { VulnerabilityService } from '../../service/vulnerability.service';
import { AuthService } from '../../service/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-anadir',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzButtonModule,
    NzCardModule,
  ],
  templateUrl: './anadir.component.html',
})
export class AnadirComponent {
  private fb = inject(FormBuilder);
  private vulnerabilityService = inject(VulnerabilityService);
  private authService = inject(AuthService);
  private router = inject(Router);

  isSubmitting = false;

  vulnerabilityForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    description: ['', [Validators.required]],
    severity: ['', [Validators.required]],
    category: ['', [Validators.required]],
    framework: ['', [Validators.required]],
    affectedEndpoint: ['', [Validators.required]],
    payloadExample: [''],
    impact: ['', [Validators.required]],
    mitigation: ['', [Validators.required]],
    referenceURL: [''],
  });

  submitForm(): void {
    if (this.vulnerabilityForm.invalid) {
      // Marcar todos los campos como tocados para mostrar errores
      Object.values(this.vulnerabilityForm.controls).forEach((control) => {
        control.markAsDirty();
        control.updateValueAndValidity();
      });
      return;
    }

    this.isSubmitting = true;

    const formValue = this.vulnerabilityForm.value;

    // Añadir el usuario que crea la vulnerabilidad
    const currentUser = this.authService.getCurrentUser();
    const vulnerabilityData = {
      ...formValue,
      createdBy: currentUser?.username || 'unknown',
      verified: false,
    };

    this.vulnerabilityService.crear(vulnerabilityData).subscribe({
      next: () => {
        this.isSubmitting = false;

        Swal.fire({
          icon: 'success',
          title: 'Vulnerabilidad creada',
          text: 'La vulnerabilidad se ha añadido correctamente',
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          this.router.navigate(['/vulnerabilidades']);
        });
      },
      error: (error: any) => {
        this.isSubmitting = false;

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo crear la vulnerabilidad. Por favor, inténtalo de nuevo.',
        });
        console.error('Error creating vulnerability:', error);
      },
    });
  }

  resetForm(): void {
    this.vulnerabilityForm.reset();
  }
}
