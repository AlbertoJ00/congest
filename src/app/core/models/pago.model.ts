export interface Pago {
  id: number;
  fecha?: string;
  concepto: string;
  categoria: 'Cuotas' | 'Servicios' | 'Mantenimiento';
  tipo: 'Ingreso' | 'Gasto';
  monto: number;
  metodo: 'Efectivo' | 'Transferencia' | 'Tarjeta';
  condominioId: number;
}
