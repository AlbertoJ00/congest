// Modelo: Estado de Cuenta
export interface EstadoDeCuenta {
  id: number;
  numero: string; // Número de referencia (ej: '96192')
  inquilinoId: number;
  inquilinoNombre: string;
  inquilinoAvatar?: string;
  condominioNombre: string;
  celular: string;
  estado: EstadoPago;
  cuota: number;
  mes: string;
  anio: number;
  createdAt?: string;
}

export type EstadoPago = 'Pagado' | 'Atrasado' | 'Pendiente' | 'En uso';

export interface ResumenKPI {
  recaudacionMes: number;
  gastosMes: number;
  pagosAlDia: number;
  totalPagos: number;
  gananciasMes: number;
}
