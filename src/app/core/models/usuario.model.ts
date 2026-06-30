// Modelo: Usuario
export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  password?: string;
  rol: 'Administrador' | 'Inquilino' | 'Propietario';
  avatar?: string;
  telefono?: string;
  createdAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}
