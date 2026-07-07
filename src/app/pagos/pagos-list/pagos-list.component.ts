import { Component, OnInit } from '@angular/core';

interface PagoItem {
  id: number;
  fecha: string;
  concepto: string;
  categoria: 'Cuotas' | 'Servicios' | 'Mantenimiento';
  tipo: 'Ingreso' | 'Gasto';
  monto: number;
  metodo: 'Efectivo' | 'Transferencia' | 'Tarjeta';
}

@Component({
  selector: 'app-pagos-list',
  standalone: false,
  templateUrl: './pagos-list.component.html',
  styleUrls: ['./pagos-list.component.scss']
})
export class PagosListComponent implements OnInit {
  pagos: PagoItem[] = [];
  filteredPagos: PagoItem[] = [];
  isCreateModalOpen = false;
  searchTerm = '';

  ngOnInit(): void {
    this.pagos = [
      { id: 1, fecha: '30/06/2026 10:24 AM', concepto: 'Cobranza cuotas mantenimiento', categoria: 'Cuotas', tipo: 'Ingreso', monto: 140000, metodo: 'Efectivo' },
      { id: 2, fecha: '30/06/2026 10:24 AM', concepto: 'Reparación bomba hidráulica', categoria: 'Servicios', tipo: 'Gasto', monto: 2000, metodo: 'Transferencia' },
      { id: 3, fecha: '30/06/2026 10:24 AM', concepto: 'Cobranza cuotas mantenimiento', categoria: 'Cuotas', tipo: 'Ingreso', monto: 140000, metodo: 'Efectivo' },
      { id: 4, fecha: '30/06/2026 10:24 AM', concepto: 'Cobranza cuotas mantenimiento', categoria: 'Cuotas', tipo: 'Ingreso', monto: 140000, metodo: 'Efectivo' },
      { id: 5, fecha: '30/06/2026 10:24 AM', concepto: 'Reparación bomba hidráulica', categoria: 'Servicios', tipo: 'Gasto', monto: 2000, metodo: 'Transferencia' },
      { id: 6, fecha: '30/06/2026 10:24 AM', concepto: 'Reparación bomba hidráulica', categoria: 'Servicios', tipo: 'Gasto', monto: 2000, metodo: 'Transferencia' },
      { id: 7, fecha: '30/06/2026 10:24 AM', concepto: 'Cobranza cuotas mantenimiento', categoria: 'Cuotas', tipo: 'Ingreso', monto: 140000, metodo: 'Efectivo' },
      { id: 8, fecha: '30/06/2026 10:24 AM', concepto: 'Cobranza cuotas mantenimiento', categoria: 'Cuotas', tipo: 'Ingreso', monto: 140000, metodo: 'Efectivo' },
      { id: 9, fecha: '30/06/2026 10:24 AM', concepto: 'Cobranza cuotas mantenimiento', categoria: 'Cuotas', tipo: 'Ingreso', monto: 140000, metodo: 'Efectivo' },
      { id: 10, fecha: '30/06/2026 10:24 AM', concepto: 'Cobranza cuotas mantenimiento', categoria: 'Cuotas', tipo: 'Ingreso', monto: 140000, metodo: 'Efectivo' }
    ];
    this.filteredPagos = this.pagos;
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

  handleCreatePago(payload: Record<string, unknown>): void {
    const pago: PagoItem = {
      id: this.pagos.length ? Math.max(...this.pagos.map(p => p.id)) + 1 : 1,
      fecha: new Date().toLocaleString('es-DO'),
      concepto: String(payload['concepto'] || ''),
      categoria: (payload['categoria'] as PagoItem['categoria']) || 'Cuotas',
      tipo: (payload['tipo'] as PagoItem['tipo']) || 'Ingreso',
      monto: Number(payload['monto'] || 0),
      metodo: (payload['metodo'] as PagoItem['metodo']) || 'Efectivo'
    };

    this.pagos = [pago, ...this.pagos];
    this.applyFilter();
    this.closeCreateModal();
  }

  getTypeClass(tipo: PagoItem['tipo']): string {
    return `badge badge--${tipo.toLowerCase()}`;
  }

  getCategoryClass(categoria: PagoItem['categoria']): string {
    return `badge badge--category-${categoria.toLowerCase()}`;
  }

  private applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      this.filteredPagos = this.pagos;
      return;
    }

    this.filteredPagos = this.pagos.filter(pago =>
      pago.fecha.toLowerCase().includes(term) ||
      pago.concepto.toLowerCase().includes(term) ||
      pago.categoria.toLowerCase().includes(term) ||
      pago.tipo.toLowerCase().includes(term) ||
      pago.metodo.toLowerCase().includes(term)
    );
  }
}
