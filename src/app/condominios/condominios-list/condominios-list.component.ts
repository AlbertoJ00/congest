import { Component, OnInit } from '@angular/core';
import { CondominiosService } from '../../core/services/condominios.service';
import { Condominio } from '../../core/models/condominio.model';
import { AuthService } from '../../core/services/auth.service';
import { UsuariosService } from '../../core/services/usuarios.service';
import { Usuario } from '../../core/models/usuario.model';

@Component({
  selector: 'app-condominios-list',
  standalone: false,
  templateUrl: './condominios-list.component.html',
  styleUrls: ['./condominios-list.component.scss']
})
export class CondominiosListComponent implements OnInit {
  condominios: Condominio[] = [];
  filteredCondominios: Condominio[] = [];
  isCreateModalOpen = false;
  editingCondominio: Condominio | null = null;
  searchTerm = '';
  propietarios: Usuario[] = [];
  readonly isAdmin: boolean;

  constructor(
    private condominiosService: CondominiosService,
    private authService: AuthService,
    private usuariosService: UsuariosService
  ) {
    this.isAdmin = this.authService.hasRole('Administrador');
  }

  ngOnInit(): void {
    this.condominiosService.getAll().subscribe({
      next: (data) => {
        this.condominios = data;
        this.filteredCondominios = data;
      },
      error: () => { this.condominios = []; this.filteredCondominios = []; }
    });
    if (this.isAdmin) {
      this.usuariosService.getAll().subscribe({
        next: users => this.propietarios = users.filter(user => user.rol === 'Propietario')
      });
    }
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.applyFilter();
  }

  openCreateModal(): void {
    this.editingCondominio = null;
    this.isCreateModalOpen = true;
  }

  closeCreateModal(): void {
    this.isCreateModalOpen = false;
    this.editingCondominio = null;
  }

  handleCreateCondominio(payload: Record<string, unknown>): void {
    const data = payload as Partial<Condominio>;
    const request = this.editingCondominio ? this.condominiosService.update(this.editingCondominio.id, data) : this.condominiosService.create(data);
    request.subscribe({ next: () => { this.ngOnInit(); this.closeCreateModal(); } });
  }

  edit(condominio: Condominio): void { this.editingCondominio = condominio; this.isCreateModalOpen = true; }
  remove(condominio: Condominio): void {
    if (confirm(`¿Eliminar el condominio “${condominio.nombre}”? Esta acción no se puede deshacer.`)) {
      this.condominiosService.delete(condominio.id).subscribe({ next: () => this.ngOnInit() });
    }
  }

  private applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      this.filteredCondominios = this.condominios;
      return;
    }

    this.filteredCondominios = this.condominios.filter(c =>
      c.nombre.toLowerCase().includes(term) ||
      c.ciudad.toLowerCase().includes(term) ||
      c.sector.toLowerCase().includes(term)
    );
  }
}
