import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Usuario } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly API_URL = '/api/usuarios';
  constructor(private http: HttpClient) {}
  getAll(): Observable<Usuario[]> { return this.http.get<Usuario[]>(this.API_URL); }
  getById(id: number): Observable<Usuario> { return this.http.get<Usuario>(`${this.API_URL}/${id}`); }
  create(data: Partial<Usuario>): Observable<Usuario> { return this.http.post<Usuario>(this.API_URL, data); }
  update(id: number, data: Partial<Usuario>): Observable<Usuario> { return this.http.put<Usuario>(`${this.API_URL}/${id}`, data); }
  delete(id: number): Observable<void> { return this.http.delete<void>(`${this.API_URL}/${id}`); }
}
