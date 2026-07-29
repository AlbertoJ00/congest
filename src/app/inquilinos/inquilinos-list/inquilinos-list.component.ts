import { Component, OnInit } from '@angular/core';
import { InquilinosService } from '../../core/services/inquilinos.service';
import { Inquilino } from '../../core/models/inquilino.model';
import { CondominiosService } from '../../core/services/condominios.service';
import { Condominio } from '../../core/models/condominio.model';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-inquilinos-list',
  standalone: false,
  templateUrl: './inquilinos-list.component.html',
  styleUrls: ['./inquilinos-list.component.scss']
})
export class InquilinosListComponent implements OnInit {
  inquilinos: Inquilino[] = [];
  filteredInquilinos: Inquilino[] = [];
  condominios: Condominio[] = [];
  isCreateModalOpen = false;
  editingInquilino: Inquilino | null = null;
  searchTerm = '';
  readonly isAdmin: boolean;

  constructor(
    private inquilinosService: InquilinosService,
    private condominiosService: CondominiosService,
    authService: AuthService
  ) {
    this.isAdmin = authService.hasRole('Administrador');
  }

  ngOnInit(): void {
    this.inquilinosService.getAll().subscribe({
      next: (data) => {
        this.inquilinos = data;
        this.filteredInquilinos = data;
      },
      error: () => { this.inquilinos = []; this.filteredInquilinos = []; }
    });
    this.condominiosService.getAll().subscribe({ next: data => this.condominios = data });
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.applyFilter();
  }

  openCreateModal(): void {
    this.editingInquilino = null;
    this.isCreateModalOpen = true;
  }

  closeCreateModal(): void {
    this.isCreateModalOpen = false;
    this.editingInquilino = null;
  }

  handleCreateInquilino(payload: Record<string, unknown>): void {
    const nombres = String(payload['nombres'] || '');
    const apellidos = String(payload['apellidos'] || '');
    const nombreCompleto = [nombres, apellidos].filter(Boolean).join(' ');
    const condominioId = Number(payload['condominioId']);
    const condominio = this.condominios.find(item => item.id === condominioId);

    const inquilino: Partial<Inquilino> = {
      nombre: nombreCompleto || 'Nuevo inquilino',
      email: String(payload['correoElectronico'] || ''),
      documento: String(payload['documento'] || ''),
      tipoDocumento: String(payload['tipoDocumento'] || 'Cedula'),
      celular: String(payload['celular'] || ''),
      proximaFechaPago: 'Pendiente',
      montoAlquiler: 0,
      estado: 'Pendiente',
      condominioId,
      condominioNombre: condominio?.nombre || ''
    };

    const request = this.editingInquilino ? this.inquilinosService.update(this.editingInquilino.id, inquilino) : this.inquilinosService.create(inquilino);
    request.subscribe({ next: () => { this.ngOnInit(); this.closeCreateModal(); } });
  }

  edit(inquilino: Inquilino): void { this.editingInquilino = inquilino; this.isCreateModalOpen = true; }
  remove(inquilino: Inquilino): void {
    if (confirm(`¿Eliminar a “${inquilino.nombre}”? Esta acción no se puede deshacer.`)) {
      this.inquilinosService.delete(inquilino.id).subscribe({ next: () => this.ngOnInit() });
    }
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  private applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      this.filteredInquilinos = this.inquilinos;
      return;
    }

    this.filteredInquilinos = this.inquilinos.filter(i =>
      i.nombre.toLowerCase().includes(term) ||
      i.email.toLowerCase().includes(term) ||
      i.documento.includes(term) ||
      (i.condominioNombre && i.condominioNombre.toLowerCase().includes(term))
    );
  }
}
