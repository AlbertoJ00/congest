require('dotenv').config();

const bcrypt = require('bcryptjs');
const express = require('express');
const jwt = require('jsonwebtoken');
const { all, databasePath, get, initializeDatabase, run } = require('./database');
const { seedDatabase } = require('./seed');

const app = express();
const port = Number(process.env.API_PORT || 3000);
const jwtSecret = process.env.JWT_SECRET || 'congest-development-secret-change-me';

app.use(express.json({ limit: '1mb' }));

const asyncRoute = (handler) => (request, response, next) => {
  Promise.resolve(handler(request, response, next)).catch(next);
};

const userSelect = `
  SELECT id, nombre, apellido, email, rol, avatar, telefono, created_at AS "createdAt"
  FROM usuarios
`;

function signToken(user) {
  return jwt.sign({ sub: user.id, rol: user.rol }, jwtSecret, { expiresIn: '8h' });
}

function authenticate(request, response, next) {
  const authorization = request.headers.authorization || '';
  const [scheme, token] = authorization.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return response.status(401).json({ message: 'Debes iniciar sesión.' });
  }

  try {
    request.auth = jwt.verify(token, jwtSecret);
    return next();
  } catch {
    return response.status(401).json({ message: 'La sesión expiró. Inicia sesión nuevamente.' });
  }
}

function requireRole(...roles) {
  return (request, response, next) => {
    if (!roles.includes(request.auth.rol)) {
      return response.status(403).json({ message: 'No tienes permisos para realizar esta acción.' });
    }
    return next();
  };
}

function ownerScope(resource, auth) {
  if (auth.rol === 'Administrador') return { clause: '', params: [] };
  const ownerId = auth.sub;
  switch (resource.table) {
    case 'condominios':
      return { clause: 'propietario_id = ?', params: [ownerId] };
    case 'inquilinos':
    case 'pagos':
    case 'reportes':
    case 'incidencias':
      return { clause: 'condominio_id IN (SELECT id FROM condominios WHERE propietario_id = ?)', params: [ownerId] };
    case 'estados_cuenta':
      return { clause: `inquilino_id IN (
        SELECT i.id FROM inquilinos i JOIN condominios c ON c.id = i.condominio_id WHERE c.propietario_id = ?
      )`, params: [ownerId] };
    default:
      return { clause: '1 = 0', params: [] };
  }
}

async function canAccessCondominio(condominioId, auth) {
  if (auth.rol === 'Administrador') return true;
  if (!condominioId) return false;
  return !!(await get('SELECT id FROM condominios WHERE id = ? AND propietario_id = ?', [condominioId, auth.sub]));
}

async function audit(auth, action, entity, entityId, detail = null) {
  await run(`INSERT INTO auditoria (usuario_id, accion, entidad, entidad_id, detalle)
    VALUES (?, ?, ?, ?, ?)`, [auth.sub, action, entity, entityId, detail ? JSON.stringify(detail) : null]);
}

function requireFields(body, fields) {
  return fields.filter((field) => body[field] === undefined || body[field] === null || body[field] === '');
}

function selectList(table, fields) {
  return `SELECT ${fields.map(({ column, property }) =>
    column === property ? column : `${column} AS "${property}"`).join(', ')} FROM ${table}`;
}

const resources = {
  condominios: {
    table: 'condominios',
    required: ['nombre', 'ciudad', 'sector', 'propietarioId'],
    fields: [
      ['id', 'id'], ['nombre', 'nombre'], ['ubicacion', 'ubicacion'], ['ciudad', 'ciudad'],
      ['sector', 'sector'], ['precio', 'precio'], ['cuartos', 'cuartos'], ['banos', 'banos'],
      ['capacidad', 'capacidad'], ['imagen', 'imagen'], ['descripcion', 'descripcion'],
      ['propietario_id', 'propietarioId'], ['created_at', 'createdAt']
    ]
  },
  inquilinos: {
    table: 'inquilinos',
    required: ['nombre', 'email', 'documento', 'tipoDocumento', 'celular', 'proximaFechaPago', 'estado', 'condominioId'],
    fields: [
      ['id', 'id'], ['nombre', 'nombre'], ['email', 'email'], ['documento', 'documento'],
      ['tipo_documento', 'tipoDocumento'], ['celular', 'celular'], ['proxima_fecha_pago', 'proximaFechaPago'],
      ['monto_alquiler', 'montoAlquiler'], ['estado', 'estado'], ['condominio_id', 'condominioId'],
      ['condominio_nombre', 'condominioNombre'], ['es_principal', 'esPrincipal'], ['avatar', 'avatar'], ['created_at', 'createdAt']
    ]
  },
  pagos: {
    table: 'pagos',
    required: ['concepto', 'categoria', 'tipo', 'monto', 'metodo', 'condominioId'],
    fields: [
      ['id', 'id'], ['fecha', 'fecha'], ['concepto', 'concepto'], ['categoria', 'categoria'],
      ['tipo', 'tipo'], ['monto', 'monto'], ['metodo', 'metodo'], ['condominio_id', 'condominioId']
    ]
  },
  reportes: {
    table: 'reportes',
    required: ['prioridad', 'problema', 'condominio', 'estado', 'condominioId'],
    fields: [
      ['id', 'id'], ['prioridad', 'prioridad'], ['fecha', 'fecha'], ['problema', 'problema'],
      ['condominio', 'condominio'], ['estado', 'estado'], ['condominio_id', 'condominioId']
    ]
  },
  incidencias: {
    table: 'incidencias',
    required: ['titulo', 'ubicacion', 'tiempo', 'estado', 'severidad', 'condominioId'],
    fields: [
      ['id', 'id'], ['titulo', 'titulo'], ['descripcion', 'descripcion'], ['ubicacion', 'ubicacion'],
      ['tiempo', 'tiempo'], ['estado', 'estado'], ['severidad', 'severidad'],
      ['reportado_por', 'reportadoPor'], ['condominio_id', 'condominioId'], ['created_at', 'createdAt']
    ]
  },
  'estados-cuenta': {
    table: 'estados_cuenta',
    required: ['numero', 'inquilinoId', 'inquilinoNombre', 'condominioNombre', 'celular', 'estado', 'cuota', 'mes', 'anio'],
    fields: [
      ['id', 'id'], ['numero', 'numero'], ['inquilino_id', 'inquilinoId'],
      ['inquilino_nombre', 'inquilinoNombre'], ['inquilino_avatar', 'inquilinoAvatar'],
      ['condominio_nombre', 'condominioNombre'], ['celular', 'celular'], ['estado', 'estado'],
      ['cuota', 'cuota'], ['mes', 'mes'], ['anio', 'anio'], ['created_at', 'createdAt']
    ]
  }
};

for (const resource of Object.values(resources)) {
  resource.fields = resource.fields.map(([column, property]) => ({ column, property }));
  resource.select = selectList(resource.table, resource.fields);
}

app.get('/api/health', asyncRoute(async (_request, response) => {
  await get('SELECT 1 AS ok');
  response.json({ status: 'ok', database: databasePath });
}));

app.post('/api/auth/login', asyncRoute(async (request, response) => {
  const { email, password } = request.body;
  if (!email || !password) return response.status(400).json({ message: 'Correo y contraseña son obligatorios.' });

  const record = await get('SELECT * FROM usuarios WHERE email = ?', [String(email).trim()]);
  if (!record || !(await bcrypt.compare(password, record.password_hash))) {
    return response.status(401).json({ message: 'Correo o contraseña incorrectos.' });
  }

  const user = await get(`${userSelect} WHERE id = ?`, [record.id]);
  return response.json({ token: signToken(user), usuario: user });
}));

app.post('/api/auth/register', asyncRoute(async (request, response) => {
  const missing = requireFields(request.body, ['nombre', 'email', 'password']);
  if (missing.length) return response.status(400).json({ message: `Faltan campos obligatorios: ${missing.join(', ')}.` });
  if (String(request.body.password).length < 8) return response.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres.' });

  const passwordHash = await bcrypt.hash(request.body.password, 10);
  const result = await run(`INSERT INTO usuarios (nombre, apellido, email, password_hash, rol, avatar, telefono)
    VALUES (?, ?, ?, ?, ?, ?, ?)`, [
    String(request.body.nombre).trim(), request.body.apellido || null, String(request.body.email).trim(),
    passwordHash, 'Propietario', request.body.avatar || null, request.body.telefono || null
  ]);
  const user = await get(`${userSelect} WHERE id = ?`, [result.lastID]);
  return response.status(201).json(user);
}));

app.post('/api/auth/forgot-password', asyncRoute(async (_request, response) => {
  // Respuesta deliberadamente genérica para no revelar si una cuenta existe.
  response.status(204).send();
}));

app.get('/api/auth/me', authenticate, asyncRoute(async (request, response) => {
  const user = await get(`${userSelect} WHERE id = ?`, [request.auth.sub]);
  if (!user) return response.status(401).json({ message: 'El usuario de la sesión ya no existe.' });
  return response.json(user);
}));

app.put('/api/auth/me', authenticate, asyncRoute(async (request, response) => {
  const allowed = ['nombre', 'apellido', 'email', 'avatar', 'telefono'];
  const entries = allowed.filter((property) => request.body[property] !== undefined);
  if (!entries.length) return response.status(400).json({ message: 'No hay datos para actualizar.' });
  await run(`UPDATE usuarios SET ${entries.map((field) => `${field} = ?`).join(', ')} WHERE id = ?`,
    [...entries.map((field) => request.body[field]), request.auth.sub]);
  const user = await get(`${userSelect} WHERE id = ?`, [request.auth.sub]);
  return response.json(user);
}));

app.use('/api', authenticate);

app.get('/api/usuarios', requireRole('Administrador'), asyncRoute(async (_request, response) => {
  response.json(await all(`${userSelect} ORDER BY id DESC`));
}));

app.get('/api/usuarios/:id', requireRole('Administrador'), asyncRoute(async (request, response) => {
  const user = await get(`${userSelect} WHERE id = ?`, [request.params.id]);
  if (!user) return response.status(404).json({ message: 'Usuario no encontrado.' });
  return response.json(user);
}));

app.post('/api/usuarios', requireRole('Administrador'), asyncRoute(async (request, response) => {
  const missing = requireFields(request.body, ['nombre', 'email', 'password', 'rol']);
  if (missing.length) return response.status(400).json({ message: `Faltan campos obligatorios: ${missing.join(', ')}.` });
  const passwordHash = await bcrypt.hash(request.body.password, 10);
  const result = await run(`INSERT INTO usuarios (nombre, apellido, email, password_hash, rol, avatar, telefono)
    VALUES (?, ?, ?, ?, ?, ?, ?)`, [request.body.nombre, request.body.apellido || null, request.body.email,
    passwordHash, request.body.rol, request.body.avatar || null, request.body.telefono || null]);
  await audit(request.auth, 'crear', 'usuarios', result.lastID, { email: request.body.email, rol: request.body.rol });
  response.status(201).json(await get(`${userSelect} WHERE id = ?`, [result.lastID]));
}));

app.put('/api/usuarios/:id', requireRole('Administrador'), asyncRoute(async (request, response) => {
  const columns = { nombre: 'nombre', apellido: 'apellido', email: 'email', rol: 'rol', avatar: 'avatar', telefono: 'telefono' };
  const updates = Object.entries(columns).filter(([property]) => request.body[property] !== undefined);
  if (request.body.password) {
    updates.push(['password', 'password_hash']);
    request.body.password = await bcrypt.hash(request.body.password, 10);
  }
  if (!updates.length) return response.status(400).json({ message: 'No hay datos para actualizar.' });
  const result = await run(`UPDATE usuarios SET ${updates.map(([, column]) => `${column} = ?`).join(', ')} WHERE id = ?`,
    [...updates.map(([property]) => request.body[property]), request.params.id]);
  if (!result.changes) return response.status(404).json({ message: 'Usuario no encontrado.' });
  await audit(request.auth, 'editar', 'usuarios', Number(request.params.id), { campos: updates.map(([, column]) => column) });
  return response.json(await get(`${userSelect} WHERE id = ?`, [request.params.id]));
}));

app.delete('/api/usuarios/:id', requireRole('Administrador'), asyncRoute(async (request, response) => {
  if (Number(request.params.id) === Number(request.auth.sub)) {
    return response.status(409).json({ message: 'No puedes eliminar el usuario de tu sesión.' });
  }
  const result = await run('DELETE FROM usuarios WHERE id = ?', [request.params.id]);
  if (!result.changes) return response.status(404).json({ message: 'Usuario no encontrado.' });
  await audit(request.auth, 'eliminar', 'usuarios', Number(request.params.id));
  return response.status(204).send();
}));

app.get('/api/auditoria', requireRole('Administrador'), asyncRoute(async (_request, response) => {
  response.json(await all(`SELECT a.id, a.accion, a.entidad, a.entidad_id AS "entidadId", a.detalle,
    a.created_at AS "createdAt", u.nombre AS usuarioNombre, u.email AS usuarioEmail
    FROM auditoria a LEFT JOIN usuarios u ON u.id = a.usuario_id ORDER BY a.id DESC LIMIT 250`));
}));

app.get('/api/actividades/ingresos-gastos', asyncRoute(async (request, response) => {
  if (request.auth.rol === 'Administrador') {
    return response.json(await all('SELECT mes, ingresos, gastos FROM ingresos_gastos ORDER BY orden'));
  }
  const rows = await all(`SELECT
    CASE strftime('%m', fecha)
      WHEN '01' THEN 'Ene' WHEN '02' THEN 'Feb' WHEN '03' THEN 'Mar'
      WHEN '04' THEN 'Abr' WHEN '05' THEN 'May' WHEN '06' THEN 'Jun'
      WHEN '07' THEN 'Jul' WHEN '08' THEN 'Ago' WHEN '09' THEN 'Sep'
      WHEN '10' THEN 'Oct' WHEN '11' THEN 'Nov' ELSE 'Dic' END AS mes,
    SUM(CASE WHEN tipo = 'Ingreso' THEN monto ELSE 0 END) AS ingresos,
    SUM(CASE WHEN tipo = 'Gasto' THEN monto ELSE 0 END) AS gastos,
    strftime('%Y-%m', fecha) AS periodo
    FROM pagos WHERE condominio_id IN (SELECT id FROM condominios WHERE propietario_id = ?)
    GROUP BY periodo ORDER BY periodo`, [request.auth.sub]);
  return response.json(rows.map(({ periodo, ...row }) => row));
}));

app.get('/api/actividades', asyncRoute(async (request, response) => {
  const scope = request.auth.rol === 'Administrador'
    ? { sql: '', params: [] }
    : { sql: 'WHERE condominio_id IN (SELECT id FROM condominios WHERE propietario_id = ?)', params: [request.auth.sub] };
  response.json(await all(`SELECT id, tipo, descripcion, tiempo, nombre_persona AS "nombrePersona",
    monto, unidad, created_at AS "createdAt" FROM actividades ${scope.sql} ORDER BY id DESC`, scope.params));
}));

app.get('/api/estados-cuenta/resumen', asyncRoute(async (request, response) => {
  const paymentScope = request.auth.rol === 'Administrador'
    ? { sql: '', params: [] }
    : { sql: 'WHERE condominio_id IN (SELECT id FROM condominios WHERE propietario_id = ?)', params: [request.auth.sub] };
  const totals = await get(`SELECT
    COALESCE(SUM(CASE WHEN tipo = 'Ingreso' THEN monto ELSE 0 END), 0) AS recaudacionMes,
    COALESCE(SUM(CASE WHEN tipo = 'Gasto' THEN monto ELSE 0 END), 0) AS gastosMes
    FROM pagos ${paymentScope.sql}`, paymentScope.params);
  const stateScope = request.auth.rol === 'Administrador'
    ? { sql: '', params: [] }
    : { sql: `WHERE inquilino_id IN (SELECT i.id FROM inquilinos i
        JOIN condominios c ON c.id = i.condominio_id WHERE c.propietario_id = ?)`, params: [request.auth.sub] };
  const payments = await get(`SELECT COUNT(*) AS totalPagos,
    SUM(CASE WHEN estado = 'Pagado' THEN 1 ELSE 0 END) AS pagosAlDia FROM estados_cuenta ${stateScope.sql}`, stateScope.params);
  response.json({
    ...totals,
    totalPagos: payments.totalPagos,
    pagosAlDia: payments.pagosAlDia || 0,
    gananciasMes: totals.recaudacionMes - totals.gastosMes
  });
}));

app.get('/api/incidencias/resumen', asyncRoute(async (request, response) => {
  const scope = request.auth.rol === 'Administrador'
    ? { sql: '', params: [] }
    : { sql: 'WHERE condominio_id IN (SELECT id FROM condominios WHERE propietario_id = ?)', params: [request.auth.sub] };
  const result = await get(`SELECT
    SUM(CASE WHEN estado != 'Resuelto' THEN 1 ELSE 0 END) AS abiertas,
    SUM(CASE WHEN estado = 'Resuelto' THEN 1 ELSE 0 END) AS resueltasHoy
    FROM incidencias ${scope.sql}`, scope.params);
  response.json({ abiertas: result.abiertas || 0, resueltasHoy: result.resueltasHoy || 0 });
}));

for (const [routeName, resource] of Object.entries(resources)) {
  app.get(`/api/${routeName}`, asyncRoute(async (request, response) => {
    const scope = ownerScope(resource, request.auth);
    const where = scope.clause ? `WHERE ${scope.clause}` : '';
    response.json(await all(`${resource.select} ${where} ORDER BY id DESC`, scope.params));
  }));

  app.get(`/api/${routeName}/:id`, asyncRoute(async (request, response) => {
    const scope = ownerScope(resource, request.auth);
    const condition = scope.clause ? `id = ? AND ${scope.clause}` : 'id = ?';
    const record = await get(`${resource.select} WHERE ${condition}`, [request.params.id, ...scope.params]);
    if (!record) return response.status(404).json({ message: 'Registro no encontrado.' });
    return response.json(record);
  }));

  app.post(`/api/${routeName}`, asyncRoute(async (request, response) => {
    if (resource.table === 'condominios' && request.auth.rol !== 'Administrador') {
      return response.status(403).json({ message: 'Solo un administrador puede crear condominios.' });
    }
    const missing = requireFields(request.body, resource.required);
    if (missing.length) return response.status(400).json({ message: `Faltan campos obligatorios: ${missing.join(', ')}.` });
    if (resource.table === 'inquilinos' && request.body.esPrincipal === undefined) {
      request.body.esPrincipal = 0;
    }
    if (resource.table !== 'condominios') {
      let condominioId = request.body.condominioId;
      if (resource.table === 'estados_cuenta') {
        const tenant = await get('SELECT condominio_id AS condominioId FROM inquilinos WHERE id = ?', [request.body.inquilinoId]);
        condominioId = tenant?.condominioId;
      }
      if (!(await canAccessCondominio(condominioId, request.auth))) {
        return response.status(403).json({ message: 'No puedes registrar información en ese condominio.' });
      }
    }
    if (resource.table === 'inquilinos' && Number(request.body.esPrincipal) === 1) {
      await run('UPDATE inquilinos SET es_principal = 0 WHERE condominio_id = ?', [request.body.condominioId]);
    }
    const writable = resource.fields.filter(({ property }) => property !== 'id' && property !== 'createdAt' && request.body[property] !== undefined);
    const result = await run(`INSERT INTO ${resource.table} (${writable.map(({ column }) => column).join(', ')})
      VALUES (${writable.map(() => '?').join(', ')})`, writable.map(({ property }) => request.body[property]));
    const record = await get(`${resource.select} WHERE id = ?`, [result.lastID]);
    await audit(request.auth, 'crear', resource.table, result.lastID);
    return response.status(201).json(record);
  }));

  app.put(`/api/${routeName}/:id`, asyncRoute(async (request, response) => {
    const scope = ownerScope(resource, request.auth);
    const condition = scope.clause ? `id = ? AND ${scope.clause}` : 'id = ?';
    const existing = await get(`${resource.select} WHERE ${condition}`, [request.params.id, ...scope.params]);
    if (!existing) return response.status(404).json({ message: 'Registro no encontrado.' });
    if (request.body.condominioId !== undefined && !(await canAccessCondominio(request.body.condominioId, request.auth))) {
      return response.status(403).json({ message: 'No puedes mover el registro a ese condominio.' });
    }
    if (resource.table === 'estados_cuenta' && request.body.inquilinoId !== undefined) {
      const tenant = await get('SELECT condominio_id AS condominioId FROM inquilinos WHERE id = ?', [request.body.inquilinoId]);
      if (!(await canAccessCondominio(tenant?.condominioId, request.auth))) {
        return response.status(403).json({ message: 'No puedes asociar un inquilino de otro condominio.' });
      }
    }
    if (resource.table === 'inquilinos' && request.body.esPrincipal !== undefined) {
      const currentCondominioId = request.body.condominioId !== undefined ? request.body.condominioId : existing.condominioId;
      if (Number(request.body.esPrincipal) === 1) {
        await run('UPDATE inquilinos SET es_principal = 0 WHERE condominio_id = ? AND id != ?', [currentCondominioId, request.params.id]);
      }
    }
    const writable = resource.fields.filter(({ property }) => property !== 'id' && property !== 'createdAt' &&
      !(property === 'propietarioId' && request.auth.rol !== 'Administrador') && request.body[property] !== undefined);
    if (!writable.length) return response.status(400).json({ message: 'No hay datos para actualizar.' });
    const result = await run(`UPDATE ${resource.table} SET ${writable.map(({ column }) => `${column} = ?`).join(', ')} WHERE id = ?`,
      [...writable.map(({ property }) => request.body[property]), request.params.id]);
    if (!result.changes) return response.status(404).json({ message: 'Registro no encontrado.' });
    await audit(request.auth, 'editar', resource.table, Number(request.params.id), { campos: writable.map(({ property }) => property) });
    return response.json(await get(`${resource.select} WHERE id = ?`, [request.params.id]));
  }));

  app.delete(`/api/${routeName}/:id`, asyncRoute(async (request, response) => {
    if (request.auth.rol !== 'Administrador') {
      return response.status(403).json({ message: 'Solo un administrador puede eliminar registros.' });
    }
    const scope = ownerScope(resource, request.auth);
    const condition = scope.clause ? `id = ? AND ${scope.clause}` : 'id = ?';
    const existing = await get(`${resource.select} WHERE ${condition}`, [request.params.id, ...scope.params]);
    if (!existing) return response.status(404).json({ message: 'Registro no encontrado.' });
    const result = await run(`DELETE FROM ${resource.table} WHERE id = ?`, [request.params.id]);
    if (!result.changes) return response.status(404).json({ message: 'Registro no encontrado.' });
    await audit(request.auth, 'eliminar', resource.table, Number(request.params.id));
    return response.status(204).send();
  }));
}

app.use((error, _request, response, _next) => {
  console.error(error);
  if (error.code === 'SQLITE_CONSTRAINT') {
    const duplicate = String(error.message).includes('UNIQUE');
    return response.status(duplicate ? 409 : 400).json({
      message: duplicate ? 'Ya existe un registro con esos datos únicos.' : 'Los datos no cumplen las reglas de la base de datos.'
    });
  }
  return response.status(500).json({ message: 'Ocurrió un error interno en la API.' });
});

async function start() {
  await initializeDatabase();
  await seedDatabase();
  app.listen(port, () => {
    console.log(`API Congest escuchando en http://localhost:${port}`);
    console.log(`SQLite: ${databasePath}`);
  });
}

start().catch((error) => {
  console.error('No se pudo iniciar la API:', error);
  process.exitCode = 1;
});
