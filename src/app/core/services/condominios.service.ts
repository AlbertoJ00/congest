import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Condominio } from '../models/condominio.model';

@Injectable({
  providedIn: 'root'
})
export class CondominiosService {
  private readonly API_URL = '/api/condominios';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Condominio[]> {
    return this.http.get<Condominio[]>(this.API_URL);
  }

  getById(id: number): Observable<Condominio> {
    return this.http.get<Condominio>(`${this.API_URL}/${id}`);
  }

  create(condominio: Partial<Condominio>): Observable<Condominio> {
    return this.http.post<Condominio>(this.API_URL, condominio);
  }

  update(id: number, condominio: Partial<Condominio>): Observable<Condominio> {
    return this.http.put<Condominio>(`${this.API_URL}/${id}`, condominio);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
