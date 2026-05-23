# Diccionario de Datos - Novapalma Logística
## Modelo de Base de Datos Relacional (PostgreSQL + Prisma 7)

Este documento detalla el Diccionario de Datos del esquema relacional (versión 3.0), estructurado bajo la tercera forma normal (3NF), garantizando la integridad referencial y auditoría forense inmutable.

---

### 1. Tabla: `users` (Usuarios del Sistema)
Almacena la información de contacto, credenciales y perfiles de los operadores y administradores.

| Campo | Tipo PostgreSQL | Nullable | Restricciones | Descripción |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `UUID` | No | PK, Default: `uuid()` | Identificador único del usuario. |
| `primerNombre` | `VARCHAR(60)` | No | - | Primer nombre del usuario. |
| `segundoNombre` | `VARCHAR(60)` | Sí | - | Segundo nombre (opcional). |
| `primerApellido` | `VARCHAR(60)` | No | - | Primer apellido del usuario. |
| `segundoApellido` | `VARCHAR(60)` | Sí | - | Segundo apellido (opcional). |
| `correo` | `VARCHAR(200)` | No | Unique | Correo electrónico corporativo (autenticación). |
| `password` | `VARCHAR(255)` | No | - | Hash Bcrypt (10 salt rounds) de la contraseña. |
| `rol` | `enum_Role` | No | Default: `'OPERADOR'` | Rol del usuario (`ADMIN`, `OPERADOR`). |
| `activo` | `BOOLEAN` | No | Default: `true` | Estado de activación del usuario. |
| `createdAt` | `TIMESTAMP` | No | Default: `now()` | Fecha y hora de creación del registro. |
| `updatedAt` | `TIMESTAMP` | No | Auto update | Fecha y hora de la última modificación. |
| `deletedAt` | `TIMESTAMP` | Sí | - | Borrado lógico (Soft Delete). |

---

### 2. Tabla: `drivers` (Conductores de la Flota)
Registra el personal logístico autorizado para operar vehículos.

| Campo | Tipo PostgreSQL | Nullable | Restricciones | Descripción |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `UUID` | No | PK, Default: `uuid()` | Identificador único del conductor. |
| `cedula` | `VARCHAR(20)` | No | Unique | Cédula de ciudadanía o extranjería. |
| `primerNombre` | `VARCHAR(60)` | No | - | Primer nombre. |
| `segundoNombre` | `VARCHAR(60)` | Sí | - | Segundo nombre (opcional). |
| `primerApellido` | `VARCHAR(60)` | No | - | Primer apellido. |
| `segundoApellido` | `VARCHAR(60)` | Sí | - | Segundo apellido (opcional). |
| `telefono` | `VARCHAR(20)` | Sí | - | Número telefónico de contacto. |
| `activo` | `BOOLEAN` | No | Default: `true` | Estado del conductor (activo/inactivo). |
| `createdAt` | `TIMESTAMP` | No | Default: `now()` | Registro de alta. |
| `updatedAt` | `TIMESTAMP` | No | Auto update | Última modificación. |
| `deletedAt` | `TIMESTAMP` | Sí | - | Borrado lógico (Soft Delete). |

---

### 3. Tabla: `vehicles` (Vehículos de la Flota)
Controle vehicular que opera en la cadena de distribución.

| Campo | Tipo PostgreSQL | Nullable | Restricciones | Descripción |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `UUID` | No | PK, Default: `uuid()` | Identificador único del vehículo. |
| `placa` | `VARCHAR(8)` | No | Unique | Placa del vehículo (Filtro estricto regex). |
| `marca` | `VARCHAR(50)` | No | - | Marca del vehículo. |
| `modelo` | `VARCHAR(100)` | No | - | Línea o modelo del vehículo. |
| `capacidad` | `DECIMAL(10,2)` | No | - | Capacidad de carga en toneladas métricas. |
| `estado` | `enum_VehicleStatus` | No | Default: `'DISPONIBLE'` | Estado (`DISPONIBLE`, `EN_VIAJE`, `MANTENIMIENTO`). |
| `activo` | `BOOLEAN` | No | Default: `true` | Estado lógico. |
| `createdAt` | `TIMESTAMP` | No | Default: `now()` | Registro de alta. |
| `updatedAt` | `TIMESTAMP` | No | Auto update | Última modificación. |
| `deletedAt` | `TIMESTAMP` | Sí | - | Borrado lógico. |

---

### 4. Tabla: `rate_tariffs` (Configuración de Tarifas Base)
Control administrativo del valor unitario del servicio.

| Campo | Tipo PostgreSQL | Nullable | Restricciones | Descripción |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `INTEGER` | No | PK, Serial | Identificador secuencial de la tarifa. |
| `producto` | `enum_ProductType` | No | Unique | Tipo de producto (`FRUTO`, `COMPOST`). |
| `valorKg` | `DECIMAL(12,2)` | No | - | Valor cobrado por kilogramo transportado. |
| `activo` | `BOOLEAN` | No | Default: `true` | Si la tarifa está vigente. |
| `createdAt` | `TIMESTAMP` | No | Default: `now()` | Fecha de creación. |
| `updatedAt` | `TIMESTAMP` | No | Auto update | Fecha de modificación. |
| `deletedAt` | `TIMESTAMP` | Sí | - | Borrado lógico. |

---

### 5. Tabla: `trips` (Viajes Operativos - Núcleo Transaccional)
Núcleo del negocio. Registra cada flete realizado de forma atómica.

| Campo | Tipo PostgreSQL | Nullable | Restricciones | Descripción |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `UUID` | No | PK, Default: `uuid()` | Identificador único de viaje. |
| `ticket` | `INTEGER` | No | Unique | Número de ticket de báscula física. |
| `fecha` | `TIMESTAMP` | No | Index | Fecha en que se realizó el flete. |
| `origen` | `VARCHAR(150)` | No | - | Ubicación de cargue/origen. |
| `producto` | `enum_ProductType` | No | - | Producto (`FRUTO`, `COMPOST`). |
| `tipoPago` | `enum_PaymentType` | No | Default: `'TRANSFERENCIA'` | Tipo de pago convenido. |
| `tonelaje` | `DECIMAL(10,3)` | No | - | Peso bruto transportado (en toneladas). |
| `valorPago` | `DECIMAL(12,2)` | No | - | Liquidación financiera automática (Calculado). |
| `consumoAcpm` | `DECIMAL(8,3)` | Sí | - | ACPM consumido durante el flete (Galones). |
| `usoFerry` | `BOOLEAN` | No | Default: `false` | Indica si el flete incluyó cruce fluvial en Ferry. |
| `driverId` | `UUID` | No | FK -> `drivers(id)` | Conductor asignado al viaje. |
| `vehicleId` | `UUID` | No | FK -> `vehicles(id)` | Vehículo asignado al viaje. |
| `registradoPorId` | `UUID` | No | FK -> `users(id)` | Usuario que registró el flete inicialmente. |
| `actualizadoPorId` | `UUID` | Sí | FK -> `users(id)` | Último usuario que modificó el flete. |
| `createdAt` | `TIMESTAMP` | No | Default: `now()` | Fecha de creación. |
| `updatedAt` | `TIMESTAMP` | No | Auto update | Fecha de última modificación. |
| `deletedAt` | `TIMESTAMP` | Sí | Index | Borrado lógico de auditoría. |

*Índices de Rendimiento:*
*   `trips_fecha_idx` para reportes mensuales acelerados.
*   `trips_deletedAt_idx` para exclusión de registros inactivos.
*   `trips_driverId_fecha_idx` para reportes consolidados de conductores.
*   `trips_vehicleId_fecha_idx` para análisis operativo de vehículos.

---

### 6. Tabla: `audit_logs` (Bitácora Forense Inmutable)
Trazabilidad forense inmutable de todas las mutaciones críticas y accesos al sistema.

| Campo | Tipo PostgreSQL | Nullable | Restricciones | Descripción |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `UUID` | No | PK, Default: `uuid()` | Identificador del log. |
| `userId` | `UUID` | Sí | FK -> `users(id)` | Identificador del usuario que realizó la acción. |
| `action` | `enum_AuditAction` | No | - | Acción (`CREATE`, `UPDATE`, `DELETE`, `LOGIN`, `LOGOUT`). |
| `entity` | `VARCHAR(50)` | No | Index | Entidad afectada (ej. `"Trip"`, `"User"`). |
| `entityId` | `VARCHAR(100)` | Sí | Index | ID del registro afectado. |
| `oldValues` | `JSON` | Sí | - | Snapshot del registro previo al cambio. |
| `newValues` | `JSON` | Sí | - | Snapshot del registro posterior al cambio. |
| `ipAddress` | `VARCHAR(45)` | Sí | - | Dirección IP desde donde se ejecutó la acción. |
| `userAgent` | `VARCHAR(500)` | Sí | - | Agente de navegación/cliente emisor. |
| `createdAt` | `TIMESTAMP` | No | Default: `now()`, Index | Marca temporal inmutable del suceso. |

---

### 7. Tabla: `refresh_tokens` (Sesiones de Usuario)
Control de persistencia de sesiones seguras.

| Campo | Tipo PostgreSQL | Nullable | Restricciones | Descripción |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `UUID` | No | PK, Default: `uuid()` | Identificador único de sesión. |
| `token` | `VARCHAR(512)` | No | Unique | Token de refresco cifrado. |
| `userId` | `UUID` | No | FK -> `users(id)`, Index | Usuario propietario de la sesión. |
| `expiresAt` | `TIMESTAMP` | No | - | Fecha de expiración de la sesión. |
| `revoked` | `BOOLEAN` | No | Default: `false` | Indica si la sesión fue cerrada/revocada. |
| `createdAt` | `TIMESTAMP` | No | Default: `now()` | Fecha de inicio de sesión. |
