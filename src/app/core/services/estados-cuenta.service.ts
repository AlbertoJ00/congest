import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EstadoDeCuenta, ResumenKPI } from '../models/estado-cuenta.model';

@Injectable({
  providedIn: 'root'
})
export class EstadosCuentaService {
  private readonly API_URL = '/api/estados-cuenta';

  constructor(private http: HttpClient) {}

  getAll(): Observable<EstadoDeCuenta[]> {
    return this.http.get<EstadoDeCuenta[]>(this.API_URL);
  }

  getResumen(): Observable<ResumenKPI> {
    return this.http.get<ResumenKPI>(`${this.API_URL}/resumen`);
  }
}
