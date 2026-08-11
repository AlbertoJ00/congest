export interface Reporte {
  id: number;
  prioridad: 'Alta' | 'Media' | 'Baja';
  fecha?: string;
  problema: string;
  condominio: string;
  condominioId: number;
  usuarioId?: number;
  estado: 'Pendiente' | 'En proceso' | 'Asignado' | 'Resuelto';
}
