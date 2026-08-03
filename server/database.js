const fs = require('node:fs');
const path = require('node:path');
const sqlite3 = require('sqlite3').verbose();

const dataDirectory = path.resolve(__dirname, 'data');
fs.mkdirSync(dataDirectory, { recursive: true });

const databasePath = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : path.join(dataDirectory, 'congest.sqlite');

const db = new sqlite3.Database(databasePath);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onResult(error) {
      if (error) reject(error);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) reject(error);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) reject(error);
      else resolve(rows);
    });
  });
}

function exec(sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

async function initializeDatabase() {
  await exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      apellido TEXT,
      email TEXT NOT NULL COLLATE NOCASE UNIQUE,
      password_hash TEXT NOT NULL,
      rol TEXT NOT NULL CHECK (rol IN ('Administrador', 'Inquilino', 'Propietario')),
      avatar TEXT,
      telefono TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS condominios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      ubicacion TEXT,
      ciudad TEXT NOT NULL,
      sector TEXT NOT NULL,
      precio REAL NOT NULL DEFAULT 0,
      cuartos INTEGER NOT NULL DEFAULT 0,
      banos INTEGER NOT NULL DEFAULT 0,
      capacidad INTEGER NOT NULL DEFAULT 0,
      imagen TEXT,
      descripcion TEXT,
      propietario_id INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      ,FOREIGN KEY (propietario_id) REFERENCES usuarios(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS inquilinos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      email TEXT NOT NULL COLLATE NOCASE UNIQUE,
      documento TEXT NOT NULL,
      tipo_documento TEXT NOT NULL,
      celular TEXT NOT NULL,
      proxima_fecha_pago TEXT NOT NULL,
      monto_alquiler REAL NOT NULL DEFAULT 0,
      estado TEXT NOT NULL CHECK (estado IN ('Pagado', 'Atrasado', 'Pendiente')),
      condominio_id INTEGER NOT NULL,
      condominio_nombre TEXT,
      es_principal INTEGER NOT NULL DEFAULT 0,
      avatar TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (condominio_id) REFERENCES condominios(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS estados_cuenta (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero TEXT NOT NULL,
      inquilino_id INTEGER NOT NULL,
      inquilino_nombre TEXT NOT NULL,
      inquilino_avatar TEXT,
      condominio_nombre TEXT NOT NULL,
      celular TEXT NOT NULL,
      estado TEXT NOT NULL CHECK (estado IN ('Pagado', 'Atrasado', 'Pendiente', 'En uso')),
      cuota REAL NOT NULL DEFAULT 0,
      mes TEXT NOT NULL,
      anio INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (inquilino_id) REFERENCES inquilinos(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS incidencias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      descripcion TEXT,
      ubicacion TEXT NOT NULL,
      tiempo TEXT NOT NULL,
      estado TEXT NOT NULL CHECK (estado IN ('En proceso', 'Asignado', 'Resuelto')),
      severidad TEXT NOT NULL CHECK (severidad IN ('alta', 'media', 'baja')),
      reportado_por TEXT,
      condominio_id INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      ,FOREIGN KEY (condominio_id) REFERENCES condominios(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS actividades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT NOT NULL CHECK (tipo IN ('pago', 'anuncio', 'incidencia', 'sistema', 'reserva')),
      descripcion TEXT NOT NULL,
      tiempo TEXT NOT NULL,
      nombre_persona TEXT,
      monto REAL,
      unidad TEXT,
      condominio_id INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      ,FOREIGN KEY (condominio_id) REFERENCES condominios(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ingresos_gastos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mes TEXT NOT NULL UNIQUE,
      orden INTEGER NOT NULL,
      ingresos REAL NOT NULL DEFAULT 0,
      gastos REAL NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS pagos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      concepto TEXT NOT NULL,
      categoria TEXT NOT NULL CHECK (categoria IN ('Cuotas', 'Servicios', 'Mantenimiento')),
      tipo TEXT NOT NULL CHECK (tipo IN ('Ingreso', 'Gasto')),
      monto REAL NOT NULL DEFAULT 0,
      metodo TEXT NOT NULL CHECK (metodo IN ('Efectivo', 'Transferencia', 'Tarjeta')),
      condominio_id INTEGER,
      FOREIGN KEY (condominio_id) REFERENCES condominios(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reportes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prioridad TEXT NOT NULL CHECK (prioridad IN ('Alta', 'Media', 'Baja')),
      fecha TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      problema TEXT NOT NULL,
      condominio TEXT NOT NULL,
      estado TEXT NOT NULL CHECK (estado IN ('En proceso', 'Asignado', 'Resuelto')),
      condominio_id INTEGER,
      FOREIGN KEY (condominio_id) REFERENCES condominios(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS auditoria (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER,
      accion TEXT NOT NULL,
      entidad TEXT NOT NULL,
      entidad_id INTEGER,
      detalle TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
    );
  `);

  await ensureColumn('condominios', 'propietario_id', 'INTEGER REFERENCES usuarios(id) ON DELETE SET NULL');
  await ensureColumn('inquilinos', 'es_principal', 'INTEGER NOT NULL DEFAULT 0');
  await ensureColumn('incidencias', 'condominio_id', 'INTEGER REFERENCES condominios(id) ON DELETE CASCADE');
  await ensureColumn('actividades', 'condominio_id', 'INTEGER REFERENCES condominios(id) ON DELETE CASCADE');
  await ensureColumn('pagos', 'condominio_id', 'INTEGER REFERENCES condominios(id) ON DELETE CASCADE');
  await ensureColumn('reportes', 'condominio_id', 'INTEGER REFERENCES condominios(id) ON DELETE CASCADE');

  await exec(`
    CREATE INDEX IF NOT EXISTS idx_condominios_propietario ON condominios(propietario_id);
    CREATE INDEX IF NOT EXISTS idx_inquilinos_condominio ON inquilinos(condominio_id);
    CREATE INDEX IF NOT EXISTS idx_pagos_condominio ON pagos(condominio_id);
    CREATE INDEX IF NOT EXISTS idx_reportes_condominio ON reportes(condominio_id);
    CREATE INDEX IF NOT EXISTS idx_incidencias_condominio ON incidencias(condominio_id);
  `);
}

async function ensureColumn(table, column, definition) {
  const columns = await all(`PRAGMA table_info(${table})`);
  if (!columns.some((item) => item.name === column)) {
    await run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

module.exports = { all, databasePath, exec, get, initializeDatabase, run };
