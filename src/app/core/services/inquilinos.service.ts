import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Inquilino } from '../models/inquilino.model';

@Injectable({
  providedIn: 'root'
})
export class InquilinosService {
  private readonly API_URL = '/api/inquilinos';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Inquilino[]> {
    return this.http.get<Inquilino[]>(this.API_URL);
  }

  getById(id: number): Observable<Inquilino> {
    return this.http.get<Inquilino>(`${this.API_URL}/${id}`);
  }

  create(inquilino: Partial<Inquilino>): Observable<Inquilino> {
    return this.http.post<Inquilino>(this.API_URL, inquilino);
  }

  update(id: number, inquilino: Partial<Inquilino>): Observable<Inquilino> {
    return this.http.put<Inquilino>(`${this.API_URL}/${id}`, inquilino);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
