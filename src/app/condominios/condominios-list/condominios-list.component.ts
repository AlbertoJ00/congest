import { Component, OnInit } from '@angular/core';
import { CondominiosService } from '../../core/services/condominios.service';
import { Condominio } from '../../core/models/condominio.model';

@Component({
  selector: 'app-condominios-list',
  standalone: false,
  templateUrl: './condominios-list.component.html',
  styleUrls: ['./condominios-list.component.scss']
})
export class CondominiosListComponent implements OnInit {
  condominios: Condominio[] = [];
  filteredCondominios: Condominio[] = [];

  constructor(private condominiosService: CondominiosService) {}

  ngOnInit(): void {
    this.condominiosService.getAll().subscribe({
      next: (data) => {
        this.condominios = data;
        this.filteredCondominios = data;
      },
      error: () => {
        // Fallback mock data
        this.condominios = [
          { id: 1, nombre: 'Brisa Del Este #56', precio: 12900, ciudad: 'Santo Domingo Este', sector: 'Naco', cuartos: 4, banos: 2, capacidad: 9 },
          { id: 2, nombre: 'Brisa Del Este #56', precio: 12900, ciudad: 'Santo Domingo Este', sector: 'Naco', cuartos: 4, banos: 2, capacidad: 9 },
          { id: 3, nombre: 'Brisa Del Este #56', precio: 12900, ciudad: 'Santo Domingo Este', sector: 'Naco', cuartos: 4, banos: 2, capacidad: 9 },
          { id: 4, nombre: 'Brisa Del Este #56', precio: 12900, ciudad: 'Santo Domingo Este', sector: 'Naco', cuartos: 4, banos: 2, capacidad: 9 },
          { id: 5, nombre: 'Brisa Del Este #56', precio: 12900, ciudad: 'Santo Domingo Este', sector: 'Naco', cuartos: 4, banos: 2, capacidad: 9 },
          { id: 6, nombre: 'Brisa Del Este #56', precio: 12900, ciudad: 'Santo Domingo Este', sector: 'Naco', cuartos: 4, banos: 2, capacidad: 9 },
        ];
        this.filteredCondominios = this.condominios;
      }
    });
  }

  onSearch(term: string): void {
    if (!term) {
      this.filteredCondominios = this.condominios;
      return;
    }
    const lowerTerm = term.toLowerCase();
    this.filteredCondominios = this.condominios.filter(c =>
      c.nombre.toLowerCase().includes(lowerTerm) ||
      c.ciudad.toLowerCase().includes(lowerTerm) ||
      c.sector.toLowerCase().includes(lowerTerm)
    );
  }
}
