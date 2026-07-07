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
  isCreateModalOpen = false;
  searchTerm = '';

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
    this.searchTerm = term;
    this.applyFilter();
  }

  openCreateModal(): void {
    this.isCreateModalOpen = true;
  }

  closeCreateModal(): void {
    this.isCreateModalOpen = false;
  }

  handleCreateCondominio(payload: Record<string, unknown>): void {
    const nextId = this.condominios.length ? Math.max(...this.condominios.map(c => c.id)) + 1 : 1;
    const condominio: Condominio = {
      id: nextId,
      nombre: String(payload['nombre'] || ''),
      ciudad: String(payload['ciudad'] || ''),
      sector: String(payload['sector'] || ''),
      precio: Number(payload['precio'] || 0),
      cuartos: Number(payload['cuartos'] || 0),
      banos: Number(payload['banos'] || 0),
      capacidad: Number(payload['capacidad'] || 0),
      descripcion: String(payload['descripcion'] || '')
    };

    this.condominios = [condominio, ...this.condominios];
    this.applyFilter();
    this.closeCreateModal();
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
