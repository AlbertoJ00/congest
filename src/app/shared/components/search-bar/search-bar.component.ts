import { Component, EventEmitter, Input, Output, OnDestroy } from '@angular/core';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-search-bar',
  standalone: false,
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss']
})
export class SearchBarComponent implements OnDestroy {
  @Input() placeholder: string = 'Buscar';
  @Output() searchChange = new EventEmitter<string>();

  private searchSubject = new Subject<string>();
  searchValue: string = '';

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      this.searchChange.emit(value);
    });
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchValue = value;
    this.searchSubject.next(value);
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }
}
