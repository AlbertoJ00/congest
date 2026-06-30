import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Actividad, IngresoGasto } from '../models/actividad.model';

@Injectable({
  providedIn: 'root'
})
export class ActividadesService {
  private readonly API_URL = '/api/actividades';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Actividad[]> {
    return this.http.get<Actividad[]>(this.API_URL);
  }

  getIngresosGastos(): Observable<IngresoGasto[]> {
    return this.http.get<IngresoGasto[]>(`${this.API_URL}/ingresos-gastos`);
  }
}
