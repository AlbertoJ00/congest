const bcrypt = require('bcryptjs');
const { get, run } = require('./database');

async function insertIfEmpty(table, insertRows) {
  const row = await get(`SELECT COUNT(*) AS total FROM ${table}`);
  if (row.total === 0) await insertRows();
}

async function seedDatabase() {
  await insertIfEmpty('usuarios', async () => {
    const passwordAdmin = await bcrypt.hash('admin123', 10);
    const passwordOwner = await bcrypt.hash('propietario123', 10);
    await run(`INSERT INTO usuarios (nombre, apellido, email, password_hash, rol, telefono)
      VALUES (?, ?, ?, ?, ?, ?)`, ['Admin Congest', 'Principal', 'admin@congest.com', passwordAdmin, 'Administrador', '+1 809 555 0101']);
    await run(`INSERT INTO usuarios (nombre, apellido, email, password_hash, rol, telefono)
      VALUES (?, ?, ?, ?, ?, ?)`, ['Ana Propietaria', 'Demo', 'ana@congest.com', passwordOwner, 'Propietario', '+1 809 555 0102']);
  });

  await insertIfEmpty('condominios', async () => {
    for (let index = 0; index < 6; index += 1) {
      await run(`INSERT INTO condominios (nombre, ciudad, sector, precio, cuartos, banos, capacidad)
        VALUES (?, ?, ?, ?, ?, ?, ?)`, ['Brisa Del Este #56', 'Santo Domingo Este', 'Naco', 12900, 4, 2, 9]);
    }
  });

  await insertIfEmpty('inquilinos', async () => {
    const rows = [
      ['Dianne Russell', 'nevaeh.simmons@example.com', '000-0000000-0', 'Cédula', '(270) 555-0117', '15 De Julio', 12540, 'Pagado', 1, 'Brisa del este #56'],
      ['Darrell Steward', 'sara.cruz@example.com', '000-0000000-0', 'Cédula', '(307) 555-0133', '11 De Julio', 10390, 'Atrasado', 1, 'Brisa del este #51'],
      ['Cameron Williamson', 'bill.sanders@example.com', '000-0000000-0', 'Cédula', '(480) 555-0103', '15 De Julio', 12540, 'Pagado', 1, 'Brisa del este #256'],
      ['Ralph Edwards', 'michael.mitc@example.com', '000-0000000-0', 'Cédula', '(217) 555-0113', '18 De Julio', 10100, 'Pendiente', 2, 'Jardín #43'],
      ['Jenny Wilson', 'curtis.weaver@example.com', '000-0000000-0', 'Cédula', '(201) 555-0124', '15 De Julio', 12000, 'Pagado', 3, 'Isabel Aguiar #4'],
      ['Guy Hawkins', 'alma.lawson@example.com', '000-0000000-0', 'Cédula', '(505) 555-0125', '12 De Julio', 15250, 'Pagado', 4, 'Herrera 2do piso'],
      ['Courtney Henry', 'georgia.young@example.com', '000-0000000-0', 'Cédula', '(629) 555-0129', '11 De Julio', 20500, 'Atrasado', 5, 'Los minas bulevar']
    ];
    for (const row of rows) {
      await run(`INSERT INTO inquilinos
        (nombre, email, documento, tipo_documento, celular, proxima_fecha_pago, monto_alquiler, estado, condominio_id, condominio_nombre)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, row);
    }
  });

  await insertIfEmpty('estados_cuenta', async () => {
    const rows = [
      ['96192', 1, 'Leslie Alexander', 'Herrera #90', '809 123-4567', 'Pagado', 10000, 'junio', 2026],
      ['96192', 3, 'Cameron Williamson', 'Naco A-023', '809 123-4567', 'Atrasado', 12000, 'junio', 2026],
      ['96192', 7, 'Courtney Henry', 'Bella Vista 2do Piso', '809 123-4567', 'Pagado', 10000, 'junio', 2026],
      ['96192', 4, 'Darlene Robertson', 'Unidad D-405', '809 123-4567', 'Pendiente', 13300, 'junio', 2026],
      ['96192', 6, 'Guy Hawkins', 'Naco A-024', '809 123-4567', 'En uso', 11900, 'junio', 2026]
    ];
    for (const row of rows) {
      await run(`INSERT INTO estados_cuenta
        (numero, inquilino_id, inquilino_nombre, condominio_nombre, celular, estado, cuota, mes, anio)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, row);
    }
  });

  await insertIfEmpty('incidencias', async () => {
    const rows = [
      ['Fuga en estacionamiento', 'Sótano N-2', 'Hace 2h', 'En proceso', 'alta'],
      ['Elevador 3 fuera de servicio', 'Torre B', 'Hace 5h', 'Asignado', 'media'],
      ['Iluminación pasillo 4to piso', 'Torre A', 'Ayer', 'Resuelto', 'baja'],
      ['Iluminación pasillo 3er piso', 'Torre A', 'Ayer', 'Resuelto', 'baja']
    ];
    for (const row of rows) {
      await run(`INSERT INTO incidencias (titulo, ubicacion, tiempo, estado, severidad)
        VALUES (?, ?, ?, ?, ?)`, row);
    }
  });

  await insertIfEmpty('actividades', async () => {
    const rows = [
      ['pago', 'realizó un pago de', 'hace 5 min', 'María López', 3200, 'B-108'],
      ['anuncio', 'publicó el anuncio Corte programado de agua', 'hace 1 h', 'Admin. Ana', null, null],
      ['incidencia', 'reportó incidencia Fuga en estacionamiento', 'hace 2 h', 'Jorge Mendoza', null, null],
      ['sistema', 'generó recibos del mes de Julio · 84 unidades', 'hace 6 h', 'Sistema', null, null],
      ['reserva', 'reservó Salón social · 15 jul', 'ayer', 'Laura Vega', null, null]
    ];
    for (const row of rows) {
      await run(`INSERT INTO actividades (tipo, descripcion, tiempo, nombre_persona, monto, unidad)
        VALUES (?, ?, ?, ?, ?, ?)`, row);
    }
  });

  await insertIfEmpty('ingresos_gastos', async () => {
    const rows = [
      ['Ene', 1, 1000, 5000], ['Feb', 2, 2000, 4500], ['Mar', 3, 3500, 3500],
      ['Abr', 4, 5000, 3000], ['May', 5, 4500, 2000], ['Jun', 6, 4800, 1500]
    ];
    for (const row of rows) await run('INSERT INTO ingresos_gastos (mes, orden, ingresos, gastos) VALUES (?, ?, ?, ?)', row);
  });

  await insertIfEmpty('pagos', async () => {
    const rows = [
      ['Cobranza cuotas mantenimiento', 'Cuotas', 'Ingreso', 140000, 'Efectivo'],
      ['Reparación bomba hidráulica', 'Servicios', 'Gasto', 2000, 'Transferencia'],
      ['Cobranza cuotas mantenimiento', 'Cuotas', 'Ingreso', 140000, 'Efectivo'],
      ['Cobranza cuotas mantenimiento', 'Cuotas', 'Ingreso', 140000, 'Efectivo'],
      ['Reparación bomba hidráulica', 'Servicios', 'Gasto', 2000, 'Transferencia'],
      ['Reparación bomba hidráulica', 'Servicios', 'Gasto', 2000, 'Transferencia'],
      ['Cobranza cuotas mantenimiento', 'Cuotas', 'Ingreso', 140000, 'Efectivo'],
      ['Cobranza cuotas mantenimiento', 'Cuotas', 'Ingreso', 140000, 'Efectivo'],
      ['Cobranza cuotas mantenimiento', 'Cuotas', 'Ingreso', 140000, 'Efectivo'],
      ['Cobranza cuotas mantenimiento', 'Cuotas', 'Ingreso', 140000, 'Efectivo']
    ];
    for (const row of rows) {
      await run(`INSERT INTO pagos (fecha, concepto, categoria, tipo, monto, metodo)
        VALUES ('2026-06-30 10:24:00', ?, ?, ?, ?, ?)`, row);
    }
  });

  await insertIfEmpty('reportes', async () => {
    const priorities = ['Alta', 'Media', 'Media', 'Alta', 'Media', 'Media', 'Baja', 'Baja', 'Baja', 'Alta'];
    for (let index = 0; index < priorities.length; index += 1) {
      const problem = [1, 4, 5].includes(index)
        ? 'Reparación bomba hidráulica'
        : 'Cobranza cuotas mantenimiento';
      await run(`INSERT INTO reportes (prioridad, fecha, problema, condominio, estado)
        VALUES (?, '2026-06-30 10:24:00', ?, 'Brisa del este #56', 'En proceso')`, [priorities[index], problem]);
    }
  });

  const owner = await get("SELECT id FROM usuarios WHERE email = 'ana@congest.com'");
  if (owner) {
    await run('UPDATE condominios SET propietario_id = ? WHERE propietario_id IS NULL', [owner.id]);
  }
  await run('UPDATE pagos SET condominio_id = 1 WHERE condominio_id IS NULL');
  await run('UPDATE reportes SET condominio_id = 1 WHERE condominio_id IS NULL');
  await run('UPDATE incidencias SET condominio_id = 1 WHERE condominio_id IS NULL');
  await run('UPDATE actividades SET condominio_id = 1 WHERE condominio_id IS NULL');
}

module.exports = { seedDatabase };
