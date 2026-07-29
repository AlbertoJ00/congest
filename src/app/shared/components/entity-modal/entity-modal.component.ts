import { Component, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Condominio } from '../../../core/models/condominio.model';
import { Usuario } from '../../../core/models/usuario.model';

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
  @Input() entity: object | null = null;
  @Input() condominios: Condominio[] = [];
  @Input() propietarios: Usuario[] = [];

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

    if ((changes['open'] && this.open) || (changes['entity'] && this.open)) {
      this.entityForm.reset({ ...this.getInitialValue(), ...this.toFormValue(this.entity) });
    }
  }

  get title(): string {
    const action = this.entity ? 'Editar' : 'Nuevo';
    switch (this.mode) {
      case 'inquilino':
        return `${action} Inquilino`;
      case 'reporte':
        return `${action} Reporte`;
      case 'pago':
        return `${action} Pago`;
      default:
        return `${action} Condominio`;
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
    return this.entity ? 'Guardar cambios' : 'Guardar';
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
        condominioId: ['', Validators.required]
      });
    }

    if (mode === 'reporte') {
      return this.fb.group({
        prioridad: ['Alta', Validators.required],
        condominioId: ['', Validators.required],
        estado: ['En proceso', Validators.required],
        concepto: ['', Validators.required]
      });
    }

    if (mode === 'pago') {
      return this.fb.group({
        condominioId: ['', Validators.required],
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
      propietarioId: ['', Validators.required],
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
        condominioId: ''
      };
    }

    if (this.mode === 'reporte') {
      return {
        prioridad: 'Alta',
        condominioId: '',
        estado: 'En proceso',
        concepto: ''
      };
    }

    if (this.mode === 'pago') {
      return {
        condominioId: '',
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
      propietarioId: '',
      descripcion: ''
    };
  }

  private toFormValue(entity: object | null): Record<string, unknown> {
    if (!entity) return {};
    const value = entity as Record<string, unknown>;
    if (this.mode === 'inquilino') {
      const parts = String(value['nombre'] || '').trim().split(/\s+/);
      return { ...value, nombres: parts.shift() || '', apellidos: parts.join(' '), correoElectronico: value['email'] || '' };
    }
    if (this.mode === 'reporte') return { ...value, concepto: value['problema'] || '' };
    return value;
  }
}
