require('dotenv').config();

const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const express = require('express');
const jwt = require('jsonwebtoken');
const { all, databasePath, exec, get, initializeDatabase, run } = require('./database');
const { seedDatabase } = require('./seed');

const app = express();
const port = Number(process.env.API_PORT || 3000);
const jwtSecret = process.env.JWT_SECRET || 'congest-development-secret-change-me';
const workflowStates = ['Pendiente', 'En proceso', 'Asignado', 'Resuelto'];
const tenantCreatableResources = ['reportes', 'incidencias'];

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
  if (auth.rol === 'Inquilino') {
    if (resource.table === 'condominios') {
      return { clause: 'id IN (SELECT condominio_id FROM inquilinos WHERE usuario_id = ?)', params: [auth.sub] };
    }
    if (resource.table === 'inquilinos') {
      return { clause: 'usuario_id = ?', params: [auth.sub] };
    }
    if (tenantCreatableResources.includes(resource.table)) {
      return { clause: 'usuario_id = ?', params: [auth.sub] };
    }
    if (resource.table === 'pagos') {
      return {
        clause: 'condominio_id IN (SELECT condominio_id FROM inquilinos WHERE usuario_id = ?)',
        params: [auth.sub]
      };
    }
    if (resource.table === 'estados_cuenta') {
      return {
        clause: 'inquilino_id IN (SELECT id FROM inquilinos WHERE usuario_id = ?)',
        params: [auth.sub]
      };
    }
    return { clause: '1 = 0', params: [] };
  }
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

function condominioScope(auth) {
  if (auth.rol === 'Administrador') return { clause: '', params: [] };
  if (auth.rol === 'Propietario') {
    return {
      clause: 'condominio_id IN (SELECT id FROM condominios WHERE propietario_id = ?)',
      params: [auth.sub]
    };
  }
  if (auth.rol === 'Inquilino') {
    return {
      clause: 'condominio_id IN (SELECT condominio_id FROM inquilinos WHERE usuario_id = ?)',
      params: [auth.sub]
    };
  }
  return { clause: '1 = 0', params: [] };
}

async function canAccessCondominio(condominioId, auth) {
  if (auth.rol === 'Administrador') return true;
  if (!condominioId) return false;
  if (auth.rol === 'Propietario') {
    return !!(await get('SELECT id FROM condominios WHERE id = ? AND propietario_id = ?', [condominioId, auth.sub]));
  }
  if (auth.rol === 'Inquilino') {
    return !!(await get('SELECT id FROM condominios WHERE id = ? AND id IN (SELECT condominio_id FROM inquilinos WHERE usuario_id = ?)', [condominioId, auth.sub]));
  }
  return false;
}

function tenantPasswordSeed(inquilino) {
  const documentValue = String(inquilino.documento || '').trim();
  if (documentValue) return documentValue;
  return crypto.randomBytes(8).toString('hex');
}

async function ensureTenantUser(inquilino) {
  const email = String(inquilino.email || '').trim();
  const existingUser = await get('SELECT id, rol FROM usuarios WHERE email = ?', [email]);

  if (existingUser) {
    if (existingUser.rol !== 'Inquilino') {
      throw new Error('El correo ya pertenece a un usuario con otro rol.');
    }
    await run('UPDATE usuarios SET nombre = ?, telefono = ? WHERE id = ?', [
      String(inquilino.nombre || '').trim(),
      inquilino.celular || null,
      existingUser.id
    ]);
    return existingUser.id;
  }

  // Create with a random password hash and issue a password reset token for secure setup
  const randomSeed = crypto.randomBytes(32).toString('hex');
  const passwordHash = await bcrypt.hash(randomSeed, 10);
  const result = await run(`INSERT INTO usuarios (nombre, apellido, email, password_hash, rol, avatar, telefono)
    VALUES (?, ?, ?, ?, ?, ?, ?)`, [
    String(inquilino.nombre || '').trim(),
    null,
    email,
    passwordHash,
    'Inquilino',
    inquilino.avatar || null,
    inquilino.celular || null
  ]);
  const usuarioId = result.lastID;
  // If caller requested, create reset token and send welcome email
  if (inquilino._sendWelcomeEmail) {
    try {
      const token = await createPasswordResetToken(usuarioId);
      await sendPasswordResetEmail(email, inquilino.nombre, token, inquilino.condominioNombre);
    } catch (err) {
      console.error('No se pudo enviar correo de bienvenida al inquilino:', err);
    }
  }
  return usuarioId;
}

async function createPasswordResetToken(usuarioId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24h
  await run('INSERT INTO password_resets (usuario_id, token, expires_at) VALUES (?, ?, ?)', [usuarioId, token, expiresAt]);
  return token;
}

async function sendPasswordResetEmail(toEmail, nombre, token, condominioNombre) {
  const frontend = process.env.FRONTEND_URL || 'http://localhost:4200';
  const url = `${frontend.replace(/\/$/, '')}/set-password?token=${token}`;
  const subject = 'Acceso a CONGEST creado: establece tu contraseña';
  const text = `Hola ${nombre || ''},\n\nSe ha creado una cuenta en CONGEST para ti${condominioNombre ? ` (condominio: ${condominioNombre})` : ''}.\n
Accede al siguiente enlace para establecer tu contraseña de forma segura:\n\n${url}\n\nSi no solicitaste esto, ignora este correo.`;

  if (process.env.SMTP_HOST) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
    });
    await transporter.sendMail({ from: process.env.SMTP_FROM || 'no-reply@congest.local', to: toEmail, subject, text });
  } else {
    // Fallback: log the link so local dev can copy it
    console.log('Password reset (development):', { to: toEmail, url, subject, text });
  }
}

async function syncTenantUser(inquilino) {
  if (!inquilino.usuarioId) return;
  await run('UPDATE usuarios SET nombre = ?, email = ?, telefono = ? WHERE id = ?', [
    String(inquilino.nombre || '').trim(),
    String(inquilino.email || '').trim(),
    inquilino.celular || null,
    inquilino.usuarioId
  ]);
}

async function backfillTenantUsers() {
  const tenants = await all(`SELECT id, nombre, email, documento, celular, avatar
    FROM inquilinos WHERE usuario_id IS NULL ORDER BY id`);
  for (const tenant of tenants) {
    const usuarioId = await ensureTenantUser(tenant);
    await run('UPDATE inquilinos SET usuario_id = ? WHERE id = ?', [usuarioId, tenant.id]);
  }
}

async function withTransaction(work) {
  await exec('BEGIN');
  try {
    const result = await work();
    await exec('COMMIT');
    return result;
  } catch (error) {
    await exec('ROLLBACK');
    throw error;
  }
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
      ['condominio_nombre', 'condominioNombre'], ['usuario_id', 'usuarioId'], ['es_principal', 'esPrincipal'], ['avatar', 'avatar'], ['created_at', 'createdAt']
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
      ['condominio', 'condominio'], ['estado', 'estado'], ['condominio_id', 'condominioId'],
      ['usuario_id', 'usuarioId']
    ]
  },
  incidencias: {
    table: 'incidencias',
    required: ['titulo', 'ubicacion', 'tiempo', 'estado', 'severidad', 'condominioId'],
    fields: [
      ['id', 'id'], ['titulo', 'titulo'], ['descripcion', 'descripcion'], ['ubicacion', 'ubicacion'],
      ['tiempo', 'tiempo'], ['estado', 'estado'], ['severidad', 'severidad'],
      ['reportado_por', 'reportadoPor'], ['condominio_id', 'condominioId'],
      ['usuario_id', 'usuarioId'], ['created_at', 'createdAt']
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
  const body = request.body || {};
  const nombre = String(body.nombre || '').trim();
  const apellido = String(body.apellido || '').trim() || null;
  const email = String(body.email || '').trim();
  const password = String(body.password || '');

  const missing = [];
  if (!nombre) missing.push('nombre');
  if (!email) missing.push('email');
  if (!password) missing.push('password');
  if (missing.length) return response.status(400).json({ message: `Faltan campos obligatorios: ${missing.join(', ')}.` });
  if (!/^\S+@\S+\.\S+$/.test(email)) return response.status(400).json({ message: 'El correo no es válido.' });
  if (password.length < 8) return response.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres.' });

  const existingUser = await get('SELECT id FROM usuarios WHERE email = ?', [email]);
  if (existingUser) return response.status(409).json({ message: 'El correo ya está registrado.' });

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await run(`INSERT INTO usuarios (nombre, apellido, email, password_hash, rol, avatar, telefono)
    VALUES (?, ?, ?, ?, ?, ?, ?)`, [
    nombre, apellido, email, passwordHash, 'Propietario', body.avatar || null, body.telefono || null
  ]);
  const user = await get(`${userSelect} WHERE id = ?`, [result.lastID]);
  return response.status(201).json(user);
}));

app.get('/api/auth/registration-open', asyncRoute(async (_request, response) => {
  // El alta pública de propietarios está habilitada aunque existan usuarios demo.
  response.json({ open: true });
}));

app.post('/api/auth/forgot-password', asyncRoute(async (request, response) => {
  const email = String(request.body.email || '').trim();
  if (!email) return response.status(400).json({ message: 'Correo es obligatorio.' });
  const user = await get('SELECT id, nombre, email FROM usuarios WHERE email = ?', [email]);
  if (user) {
    try {
      const token = await createPasswordResetToken(user.id);
      await sendPasswordResetEmail(user.email, user.nombre, token);
    } catch (err) {
      console.error('Error enviando correo de restablecimiento:', err);
    }
  }
  // Always respond the same to avoid account enumeration
  return response.status(204).send();
}));

app.post('/api/auth/set-password', asyncRoute(async (request, response) => {
  const { token, password } = request.body || {};
  if (!token || !password) return response.status(400).json({ message: 'Token y contraseña son obligatorios.' });
  if (String(password).length < 8) return response.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres.' });
  const row = await get('SELECT usuario_id, expires_at FROM password_resets WHERE token = ?', [String(token)]);
  if (!row) return response.status(400).json({ message: 'Token inválido o expirado.' });
  if (Date.now() > Number(row.expires_at)) {
    await run('DELETE FROM password_resets WHERE token = ?', [String(token)]);
    return response.status(400).json({ message: 'Token inválido o expirado.' });
  }
  const passwordHash = await bcrypt.hash(String(password), 10);
  await run('UPDATE usuarios SET password_hash = ? WHERE id = ?', [passwordHash, row.usuario_id]);
  await run('DELETE FROM password_resets WHERE usuario_id = ?', [row.usuario_id]);
  return response.status(200).json({ message: 'Contraseña establecida correctamente.' });
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

app.get('/api/usuarios', requireRole('Administrador', 'Propietario'), asyncRoute(async (_request, response) => {
  response.json(await all(`${userSelect} ORDER BY id DESC`));
}));

app.get('/api/usuarios/:id', requireRole('Administrador', 'Propietario'), asyncRoute(async (request, response) => {
  const user = await get(`${userSelect} WHERE id = ?`, [request.params.id]);
  if (!user) return response.status(404).json({ message: 'Usuario no encontrado.' });
  return response.json(user);
}));

app.post('/api/usuarios', requireRole('Administrador', 'Propietario'), asyncRoute(async (request, response) => {
  const missing = requireFields(request.body, ['nombre', 'email', 'password', 'rol']);
  if (missing.length) return response.status(400).json({ message: `Faltan campos obligatorios: ${missing.join(', ')}.` });
  // No permitir creación de Propietario vía API una vez existe la cuenta inicial
  if (String(request.body.rol) === 'Propietario') {
    return response.status(403).json({ message: 'No puedes crear usuarios con rol Propietario.' });
  }
  const passwordHash = await bcrypt.hash(request.body.password, 10);
  const result = await run(`INSERT INTO usuarios (nombre, apellido, email, password_hash, rol, avatar, telefono)
    VALUES (?, ?, ?, ?, ?, ?, ?)`, [request.body.nombre, request.body.apellido || null, request.body.email,
    passwordHash, request.body.rol, request.body.avatar || null, request.body.telefono || null]);
  await audit(request.auth, 'crear', 'usuarios', result.lastID, { email: request.body.email, rol: request.body.rol });
  response.status(201).json(await get(`${userSelect} WHERE id = ?`, [result.lastID]));
}));

app.put('/api/usuarios/:id', requireRole('Administrador', 'Propietario'), asyncRoute(async (request, response) => {
  const columns = { nombre: 'nombre', apellido: 'apellido', email: 'email', rol: 'rol', avatar: 'avatar', telefono: 'telefono' };
  const updates = Object.entries(columns).filter(([property]) => request.body[property] !== undefined);
  if (request.body.password) {
    updates.push(['password', 'password_hash']);
    request.body.password = await bcrypt.hash(request.body.password, 10);
  }
  if (request.body.rol === 'Propietario') {
    return response.status(403).json({ message: 'No puedes asignar el rol Propietario.' });
  }
  if (!updates.length) return response.status(400).json({ message: 'No hay datos para actualizar.' });
  const result = await run(`UPDATE usuarios SET ${updates.map(([, column]) => `${column} = ?`).join(', ')} WHERE id = ?`,
    [...updates.map(([property]) => request.body[property]), request.params.id]);
  if (!result.changes) return response.status(404).json({ message: 'Usuario no encontrado.' });
  await audit(request.auth, 'editar', 'usuarios', Number(request.params.id), { campos: updates.map(([, column]) => column) });
  return response.json(await get(`${userSelect} WHERE id = ?`, [request.params.id]));
}));

app.delete('/api/usuarios/:id', requireRole('Administrador', 'Propietario'), asyncRoute(async (request, response) => {
  if (Number(request.params.id) === Number(request.auth.sub)) {
    return response.status(409).json({ message: 'No puedes eliminar el usuario de tu sesión.' });
  }
  const result = await run('DELETE FROM usuarios WHERE id = ?', [request.params.id]);
  if (!result.changes) return response.status(404).json({ message: 'Usuario no encontrado.' });
  await audit(request.auth, 'eliminar', 'usuarios', Number(request.params.id));
  return response.status(204).send();
}));

app.get('/api/auditoria', requireRole('Administrador', 'Propietario'), asyncRoute(async (_request, response) => {
  response.json(await all(`SELECT a.id, a.accion, a.entidad, a.entidad_id AS "entidadId", a.detalle,
    a.created_at AS "createdAt", u.nombre AS usuarioNombre, u.email AS usuarioEmail
    FROM auditoria a LEFT JOIN usuarios u ON u.id = a.usuario_id ORDER BY a.id DESC LIMIT 250`));
}));

app.get('/api/actividades/ingresos-gastos', asyncRoute(async (request, response) => {
  if (request.auth.rol === 'Administrador') {
    return response.json(await all('SELECT mes, ingresos, gastos FROM ingresos_gastos ORDER BY orden'));
  }
  const scope = condominioScope(request.auth);
  const rows = await all(`SELECT
    CASE strftime('%m', fecha)
      WHEN '01' THEN 'Ene' WHEN '02' THEN 'Feb' WHEN '03' THEN 'Mar'
      WHEN '04' THEN 'Abr' WHEN '05' THEN 'May' WHEN '06' THEN 'Jun'
      WHEN '07' THEN 'Jul' WHEN '08' THEN 'Ago' WHEN '09' THEN 'Sep'
      WHEN '10' THEN 'Oct' WHEN '11' THEN 'Nov' ELSE 'Dic' END AS mes,
    SUM(CASE WHEN tipo = 'Ingreso' THEN monto ELSE 0 END) AS ingresos,
    SUM(CASE WHEN tipo = 'Gasto' THEN monto ELSE 0 END) AS gastos,
    strftime('%Y-%m', fecha) AS periodo
    FROM pagos ${scope.clause ? `WHERE ${scope.clause}` : ''}
    GROUP BY periodo ORDER BY periodo`, scope.params);
  return response.json(rows.map(({ periodo, ...row }) => row));
}));

app.get('/api/actividades', asyncRoute(async (request, response) => {
  const scope = condominioScope(request.auth);
  response.json(await all(`SELECT id, tipo, descripcion, tiempo, nombre_persona AS "nombrePersona",
    condominio_id AS "condominioId",
    monto, unidad, created_at AS "createdAt" FROM actividades ${scope.clause ? `WHERE ${scope.clause}` : ''} ORDER BY id DESC`, scope.params));
}));

app.get('/api/estados-cuenta/resumen', asyncRoute(async (request, response) => {
  const paymentScope = condominioScope(request.auth);
  const totals = await get(`SELECT
    COALESCE(SUM(CASE WHEN tipo = 'Ingreso' THEN monto ELSE 0 END), 0) AS recaudacionMes,
    COALESCE(SUM(CASE WHEN tipo = 'Gasto' THEN monto ELSE 0 END), 0) AS gastosMes
    FROM pagos ${paymentScope.clause ? `WHERE ${paymentScope.clause}` : ''}`, paymentScope.params);
  const stateScope = request.auth.rol === 'Administrador'
    ? { sql: '', params: [] }
    : request.auth.rol === 'Inquilino'
      ? { sql: 'WHERE inquilino_id IN (SELECT id FROM inquilinos WHERE usuario_id = ?)', params: [request.auth.sub] }
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
  const scope = request.auth.rol === 'Inquilino'
    ? ownerScope(resources.incidencias, request.auth)
    : condominioScope(request.auth);
  const result = await get(`SELECT
    SUM(CASE WHEN estado != 'Resuelto' THEN 1 ELSE 0 END) AS abiertas,
    SUM(CASE WHEN estado = 'Resuelto' THEN 1 ELSE 0 END) AS resueltasHoy
    FROM incidencias ${scope.clause ? `WHERE ${scope.clause}` : ''}`, scope.params);
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
    if (resource.table === 'condominios' && !['Administrador', 'Propietario'].includes(request.auth.rol)) {
      return response.status(403).json({ message: 'Solo un administrador puede crear condominios.' });
    }
    if (request.auth.rol === 'Inquilino' && !tenantCreatableResources.includes(resource.table)) {
      return response.status(403).json({ message: 'No tienes permisos para crear registros.' });
    }
    const missing = requireFields(request.body, resource.required);
    if (missing.length) return response.status(400).json({ message: `Faltan campos obligatorios: ${missing.join(', ')}.` });
    if (tenantCreatableResources.includes(resource.table) && !workflowStates.includes(String(request.body.estado))) {
      return response.status(400).json({ message: `Estado inválido. Usa: ${workflowStates.join(', ')}.` });
    }
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
    if (request.auth.rol === 'Inquilino' && tenantCreatableResources.includes(resource.table)) {
      request.body.usuarioId = request.auth.sub;
      request.body.estado = 'Pendiente';
      const tenant = await get('SELECT nombre, apellido FROM usuarios WHERE id = ?', [request.auth.sub]);
      if (resource.table === 'incidencias') {
        request.body.reportadoPor = [tenant?.nombre, tenant?.apellido].filter(Boolean).join(' ') || null;
      }
      if (resource.table === 'reportes') {
        const condominio = await get('SELECT nombre FROM condominios WHERE id = ?', [request.body.condominioId]);
        request.body.condominio = condominio?.nombre || request.body.condominio;
      }
    }
    if (resource.table === 'inquilinos') {
        return withTransaction(async () => {
          // When creating a tenant from the app, request sending a welcome email
          request.body._sendWelcomeEmail = true;
          const usuarioId = await ensureTenantUser(request.body);
          request.body.usuarioId = usuarioId;
        if (Number(request.body.esPrincipal) === 1) {
          await run('UPDATE inquilinos SET es_principal = 0 WHERE condominio_id = ?', [request.body.condominioId]);
        }
        const writable = resource.fields.filter(({ property }) => property !== 'id' && property !== 'createdAt' &&
          (property !== 'usuarioId' || request.auth.rol === 'Inquilino') && request.body[property] !== undefined);
        const result = await run(`INSERT INTO ${resource.table} (${writable.map(({ column }) => column).join(', ')})
          VALUES (${writable.map(() => '?').join(', ')})`, writable.map(({ property }) => request.body[property]));
        const record = await get(`${resource.select} WHERE id = ?`, [result.lastID]);
        await audit(request.auth, 'crear', resource.table, result.lastID);
        return response.status(201).json(record);
      });
    }
    const writable = resource.fields.filter(({ property }) => property !== 'id' && property !== 'createdAt' &&
      (property !== 'usuarioId' || request.auth.rol === 'Inquilino') && request.body[property] !== undefined);
    const result = await run(`INSERT INTO ${resource.table} (${writable.map(({ column }) => column).join(', ')})
      VALUES (${writable.map(() => '?').join(', ')})`, writable.map(({ property }) => request.body[property]));
    const record = await get(`${resource.select} WHERE id = ?`, [result.lastID]);
    await audit(request.auth, 'crear', resource.table, result.lastID);
    return response.status(201).json(record);
  }));

  app.put(`/api/${routeName}/:id`, asyncRoute(async (request, response) => {
    if (request.auth.rol === 'Inquilino') {
      return response.status(403).json({ message: 'No tienes permisos para editar registros.' });
    }
    if (tenantCreatableResources.includes(resource.table) && request.body.estado !== undefined &&
      !workflowStates.includes(String(request.body.estado))) {
      return response.status(400).json({ message: `Estado inválido. Usa: ${workflowStates.join(', ')}.` });
    }
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
    const writable = resource.fields.filter(({ property }) => property !== 'id' && property !== 'createdAt' && property !== 'usuarioId' &&
      !(property === 'propietarioId' && request.auth.rol === 'Inquilino') && request.body[property] !== undefined);
    if (!writable.length) return response.status(400).json({ message: 'No hay datos para actualizar.' });
    if (resource.table === 'inquilinos') {
      return withTransaction(async () => {
        const result = await run(`UPDATE ${resource.table} SET ${writable.map(({ column }) => `${column} = ?`).join(', ')} WHERE id = ?`,
          [...writable.map(({ property }) => request.body[property]), request.params.id]);
        if (!result.changes) return response.status(404).json({ message: 'Registro no encontrado.' });
        const updatedRecord = await get(`${resource.select} WHERE id = ?`, [request.params.id]);
        await syncTenantUser(updatedRecord);
        await audit(request.auth, 'editar', resource.table, Number(request.params.id), { campos: writable.map(({ property }) => property) });
        return response.json(updatedRecord);
      });
    }
    const result = await run(`UPDATE ${resource.table} SET ${writable.map(({ column }) => `${column} = ?`).join(', ')} WHERE id = ?`,
      [...writable.map(({ property }) => request.body[property]), request.params.id]);
    if (!result.changes) return response.status(404).json({ message: 'Registro no encontrado.' });
    await audit(request.auth, 'editar', resource.table, Number(request.params.id), { campos: writable.map(({ property }) => property) });
    return response.json(await get(`${resource.select} WHERE id = ?`, [request.params.id]));
  }));

  app.delete(`/api/${routeName}/:id`, asyncRoute(async (request, response) => {
    if (!['Administrador', 'Propietario'].includes(request.auth.rol)) {
      return response.status(403).json({ message: 'Solo un administrador puede eliminar registros.' });
    }
    const scope = ownerScope(resource, request.auth);
    const condition = scope.clause ? `id = ? AND ${scope.clause}` : 'id = ?';
    const existing = await get(`${resource.select} WHERE ${condition}`, [request.params.id, ...scope.params]);
    if (!existing) return response.status(404).json({ message: 'Registro no encontrado.' });
    if (resource.table === 'inquilinos') {
      return withTransaction(async () => {
        const result = await run(`DELETE FROM ${resource.table} WHERE id = ?`, [request.params.id]);
        if (!result.changes) return response.status(404).json({ message: 'Registro no encontrado.' });
        if (existing.usuarioId) {
          await run('DELETE FROM usuarios WHERE id = ?', [existing.usuarioId]);
        }
        await audit(request.auth, 'eliminar', resource.table, Number(request.params.id));
        return response.status(204).send();
      });
    }
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
  await backfillTenantUsers();
  app.listen(port, () => {
    console.log(`API Congest escuchando en http://localhost:${port}`);
    console.log(`SQLite: ${databasePath}`);
  });
}

start().catch((error) => {
  console.error('No se pudo iniciar la API:', error);
  process.exitCode = 1;
});
