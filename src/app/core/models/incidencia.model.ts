// Modelo: Incidencia
export interface Incidencia {
  id: number;
  condominioId?: number;
  titulo: string;
  descripcion?: string;
  ubicacion: string;
  tiempo: string; // 'Hace 2h', 'Ayer', etc.
  estado: EstadoIncidencia;
  severidad: 'alta' | 'media' | 'baja';
  reportadoPor?: string;
  usuarioId?: number;
  createdAt?: string;
}

export type EstadoIncidencia = 'Pendiente' | 'En proceso' | 'Asignado' | 'Resuelto';

export interface ResumenIncidencias {
  abiertas: number;
  resueltasHoy: number;
}
