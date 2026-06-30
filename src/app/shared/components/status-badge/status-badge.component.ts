import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-status-badge',
  standalone: false,
  templateUrl: './status-badge.component.html',
  styleUrls: ['./status-badge.component.scss']
})
export class StatusBadgeComponent {
  @Input() status: string = '';

  get statusClass(): string {
    const classMap: { [key: string]: string } = {
      'Pagado': 'badge--paid',
      'Atrasado': 'badge--late',
      'Pendiente': 'badge--pending',
      'En uso': 'badge--in-use',
      'En proceso': 'badge--in-process',
      'EN PROCESO': 'badge--in-process',
      'Asignado': 'badge--assigned',
      'ASIGNADO': 'badge--assigned',
      'Resuelto': 'badge--resolved',
      'RESUELTO': 'badge--resolved'
    };
    return classMap[this.status] || 'badge--default';
  }
}
