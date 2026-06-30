import { Component, OnInit } from '@angular/core';
import { EstadosCuentaService } from '../../../core/services/estados-cuenta.service';
import { EstadoDeCuenta } from '../../../core/models/estado-cuenta.model';

@Component({
  selector: 'app-estados-cuenta-table',
  standalone: false,
  templateUrl: './estados-cuenta-table.component.html',
  styleUrls: ['./estados-cuenta-table.component.scss']
})
export class EstadosCuentaTableComponent implements OnInit {
  estadosCuenta: EstadoDeCuenta[] = [];
  filteredEstados: EstadoDeCuenta[] = [];

  constructor(private estadosCuentaService: EstadosCuentaService) {}

  ngOnInit(): void {
    this.estadosCuentaService.getAll().subscribe({
      next: (data) => {
        this.estadosCuenta = data;
        this.filteredEstados = data;
      },
      error: () => {
        // Fallback mock data if API is not ready
        this.estadosCuenta = [
          { id: 1, numero: '96192', inquilinoId: 1, inquilinoNombre: 'Leslie Alexander', condominioNombre: 'Herrera #90', celular: '809 123-4567', estado: 'Pagado', cuota: 10000, mes: 'junio', anio: 2026 },
          { id: 2, numero: '96192', inquilinoId: 2, inquilinoNombre: 'Cameron Williamson', condominioNombre: 'Naco A-023', celular: '809 123-4567', estado: 'Atrasado', cuota: 12000, mes: 'junio', anio: 2026 },
          { id: 3, numero: '96192', inquilinoId: 3, inquilinoNombre: 'Courtney Henry', condominioNombre: 'Bella Vista 2do Piso', celular: '809 123-4567', estado: 'Pagado', cuota: 10000, mes: 'junio', anio: 2026 },
          { id: 4, numero: '96192', inquilinoId: 4, inquilinoNombre: 'Darlene Robertson', condominioNombre: 'Unidad D-405', celular: '809 123-4567', estado: 'Pendiente', cuota: 13300, mes: 'junio', anio: 2026 },
          { id: 5, numero: '96192', inquilinoId: 5, inquilinoNombre: 'Guy Hawkins', condominioNombre: 'Naco A-024', celular: '809 123-4567', estado: 'En uso', cuota: 11900, mes: 'junio', anio: 2026 },
        ];
        this.filteredEstados = this.estadosCuenta;
      }
    });
  }

  onSearch(term: string): void {
    if (!term) {
      this.filteredEstados = this.estadosCuenta;
      return;
    }
    const lowerTerm = term.toLowerCase();
    this.filteredEstados = this.estadosCuenta.filter(estado =>
      estado.inquilinoNombre.toLowerCase().includes(lowerTerm) ||
      estado.condominioNombre.toLowerCase().includes(lowerTerm)
    );
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }
}
