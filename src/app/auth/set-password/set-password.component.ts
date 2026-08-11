import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-set-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './set-password.component.html'
})
export class SetPasswordComponent {
  form: FormGroup;
  message = '';
  token: string | null = null;
  constructor(fb: FormBuilder, private auth: AuthService, private route: ActivatedRoute, private router: Router) {
    this.form = fb.group({ password: ['', [Validators.required, Validators.minLength(8)]], confirm: ['', Validators.required] });
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');
    if (!this.token) this.message = 'Token inválido.';
  }

  submit(): void {
    if (!this.token) return;
    if (this.form.invalid) return;
    if (this.form.value.password !== this.form.value.confirm) {
      this.message = 'Las contraseñas no coinciden.';
      return;
    }
    this.auth.setPassword(this.token, this.form.value.password).subscribe({ next: () => this.router.navigate(['/login']), error: e => this.message = e.error?.message || 'No se pudo establecer la contraseña.' });
  }
}
