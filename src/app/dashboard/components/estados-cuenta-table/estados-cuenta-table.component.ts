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
      next: data => {
        this.estadosCuenta = data;
        this.filteredEstados = data;
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
    return name.split(' ').map(part => part[0]).join('').toUpperCase().substring(0, 2);
  }
}
