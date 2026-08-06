import { Component, OnInit } from '@angular/core';
import { Pago } from '../../core/models/pago.model';
import { PagosService } from '../../core/services/pagos.service';
import { CondominiosService } from '../../core/services/condominios.service';
import { Condominio } from '../../core/models/condominio.model';

@Component({ selector: 'app-pagos-list', standalone: false, templateUrl: './pagos-list.component.html', styleUrls: ['./pagos-list.component.scss'] })
export class PagosListComponent implements OnInit {
  pagos: Pago[] = [];
  filteredPagos: Pago[] = [];
  isCreateModalOpen = false;
  searchTerm = '';
  condominios: Condominio[] = [];
  constructor(private pagosService: PagosService, private condominiosService: CondominiosService) {}
  ngOnInit(): void {
    this.pagosService.getAll().subscribe({ next: data => { this.pagos = data; this.filteredPagos = data; } });
    this.condominiosService.getAll().subscribe({ next: data => this.condominios = data });
  }
  onSearch(term: string): void { this.searchTerm = term; this.applyFilter(); }
  openCreateModal(): void { this.isCreateModalOpen = true; }
  closeCreateModal(): void { this.isCreateModalOpen = false; }
  handleCreatePago(payload: Record<string, unknown>): void {
    const pago: Partial<Pago> = { condominioId: Number(payload['condominioId']), concepto: String(payload['concepto'] || ''), categoria: (payload['categoria'] as Pago['categoria']) || 'Cuotas', tipo: (payload['tipo'] as Pago['tipo']) || 'Ingreso', monto: Number(payload['monto'] || 0), metodo: (payload['metodo'] as Pago['metodo']) || 'Efectivo' };
    this.pagosService.create(pago).subscribe({ next: () => { this.ngOnInit(); this.closeCreateModal(); } });
  }
  getTypeClass(tipo: Pago['tipo']): string { return `badge badge--${tipo.toLowerCase()}`; }
  getCategoryClass(categoria: Pago['categoria']): string { return `badge badge--category-${categoria.toLowerCase()}`; }
  private applyFilter(): void { const term = this.searchTerm.trim().toLowerCase(); this.filteredPagos = !term ? this.pagos : this.pagos.filter(p => [p.fecha, p.concepto, p.categoria, p.tipo, p.metodo].some(v => String(v || '').toLowerCase().includes(term))); }
}
