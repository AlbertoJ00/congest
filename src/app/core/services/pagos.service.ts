import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pago } from '../models/pago.model';

@Injectable({ providedIn: 'root' })
export class PagosService {
  private readonly API_URL = '/api/pagos';
  constructor(private http: HttpClient) {}
  getAll(): Observable<Pago[]> { return this.http.get<Pago[]>(this.API_URL); }
  getById(id: number): Observable<Pago> { return this.http.get<Pago>(`${this.API_URL}/${id}`); }
  create(data: Partial<Pago>): Observable<Pago> { return this.http.post<Pago>(this.API_URL, data); }
  update(id: number, data: Partial<Pago>): Observable<Pago> { return this.http.put<Pago>(`${this.API_URL}/${id}`, data); }
  delete(id: number): Observable<void> { return this.http.delete<void>(`${this.API_URL}/${id}`); }
}
