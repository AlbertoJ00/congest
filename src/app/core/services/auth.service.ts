import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, delay, Observable, of, tap, throwError } from 'rxjs';
import { Usuario, LoginRequest, LoginResponse } from '../models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = '/api/auth';
  private readonly USE_MOCK_AUTH = true;
  private currentUserSubject = new BehaviorSubject<Usuario | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private readonly mockUsers: Usuario[] = [
    {
      id: 1,
      nombre: 'Admin Congest',
      apellido: 'Principal',
      email: 'admin@congest.com',
      password: 'admin123',
      rol: 'Administrador',
      telefono: '+1 809 555 0101',
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      nombre: 'Ana Propietaria',
      apellido: 'Demo',
      email: 'ana@congest.com',
      password: 'propietario123',
      rol: 'Propietario',
      telefono: '+1 809 555 0102',
      createdAt: new Date().toISOString()
    }
  ];

  constructor(private http: HttpClient) {
    // Restaurar usuario desde localStorage al iniciar
    const storedUser = localStorage.getItem('congest_user');
    if (storedUser) {
      this.currentUserSubject.next(JSON.parse(storedUser));
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    if (this.USE_MOCK_AUTH) {
      return this.mockLogin(credentials).pipe(
        tap(response => {
          localStorage.setItem('congest_token', response.token);
          localStorage.setItem('congest_user', JSON.stringify(response.usuario));
          this.currentUserSubject.next(response.usuario);
        })
      );
    }

    return this.http.post<LoginResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap(response => {
        localStorage.setItem('congest_token', response.token);
        localStorage.setItem('congest_user', JSON.stringify(response.usuario));
        this.currentUserSubject.next(response.usuario);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('congest_token');
    localStorage.removeItem('congest_user');
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('congest_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): Usuario | null {
    return this.currentUserSubject.value;
  }

  updateCurrentUser(updates: Partial<Usuario>): void {
    const currentUser = this.currentUserSubject.value;

    if (!currentUser) {
      return;
    }

    const updatedUser: Usuario = {
      ...currentUser,
      ...updates
    };

    localStorage.setItem('congest_user', JSON.stringify(updatedUser));
    this.currentUserSubject.next(updatedUser);

    const mockUser = this.mockUsers.find(user => user.id === updatedUser.id);
    if (mockUser) {
      Object.assign(mockUser, updatedUser);
    }
  }

  private mockLogin(credentials: LoginRequest): Observable<LoginResponse> {
    const user = this.mockUsers.find(
      candidate =>
        candidate.email.toLowerCase() === credentials.email.toLowerCase() &&
        candidate.password === credentials.password
    );

    if (!user) {
      return throwError(() => ({
        error: {
          message: 'Credenciales invalidas. Usa admin@congest.com / admin123.'
        }
      }));
    }

    const { password, ...usuario } = user;

    return of({
      token: 'mock-jwt-token',
      usuario
    }).pipe(delay(400));
  }
}
