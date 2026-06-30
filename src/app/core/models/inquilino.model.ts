// Modelo: Inquilino
export interface Inquilino {
  id: number;
  nombre: string;
  email: string;
  documento: string;
  tipoDocumento: string; // 'Cédula'
  celular: string;
  proximaFechaPago: string;
  montoAlquiler: number;
  estado: EstadoInquilino;
  condominioId: number;
  condominioNombre?: string;
  avatar?: string;
  createdAt?: string;
}

export type EstadoInquilino = 'Pagado' | 'Atrasado' | 'Pendiente';
