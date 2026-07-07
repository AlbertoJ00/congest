import { Component, OnInit } from '@angular/core';
import { InquilinosService } from '../../core/services/inquilinos.service';
import { Inquilino } from '../../core/models/inquilino.model';

@Component({
  selector: 'app-inquilinos-list',
  standalone: false,
  templateUrl: './inquilinos-list.component.html',
  styleUrls: ['./inquilinos-list.component.scss']
})
export class InquilinosListComponent implements OnInit {
  inquilinos: Inquilino[] = [];
  filteredInquilinos: Inquilino[] = [];
  isCreateModalOpen = false;
  searchTerm = '';

  constructor(private inquilinosService: InquilinosService) {}

  ngOnInit(): void {
    this.inquilinosService.getAll().subscribe({
      next: (data) => {
        this.inquilinos = data;
        this.filteredInquilinos = data;
      },
      error: () => {
        // Mock data
        this.inquilinos = [
          { id: 1, nombre: 'Dianne Russell', email: 'nevaeh.simmons@example.com', documento: '000-0000000-0', tipoDocumento: 'Cedula', celular: '(270) 555-0117', proximaFechaPago: '15 De Julio', montoAlquiler: 12540, estado: 'Pagado', condominioId: 1, condominioNombre: 'Brisa del este #56' },
          { id: 2, nombre: 'Darrell Steward', email: 'sara.cruz@example.com', documento: '000-0000000-0', tipoDocumento: 'Cedula', celular: '(307) 555-0133', proximaFechaPago: '11 De Julio', montoAlquiler: 10390, estado: 'Atrasado', condominioId: 1, condominioNombre: 'Brisa del este #51' },
          { id: 3, nombre: 'Cameron Williamson', email: 'bill.sanders@example.com', documento: '000-0000000-0', tipoDocumento: 'Cedula', celular: '(480) 555-0103', proximaFechaPago: '15 De Julio', montoAlquiler: 12540, estado: 'Pagado', condominioId: 1, condominioNombre: 'Brisa del este #256' },
          { id: 4, nombre: 'Ralph Edwards', email: 'michael.mitc@example.com', documento: '000-0000000-0', tipoDocumento: 'Cedula', celular: '(217) 555-0113', proximaFechaPago: '18 De Julio', montoAlquiler: 10100, estado: 'Pendiente', condominioId: 2, condominioNombre: 'Jardin #43' },
          { id: 5, nombre: 'Jenny Wilson', email: 'curtis.weaver@example.com', documento: '000-0000000-0', tipoDocumento: 'Cedula', celular: '(201) 555-0124', proximaFechaPago: '15 De Julio', montoAlquiler: 12000, estado: 'Pagado', condominioId: 3, condominioNombre: 'Isabel Aguiar #4' },
          { id: 6, nombre: 'Guy Hawkins', email: 'alma.lawson@example.com', documento: '000-0000000-0', tipoDocumento: 'Cedula', celular: '(505) 555-0125', proximaFechaPago: '12 De Julio', montoAlquiler: 15250, estado: 'Pagado', condominioId: 4, condominioNombre: 'Herrera 2do piso' },
          { id: 7, nombre: 'Courtney Henry', email: 'georgia.young@example.com', documento: '000-0000000-0', tipoDocumento: 'Cedula', celular: '(629) 555-0129', proximaFechaPago: '11 De Julio', montoAlquiler: 20500, estado: 'Atrasado', condominioId: 5, condominioNombre: 'Los minas bulevar' },
        ];
        this.filteredInquilinos = this.inquilinos;
      }
    });
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.applyFilter();
  }

  openCreateModal(): void {
    this.isCreateModalOpen = true;
  }

  closeCreateModal(): void {
    this.isCreateModalOpen = false;
  }

  handleCreateInquilino(payload: Record<string, unknown>): void {
    const nextId = this.inquilinos.length ? Math.max(...this.inquilinos.map(i => i.id)) + 1 : 1;
    const nombres = String(payload['nombres'] || '');
    const apellidos = String(payload['apellidos'] || '');
    const nombreCompleto = [nombres, apellidos].filter(Boolean).join(' ');

    const inquilino: Inquilino = {
      id: nextId,
      nombre: nombreCompleto || 'Nuevo inquilino',
      email: String(payload['correoElectronico'] || ''),
      documento: String(payload['documento'] || ''),
      tipoDocumento: String(payload['tipoDocumento'] || 'Cedula'),
      celular: String(payload['celular'] || ''),
      proximaFechaPago: 'Pendiente',
      montoAlquiler: 0,
      estado: 'Pendiente',
      condominioId: 0,
      condominioNombre: String(payload['condominioNombre'] || '')
    };

    this.inquilinos = [inquilino, ...this.inquilinos];
    this.applyFilter();
    this.closeCreateModal();
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
