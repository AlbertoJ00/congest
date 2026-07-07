import { Component, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

type ModalMode = 'condominio' | 'inquilino';

@Component({
  selector: 'app-entity-modal',
  standalone: false,
  templateUrl: './entity-modal.component.html',
  styleUrls: ['./entity-modal.component.scss']
})
export class EntityModalComponent implements OnChanges {
  @Input() open = false;
  @Input() mode: ModalMode = 'condominio';

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Record<string, unknown>>();

  entityForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.entityForm = this.buildForm(this.mode);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode']) {
      this.entityForm = this.buildForm(this.mode);
    }

    if (changes['open'] && this.open) {
      this.entityForm.reset(this.getInitialValue());
    }
  }

  get title(): string {
    return this.mode === 'inquilino' ? 'Nuevo Inquilino' : 'Nuevo Condominio';
  }

  get subtitle(): string {
    return this.mode === 'inquilino'
      ? 'Registra un nuevo inquilino con sus datos principales.'
      : 'Registra un nuevo condominio con su información básica.';
  }

  get primaryButtonLabel(): string {
    return this.mode === 'inquilino' ? 'Guardar' : 'Guardar';
  }

  closeModal(): void {
    this.close.emit();
  }

  submit(): void {
    if (this.entityForm.invalid) {
      this.entityForm.markAllAsTouched();
      return;
    }

    this.save.emit(this.entityForm.getRawValue());
    this.entityForm.reset(this.getInitialValue());
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.open) {
      this.closeModal();
    }
  }

  private buildForm(mode: ModalMode): FormGroup {
    if (mode === 'inquilino') {
      return this.fb.group({
        tipoDocumento: ['Cedula', Validators.required],
        documento: ['', Validators.required],
        nombres: ['', Validators.required],
        apellidos: ['', Validators.required],
        correoElectronico: ['', [Validators.required, Validators.email]],
        celular: ['', Validators.required],
        telefonoAdicional: [''],
        tipoSangre: [''],
        estadoCivil: [''],
        condominioNombre: ['', Validators.required]
      });
    }

    return this.fb.group({
      nombre: ['', Validators.required],
      ciudad: ['', Validators.required],
      sector: ['', Validators.required],
      precio: ['', Validators.required],
      cuartos: ['', Validators.required],
      banos: ['', Validators.required],
      capacidad: ['', Validators.required],
      descripcion: ['']
    });
  }

  private getInitialValue(): Record<string, unknown> {
    if (this.mode === 'inquilino') {
      return {
        tipoDocumento: 'Cedula',
        documento: '',
        nombres: '',
        apellidos: '',
        correoElectronico: '',
        celular: '',
        telefonoAdicional: '',
        tipoSangre: '',
        estadoCivil: '',
        condominioNombre: ''
      };
    }

    return {
      nombre: '',
      ciudad: '',
      sector: '',
      precio: '',
      cuartos: '',
      banos: '',
      capacidad: '',
      descripcion: ''
    };
  }
}
