export interface Reporte {
  id: number;
  prioridad: 'Alta' | 'Media' | 'Baja';
  fecha?: string;
  problema: string;
  condominio: string;
  condominioId: number;
  estado: 'En proceso' | 'Asignado' | 'Resuelto';
}
