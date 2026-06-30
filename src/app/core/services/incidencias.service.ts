import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Incidencia, ResumenIncidencias } from '../models/incidencia.model';

@Injectable({
  providedIn: 'root'
})
export class IncidenciasService {
  private readonly API_URL = '/api/incidencias';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Incidencia[]> {
    return this.http.get<Incidencia[]>(this.API_URL);
  }

  getResumen(): Observable<ResumenIncidencias> {
    return this.http.get<ResumenIncidencias>(`${this.API_URL}/resumen`);
  }
}
