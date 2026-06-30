// Modelo: Incidencia
export interface Incidencia {
  id: number;
  titulo: string;
  descripcion?: string;
  ubicacion: string;
  tiempo: string; // 'Hace 2h', 'Ayer', etc.
  estado: EstadoIncidencia;
  severidad: 'alta' | 'media' | 'baja';
  reportadoPor?: string;
  createdAt?: string;
}

export type EstadoIncidencia = 'En proceso' | 'Asignado' | 'Resuelto';

export interface ResumenIncidencias {
  abiertas: number;
  resueltasHoy: number;
}
