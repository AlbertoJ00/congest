# Congest

Aplicación Angular con una API Express y persistencia centralizada en SQLite.

## Ejecutar en desarrollo

Instala dependencias y levanta el frontend y la API con un solo comando:

```bash
npm install --legacy-peer-deps
npm start
```

- Frontend: `http://localhost:4200`
- API: `http://localhost:3000/api`
- Salud de la API: `http://localhost:3000/api/health`
- Base de datos: `server/data/congest.sqlite`

El primer arranque crea las tablas e importa automáticamente los datos de demostración que antes estaban definidos dentro de los componentes. Los siguientes arranques conservan la información existente.

## Usuarios iniciales

| Correo | Contraseña | Rol |
| --- | --- | --- |
| `admin@congest.com` | `admin123` | Administrador |
| `ana@congest.com` | `propietario123` | Propietario |

## Configuración

Copia `.env.example` a `.env` si necesitas cambiar el puerto, la ruta de SQLite o el secreto JWT. En un entorno compartido o productivo es obligatorio definir un `JWT_SECRET` privado.

Para ejecutar los procesos por separado:

```bash
npm run server
npm run web
```

El proxy de Angular reenvía `/api` al puerto `3000`. Por eso la API debe estar en ejecución para poder iniciar sesión.

## Roles y permisos

- **Administrador:** acceso global, administración de usuarios, creación/asignación de condominios y operaciones destructivas.
- **Propietario:** solo consulta y modifica datos de los condominios que tiene asignados. No puede acceder a usuarios, crear condominios, eliminar registros ni operar sobre propiedades ajenas.

El registro público siempre crea cuentas con rol `Propietario`. Un administrador debe asignarles condominios desde la edición de cada propiedad. Los permisos también se validan en la API; no dependen únicamente de los botones visibles en Angular.

Las altas, ediciones y eliminaciones administrativas quedan registradas en la tabla `auditoria` de SQLite.

## Compilar

```bash
npm run build
```
