// Modelo: Condominio
export interface Condominio {
  id: number;
  nombre: string;
  ubicacion?: string;
  ciudad: string;
  sector: string;
  precio: number;
  cuartos: number;
  banos: number;
  capacidad: number;
  imagen?: string;
  imagenesAdicionales?: string[];
  descripcion?: string;
  propietarioId?: number;
  createdAt?: string;
}
