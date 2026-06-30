import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-kpi-card',
  standalone: false,
  templateUrl: './kpi-card.component.html',
  styleUrls: ['./kpi-card.component.scss']
})
export class KpiCardComponent {
  @Input() icon: string = 'money';
  @Input() title: string = '';
  @Input() value: string = '';
  @Input() highlighted: boolean = false;
}
