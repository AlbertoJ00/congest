import { Component, HostListener, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Usuario } from '../../../core/models/usuario.model';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  @Input() activeSection: string = 'Dashboard';

  currentUser: Usuario | null = null;
  isProfileModalOpen = false;
  profileForm: FormGroup;

  sections: Array<{ name: string; route: string; iconHtml?: unknown }> = [
    { name: 'Dashboard', route: '/dashboard' },
    { name: 'Condominios', route: '/condominios' },
    { name: 'Inquilinos', route: '/inquilinos' },
    { name: 'Reportes', route: '/reportes' },
    { name: 'Pagos', route: '/pagos' },
    { name: 'Incidencias', route: '/incidencias' },
    { name: 'Estados de Cuenta', route: '/estados-cuenta' },
    { name: 'Usuarios', route: '/usuarios' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.profileForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: [''],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['']
    });

    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;

      if (user && !this.isProfileModalOpen) {
        this.profileForm.patchValue({
          nombre: user.nombre || '',
          apellido: user.apellido || '',
          email: user.email || '',
          telefono: user.telefono || ''
        });
      }
    });
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  get visibleSections() {
    if (!this.currentUser) {
      return this.sections;
    }

    if (this.currentUser.rol === 'Administrador') {
      return this.sections;
    }

    if (this.currentUser.rol === 'Inquilino') {
      return this.sections.filter(section => ['Dashboard', 'Condominios'].includes(section.name));
    }

    return this.sections.filter(section => ['Dashboard', 'Condominios', 'Inquilinos', 'Reportes', 'Pagos', 'Incidencias', 'Estados de Cuenta'].includes(section.name));
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  getDisplayName(user: Usuario | null): string {
    if (!user) {
      return '';
    }

    return [user.nombre, user.apellido].filter(Boolean).join(' ');
  }

  openProfileModal(): void {
    if (!this.currentUser) {
      return;
    }

    this.profileForm.reset({
      nombre: this.currentUser.nombre || '',
      apellido: this.currentUser.apellido || '',
      email: this.currentUser.email || '',
      telefono: this.currentUser.telefono || ''
    });
    this.isProfileModalOpen = true;
  }

  closeProfileModal(): void {
    this.isProfileModalOpen = false;
  }

  saveProfile(): void {
    if (!this.currentUser) {
      return;
    }

    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const { nombre, apellido, email, telefono } = this.profileForm.getRawValue();

    this.authService.updateCurrentUser({
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      email: email.trim(),
      telefono: telefono.trim()
    }).subscribe({
      next: () => this.closeProfileModal()
    });
  }

  logout(): void {
    this.closeProfileModal();
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isProfileModalOpen) {
      this.closeProfileModal();
    }
  }
}