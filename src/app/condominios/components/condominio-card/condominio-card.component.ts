import { Component, Input } from '@angular/core';
import { Condominio } from '../../../core/models/condominio.model';

@Component({
  selector: 'app-condominio-card',
  standalone: false,
  templateUrl: './condominio-card.component.html',
  styleUrls: ['./condominio-card.component.scss']
})
export class CondominioCardComponent {
  @Input() condominio!: Condominio;
  
  // Dummy images based on id for demo purposes
  get placeholderImage(): string {
    const images = [
      'https://placehold.co/600x400/D1D5DB/4B5563?text=Brisa+del+Este',
      'https://placehold.co/600x400/93C5FD/1E3A8A?text=Herrera+90',
      'https://placehold.co/600x400/FCA5A5/7F1D1D?text=Naco+A-023',
      'https://placehold.co/600x400/FCD34D/78350F?text=Naco+A-024',
      'https://placehold.co/600x400/86EFAC/14532D?text=Bella+Vista',
      'https://placehold.co/600x400/C4B5FD/4C1D95?text=Unidad+D-405'
    ];
    return this.condominio.imagen || images[(this.condominio.id % images.length) || 0];
  }
}
