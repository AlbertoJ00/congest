import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  form: FormGroup;
  message = '';
  constructor(
    fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
  ) {
    this.form = fb.group({
      nombre: ['', Validators.required],
      apellido: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }
  submit(): void {
    if (this.form.invalid) return;
    this.auth
      .register(this.form.value)
      .subscribe({
        next: () => this.router.navigate(['/login']),
        error: (e) => (this.message = e.error?.message || 'No se pudo crear la cuenta.'),
      });
  }
}
