// Modelo: Actividad
export interface Actividad {
  id: number;
  tipo: TipoActividad;
  descripcion: string;
  tiempo: string; // 'hace 5 min', 'hace 1h', etc.
  nombrePersona?: string;
  monto?: number;
  unidad?: string;
  createdAt?: string;
}

export type TipoActividad = 'pago' | 'anuncio' | 'incidencia' | 'sistema' | 'reserva';

export interface IngresoGasto {
  mes: string;
  ingresos: number;
  gastos: number;
}
