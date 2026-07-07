import { Component, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

type ModalMode = 'condominio' | 'inquilino' | 'reporte' | 'pago';

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
    switch (this.mode) {
      case 'inquilino':
        return 'Nuevo Inquilino';
      case 'reporte':
        return 'Nuevo Reporte';
      case 'pago':
        return 'Nuevo Pago';
      default:
        return 'Nuevo Condominio';
    }
  }

  get subtitle(): string {
    switch (this.mode) {
      case 'inquilino':
        return 'Registra un nuevo inquilino con sus datos principales.';
      case 'reporte':
        return 'Registra un nuevo reporte con su estado y prioridad.';
      case 'pago':
        return 'Registra un nuevo pago o movimiento financiero.';
      default:
        return 'Registra un nuevo condominio con su información básica.';
    }
  }

  get primaryButtonLabel(): string {
    return 'Guardar';
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

    if (mode === 'reporte') {
      return this.fb.group({
        prioridad: ['Alta', Validators.required],
        condominioNombre: ['', Validators.required],
        estado: ['En proceso', Validators.required],
        concepto: ['', Validators.required]
      });
    }

    if (mode === 'pago') {
      return this.fb.group({
        tipo: ['Ingreso', Validators.required],
        categoria: ['Cuotas', Validators.required],
        metodo: ['Efectivo', Validators.required],
        monto: ['', Validators.required],
        concepto: ['', Validators.required]
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

    if (this.mode === 'reporte') {
      return {
        prioridad: 'Alta',
        condominioNombre: '',
        estado: 'En proceso',
        concepto: ''
      };
    }

    if (this.mode === 'pago') {
      return {
        tipo: 'Ingreso',
        categoria: 'Cuotas',
        metodo: 'Efectivo',
        monto: '',
        concepto: ''
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
