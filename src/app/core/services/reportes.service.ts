import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Reporte } from '../models/reporte.model';

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private readonly API_URL = '/api/reportes';
  constructor(private http: HttpClient) {}
  getAll(): Observable<Reporte[]> { return this.http.get<Reporte[]>(this.API_URL); }
  getById(id: number): Observable<Reporte> { return this.http.get<Reporte>(`${this.API_URL}/${id}`); }
  create(data: Partial<Reporte>): Observable<Reporte> { return this.http.post<Reporte>(this.API_URL, data); }
  update(id: number, data: Partial<Reporte>): Observable<Reporte> { return this.http.put<Reporte>(`${this.API_URL}/${id}`, data); }
  delete(id: number): Observable<void> { return this.http.delete<void>(`${this.API_URL}/${id}`); }
}
