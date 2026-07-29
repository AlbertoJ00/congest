import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Usuario } from '../../core/models/usuario.model';
import { UsuariosService } from '../../core/services/usuarios.service';

@Component({
  selector: 'app-usuarios-list',
  standalone: false,
  templateUrl: './usuarios-list.component.html',
  styleUrls: ['./usuarios-list.component.scss']
})
export class UsuariosListComponent implements OnInit {
  usuarios: Usuario[] = [];
  editing?: Usuario;
  form: FormGroup;
  showForm = false;
  errorMessage = '';

  constructor(private service: UsuariosService, private fb: FormBuilder) {
    this.form = this.buildForm();
  }

  ngOnInit(): void {
    this.service.getAll().subscribe({ next: data => this.usuarios = data });
  }

  open(user?: Usuario): void {
    this.editing = user;
    this.errorMessage = '';
    this.form = this.buildForm(!!user);
    this.form.reset(user ? { ...user, password: '' } : { rol: 'Propietario' });
    this.showForm = true;
  }

  cancel(): void {
    this.showForm = false;
    this.editing = undefined;
    this.errorMessage = '';
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const data = { ...this.form.value };
    if (this.editing && !data.password) delete data.password;
    const request = this.editing
      ? this.service.update(this.editing.id, data)
      : this.service.create(data);
    request.subscribe({
      next: () => {
        this.cancel();
        this.ngOnInit();
      },
      error: error => this.errorMessage = error.error?.message || 'No se pudo guardar el usuario.'
    });
  }

  remove(user: Usuario): void {
    if (confirm(`¿Eliminar a “${user.nombre}”? Esta acción no se puede deshacer.`)) {
      this.service.delete(user.id).subscribe({
        next: () => this.ngOnInit(),
        error: error => this.errorMessage = error.error?.message || 'No se pudo eliminar el usuario.'
      });
    }
  }

  getInitials(user: Usuario): string {
    return [user.nombre, user.apellido].filter(Boolean).map(value => value![0]).join('').toUpperCase();
  }

  private buildForm(editing = false): FormGroup {
    return this.fb.group({
      nombre: ['', Validators.required],
      apellido: [''],
      email: ['', [Validators.required, Validators.email]],
      telefono: [''],
      rol: ['Propietario', Validators.required],
      password: ['', editing ? [Validators.minLength(8)] : [Validators.required, Validators.minLength(8)]]
    });
  }
}
