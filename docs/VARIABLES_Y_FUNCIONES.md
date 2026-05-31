# Listado de Variables y Funciones - Novapalma Logística 🌴
## Catálogo Detallado del Entorno, Esquemas y Lógica de Negocio

Este documento contiene un catálogo exhaustivo de todas las variables críticas (de entorno, de base de datos, de estado) y las funciones del sistema (controladores, servicios y utilitarios) para el **Entregable del 3er Corte**.

---

### 1. LISTADO DE VARIABLES DEL SISTEMA

El sistema gestiona variables en múltiples niveles: configuración de entorno, persistencia relacional y estado reactivo.

#### 1.1. Variables de Entorno (Servidor Backend - `.env`)
Estas variables definen la infraestructura y los parámetros de seguridad del servidor.

| Variable | Tipo | Valor de Ejemplo | Descripción |
| :--- | :--- | :--- | :--- |
| `PORT` | `Number` | `3001` | Puerto de escucha del servidor Express. |
| `DATABASE_URL` | `String` | `postgresql://user:pass@localhost:5432/novapalma` | Cadena de conexión para la base de datos PostgreSQL. |
| `JWT_SECRET` | `String` | `7d83f0a1c...` | Clave secreta simétrica utilizada para firmar los tokens de sesión. |
| `NODE_ENV` | `String` | `development` / `production` | Entorno de ejecución actual del servidor. |
| `CLIENT_URL` | `String` | `http://localhost:5173` | URL de origen permitida en la configuración de CORS. |

#### 1.2. Variables de Persistencia (Esquemas de Base de Datos - Prisma)
Estas variables corresponden a los atributos físicos y lógicos de las entidades críticas.

##### A. Entidad: `User` (Usuarios)
- `id` (`String` / UUID): Identificador único interno.
- `primerNombre`, `segundoNombre`, `primerApellido`, `segundoApellido` (`String`): Componentes del nombre del usuario.
- `correo` (`String`): Dirección única de correo para credenciales.
- `password` (`String`): Hash Bcrypt de la contraseña cifrada.
- `rol` (`Enum`): Rol operativo (`ADMIN`, `OPERADOR`).
- `activo` (`Boolean`): Estado lógico de activación de cuenta.
- `createdAt`, `updatedAt`, `deletedAt` (`DateTime`): Trazas temporales del registro.

##### B. Entidad: `Driver` (Conductores)
- `id` (`String` / UUID): Identificador único interno.
- `cedula` (`String`): Cédula del conductor (Filtro numérico estricto).
- `primerNombre`, `segundoNombre`, `primerApellido`, `segundoApellido` (`String`): Datos del nombre.
- `telefono` (`String`): Teléfono de contacto.
- `activo` (`Boolean`): Estado del conductor.

##### C. Entidad: `Vehicle` (Vehículos)
- `id` (`String` / UUID): Identificador único.
- `placa` (`String`): Placa vehicular única (Regex: `^[A-Z]{3}[0-9]{3}$`).
- `marca` (`String`), `modelo` (`String`): Datos comerciales del vehículo.
- `capacidad` (`Decimal`): Carga máxima permitida en toneladas.
- `estado` (`Enum`): Estado operativo (`DISPONIBLE`, `EN_VIAJE`, `MANTENIMIENTO`).
- `activo` (`Boolean`): Estado lógico de exclusión.

##### D. Entidad: `Trip` (Viajes / Fletes)
- `id` (`String` / UUID): Identificador de viaje.
- `ticket` (`Int`): Número de ticket de báscula (Único y estrictamente positivo).
- `fecha` (`DateTime`): Fecha calendario del viaje (Persistido en UTC).
- `origen` (`String`), `destino` (`String`): Ubicación del servicio.
- `producto` (`Enum`): Categoría del flete (`FRUTO`, `COMPOST`).
- `empresa` (`String`): Cliente relacionado con la carga.
- `tonelaje` (`Decimal`): Peso neto en toneladas métricas.
- `valorPago` (`Decimal`): Importe financiero a facturar por el viaje.
- `porcentajeConductor` (`Decimal`): Porcentaje de comisión para el chofer.
- `valorConductor` (`Decimal`): Comisión final liquidada para el chofer (`valorPago * (porcentajeConductor / 100)`).
- `consumoAcpm` (`Decimal`): Combustible consumido en galones.
- `valorAcpm` (`Decimal`): Costo total de combustible ACPM.
- `usoFerry` (`Boolean`): Indicador lógico de cruce por ferry fluvial.
- `valorFerry` (`Decimal`): Costo neto del servicio de ferry.
- `driverId` (`String` / UUID): Relación con el Conductor asignado.
- `vehicleId` (`String` / UUID): Relación con el Vehículo asignado.
- `registradoPorId` (`String` / UUID): Auditoría de creación.
- `actualizadoPorId` (`String` / UUID): Auditoría de última edición.

##### E. Entidad: `AuditLog` (Trazabilidad Forense)
- `id` (`String` / UUID): Identificador inmutable.
- `userId` (`String` / UUID): ID del usuario que realizó la acción.
- `action` (`Enum`): Tipo de acción (`CREATE`, `UPDATE`, `DELETE`, `LOGIN`, `LOGOUT`).
- `entity` (`String`): Tabla afectada (ej: `"Trip"`, `"User"`).
- `entityId` (`String`): Clave primaria del registro alterado.
- `oldValues`, `newValues` (`JSON`): Snapshots antes y después de la transacción.
- `ipAddress` (`String`): Dirección IP del cliente.
- `userAgent` (`String`): Agente del navegador emisor.

#### 1.3. Variables de Estado Reactivas (Frontend Client - React States)
Variables que controlan la interfaz dinámica y evitan placeholders o datos vacíos.

| Variable de Estado | Tipo | Componente / Ubicación | Descripción |
| :--- | :--- | :--- | :--- |
| `user` / `token` | `Object` / `String` | `AuthContext.jsx` | Control global de sesión del despachador y rol RBAC. |
| `theme` | `String` | `ThemeContext.jsx` | Selector de tema de visualización (`'light'` / `'dark'`). |
| `trips` | `Array` | `Trips.jsx` | Almacén reactivo de la lista de fletes activos del mes. |
| `formData` | `Object` | Form Modals | Datos dinámicos del recurso a registrar o editar. |
| `searchTerm` | `String` | CRUD Panels | Cadena para búsquedas reactivas locales sobre las grillas. |
| `isSubmitting` | `Boolean` | Form Modals | Previene dobles clics accidentales en peticiones transaccionales. |

---

### 2. LISTADO DE FUNCIONES DEL SISTEMA

La lógica del backend está estructurada en el patrón **Service-Controller**, separando la orquestación HTTP de las reglas de negocio.

#### 2.1. Funciones de la Capa de Controladores (`src/controllers/`)
Orquestan las peticiones HTTP y formatean las respuestas.

##### A. Controlador de Viajes (`trip.controller.js`)
*   `create(req, res)`:
    *   *Descripción:* Recibe los parámetros de flete, captura el `req.user.id` del middleware de seguridad y delega la creación en la capa de servicios. Retorna HTTP 201.
*   `getAll(req, res)`:
    *   *Descripción:* Solicita al servicio el historial completo de viajes y los retorna en formato JSON ordenados cronológicamente.
*   `getById(req, res)`:
    *   *Descripción:* Recupera un viaje por su UUID. Retorna HTTP 404 si el registro fue borrado lógicamente.
*   `update(req, res)`:
    *   *Descripción:* Envía los parámetros modificados y el ID del editor a la capa de servicios para actualización y re-cálculo.
*   `remove(req, res)`:
    *   *Descripción:* Solicita la baja lógica de un flete, liberando el vehículo asignado en la misma transacción.

##### B. Controlador de Autenticación (`auth.controller.js`)
*   `login(req, res)`:
    *   *Descripción:* Valida credenciales, comprueba el estado `activo` del usuario, genera tokens JWT y los inyecta en una cookie HttpOnly.
*   `logout(req, res)`:
    *   *Descripción:* Invalida la sesión activa del despachador y limpia las cookies HttpOnly del cliente.
*   `refresh(req, res)`:
    *   *Descripción:* Evalúa el Token de Refresco y emite un nuevo JWT de acceso sin forzar al usuario a re-ingresar credenciales.

##### C. Controladores de Flota (`driver.controller.js` y `vehicle.controller.js`)
*   `getAll`, `getById`, `create`, `update`, `remove`:
    *   *Descripción:* Métodos estándar de administración CRUD y control de estados operativos con baja lógica (Soft Delete).

---

#### 2.2. Funciones de la Capa de Servicios (`src/services/`)
Contiene las reglas de negocio críticas encapsuladas en transacciones ACID.

##### A. Servicio de Viajes (`trip.service.js`)
*   `createTrip(tripData, userId)`:
    *   *Descripción:*
        1. Comprueba la disponibilidad física de los UUIDs de conductor y vehículo.
        2. Normaliza el valor del flete (obliga valor positivo) y calcula el pago del chofer (`valorConductor = valorPago * (pct / 100)`).
        3. Registra el viaje en la base de datos.
        4. Inserta el rastro forense correspondiente en `audit_logs`.
    *   *Garantía:* Todo el proceso corre dentro de un bloque `prisma.$transaction`. Si falla la creación o la escritura en auditoría, se aplica Rollback.
*   `getAllTrips()`:
    *   *Descripción:* Consulta la base de datos excluyendo registros que tengan `deletedAt !== null` e incluye las relaciones normalizadas de vehículo y chofer en una sola consulta.
*   `updateTrip(id, updateData, userId)`:
    *   *Descripción:* Obtiene el registro original, actualiza los campos, re-calcula de manera automática los montos correspondientes y escribe un log de auditoría capturando snapshots `before` y `after`.
*   `deleteTrip(id, userId)`:
    *   *Descripción:* Actualiza el campo `deletedAt` con la marca temporal actual, liberando las estadísticas del vehículo en fletes operativos y registrando la acción en auditoría.

##### B. Servicio de Auditoría (`audit.service.js`)
*   `logAudit({ userId, action, entity, entityId, oldValues, newValues }, transactionClient)`:
    *   *Descripción:* Escribe un registro inmutable en `audit_logs` con los datos JSON delta de la mutación. Se le pasa el cliente de transacción activa (`tx`) para obligar a que la auditoría comparta el mismo ciclo de vida de la transacción ACID principal.

##### C. Servicio de Usuarios y Seguridad (`user.service.js`)
*   `createUser(userData, actorId)`:
    *   *Descripción:* Aplica hashing asíncrono a la contraseña del usuario mediante `bcrypt` con 10 salt rounds y crea la cuenta del despachador con su rol RBAC correspondiente bajo transaccionalidad inmutable.

---

#### 2.3. Funciones Utilitarias y de Soporte (`src/utils/` & Frontend Helpers)

##### A. Escudo del Motor de Base de Datos (`server/src/utils/errorHandler.js`)
*   `formatError(error)`:
    *   *Descripción:* Intercepta y traduce excepciones semánticas de base de datos e infraestructura para ocultar stack traces y evitar fugas de información sensible.
    *   *Traducciones Prisma:*
        - Código `P2002` -> `"El registro ya existe (violación de campo único)."`
        - Código `P2003` -> `"Error de integridad referencial. El recurso está siendo utilizado."`
        - Código `P2025` -> `"El registro solicitado no existe."`

##### B. Formateadores de Visualización (React Client Helpers)
*   `toLocaleDateString(undefined, { timeZone: 'UTC' })`:
    *   *Descripción:* Neutraliza desfases horarios (Timezone shifts) en el renderizado de tablas y exportación de archivos Excel en los módulos `Trips.jsx` y `Finance.jsx`.
*   `formatCOP(value)`:
    *   *Descripción:* Formatea importes numéricos planos a la divisa colombiana nativa con separadores de miles de forma reactiva en el teclado operativo de los formularios de flete (ej: `450.000` pesos).
