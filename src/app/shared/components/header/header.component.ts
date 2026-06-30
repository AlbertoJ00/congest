import { Component, Input } from '@angular/core';
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

  sections = [
    { name: 'Dashboard', route: '/dashboard', icon: 'layers' },
    { name: 'Condominios', route: '/condominios', icon: 'building' },
    { name: 'Inquilinos', route: '/inquilinos', icon: 'person' }
  ];

  navIcons = [
    { icon: 'document', route: '/documentos' },
    { icon: 'money', route: '/pagos' },
    { icon: 'location', route: '/ubicacion' }
  ];

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
