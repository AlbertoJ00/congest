import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, EMPTY, Observable, tap } from 'rxjs';
import { Usuario, LoginRequest, LoginResponse } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API_URL = '/api/auth';
  private readonly TOKEN_KEY = 'congest_token';
  private currentUserSubject = new BehaviorSubject<Usuario | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // El perfil se migra del navegador a SQLite; aquí solo se conserva el token de sesión.
    localStorage.removeItem('congest_user');
    if (this.getToken() === 'mock-jwt-token') {
      localStorage.removeItem(this.TOKEN_KEY);
    }
    if (this.getToken()) {
      this.http.get<Usuario>(`${this.API_URL}/me`).pipe(
        tap(user => this.currentUserSubject.next(user)),
        catchError(() => {
          this.logout();
          return EMPTY;
        })
      ).subscribe();
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap(response => {
        localStorage.setItem(this.TOKEN_KEY, response.token);
        this.currentUserSubject.next(response.usuario);
      })
    );
  }

  register(data: Partial<Usuario>): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.API_URL}/register`, data);
  }

  requestPasswordReset(email: string): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/forgot-password`, { email });
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): Usuario | null {
    return this.currentUserSubject.value;
  }

  getCurrentRole(): Usuario['rol'] | null {
    const currentRole = this.currentUserSubject.value?.rol;
    if (currentRole) return currentRole;
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(payload)).rol || null;
    } catch {
      return null;
    }
  }

  hasRole(...roles: Usuario['rol'][]): boolean {
    const role = this.getCurrentRole();
    return !!role && roles.includes(role);
  }

  updateCurrentUser(updates: Partial<Usuario>): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.API_URL}/me`, updates).pipe(
      tap(user => this.currentUserSubject.next(user))
    );
  }
}
