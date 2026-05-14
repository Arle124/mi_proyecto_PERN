# Documentación Técnica - Sistema de Gestión Logística Novapalma
## Arquitectura de Software y Estándares de Ingeniería

Este documento detalla la arquitectura, decisiones de diseño y estándares técnicos implementados en el backend del proyecto Novapalma, diseñado bajo un esquema de alta disponibilidad, integridad de datos y trazabilidad forense.

---

### 1. Patrón MVC Potenciado (Service-Controller Pattern)

El proyecto implementa una evolución del patrón Model-View-Controller tradicional, denominada **MVC Potenciado**. Esta arquitectura introduce una capa de abstracción adicional para desacoplar la lógica de transporte de la lógica de dominio.

*   **Controladores (`src/controllers`):** Actúan estrictamente como orquestadores de entrada/salida. Su responsabilidad se limita a la extracción de parámetros de la petición HTTP, la invocación de servicios y la determinación del código de estado HTTP y formato de respuesta.
*   **Capa de Servicios (`src/services`):** Es el núcleo de la aplicación. Mover la lógica de persistencia y las reglas de negocio fuera del controlador permite que procesos críticos, como la **Auditoría Forense**, sean transversales y obligatorios. Al centralizar la mutación de datos en servicios, garantizamos que ninguna entidad sea creada o modificada sin pasar por los protocolos de validación y registro de auditoría, independientemente del punto de entrada (API, CLI o Tareas Programadas).
*   **Rutas (`src/routes`):** Implementan un enrutamiento modular y jerárquico que facilita la escalabilidad y el mantenimiento del mapa de endpoints.

---

### 2. Stack PERN y Persistencia con Prisma 7

La infraestructura se apoya en el stack **PERN** (PostgreSQL, Express, React, Node.js), optimizado mediante el uso de **Prisma 7**.

*   **Prisma Client & Adapter:** Se utiliza `@prisma/adapter-pg` para gestionar un pool de conexiones nativo a PostgreSQL. Esta configuración optimiza el rendimiento mediante la reutilización de conexiones y garantiza la compatibilidad con entornos de ejecución modernos.
*   **Tipado Fuerte y Modelado:** El esquema de Prisma define una "Single Source of Truth" para el modelo de datos. La utilización de tipos autogenerados minimiza errores en tiempo de ejecución y facilita el mantenimiento de una estructura 3NF (Tercera Forma Normal).
*   **Migraciones y Control de Versiones:** El esquema (`schema.prisma`) documenta no solo las tablas, sino las reglas de integridad referencial y enums de dominio controlado.

---

### 3. Auditoría Forense e Integridad ACID

El sistema cumple con requerimientos de alta seguridad mediante una estrategia de **Auditoría Forense Inmutable**.

*   **Garantía ACID vía `prisma.$transaction`:** Para asegurar la atomicidad de las operaciones, se utiliza `prisma.$transaction`. Este mecanismo garantiza que la creación de un recurso (ej. Usuario) y su correspondiente entrada en el log de auditoría se traten como una única unidad de trabajo. Si el registro de auditoría fallara por cualquier motivo técnico, la transacción completa se revierte (Rollback), impidiendo la existencia de datos "huérfanos" de trazabilidad.
*   **Borrado Lógico (Soft Delete):** Por razones de integridad referencial y trazabilidad histórica (esencial para la logística de frutas), el sistema prohíbe el borrado físico de registros críticos. Se implementa un mecanismo de "Soft Delete" mediante el cual se actualiza el campo `deletedAt` con el timestamp actual y se marca el registro como `activo: false`. Esta acción es capturada por el `auditService` como un evento de `UPDATE` (Soft Delete), preservando la cadena de custodia de la información.
*   **Seguridad de Capa (Bcrypt):** La protección de credenciales se integra directamente en la Capa de Servicios. Se utiliza `bcrypt` con **10 salt rounds**, ejecutando el hashing de forma asíncrona antes de la persistencia. Esta integración en el nivel de servicio asegura que las contraseñas nunca viajen en texto plano hacia la base de datos y que la política de seguridad se aplique de forma consistente.
*   **Feedback de Consola y Monitoreo:** Como parte del monitoreo en tiempo de ejecución, el sistema implementa logs visuales de alta visibilidad. La aparición del símbolo `🛡️ Auditoría Forense confirmada` en la consola del servidor indica que el ciclo de vida de la transacción ACID se ha completado satisfactoriamente, facilitando las tareas de depuración y auditoría en entornos de desarrollo y staging.
*   **Modelo de Snapshotting:** La tabla `audit_logs` utiliza campos de tipo `Json` para almacenar snapshots de `oldValues` y `newValues`.
    *   **Trazabilidad Delta:** Permite reconstruir el estado de cualquier entidad en un punto específico del tiempo.
    *   **No Repudio:** Al capturar IP, UserAgent y el ID del actor, se establece una cadena de custodia clara sobre cada cambio en el sistema.

---

### 4. Estructura del Proyecto

La organización del código sigue principios de **Clean Architecture** y separación de responsabilidades:

```text
server/
├── prisma/               # Configuración de base de datos y esquema de Prisma
├── src/
│   ├── app.js            # Configuración de Express y Middlewares globales
│   ├── config/           # Configuraciones centralizadas (DB, Auth, Env)
│   ├── controllers/      # Handlers de rutas (Orquestación HTTP)
│   ├── middlewares/      # Lógica intermedia (Auth, Validation, Errors)
│   ├── routes/           # Definición de endpoints y versionamiento
│   ├── services/         # Lógica de negocio y persistencia (Capa Core)
│   └── utils/            # Funciones auxiliares y constantes globales
├── index.js              # Punto de entrada (Servidor HTTP/Listener)
└── DOCUMENTATION.md      # Este documento
```

---

### 5. Flujo de Ejecución (Ejemplo: Creación de Usuario)

1.  **Request:** Llega un POST a `/api/usuarios`.
2.  **Router:** Deriva la petición a `user.controller.js`.
3.  **Controller:** Valida el body y llama a `userService.createUser()`.
4.  **Service:**
    *   Genera el hash de la contraseña vía `bcrypt`.
    *   Inicia `prisma.$transaction`.
    *   Crea el registro en la tabla `users`.
    *   Crea el registro en `audit_logs` con el snapshot inicial.
5.  **Response:** El controlador retorna el recurso creado o el error capturado en el bloque `try/catch`.

---

### 6. Contratos de Validación (Zod)

El sistema emplea **Zod** para la definición de contratos de validación de esquemas. Esta capa actúa como un firewall de datos antes de que las peticiones alcancen la capa de servicios.

*   **Validación de Esquemas:** Cada módulo cuenta con esquemas definidos que validan tipos de datos, longitudes y formatos específicos (ej. formato de correo electrónico, longitud de contraseñas).
*   **Regex de Dominio:** Para el módulo de vehículos, se implementa una validación por expresión regular que garantiza el cumplimiento del formato de placas colombianas (`/^[A-Z]{3}[0-9]{3}$/`), asegurando que solo datos normalizados entren al sistema.
*   **Middleware de Validación:** Un middleware genérico (`validate.middleware.js`) intercepta las peticiones, procesa los errores de Zod y retorna respuestas `400 Bad Request` con un desglose detallado de los fallos, mejorando la experiencia del desarrollador frontend.

---

### 7. Módulos del Sistema

*   **Usuarios:** Gestión de personal, control de acceso basado en roles (RBAC) y administración de identidades.
*   **Vehículos:** Control exhaustivo de la flota logística. Incluye gestión de capacidad en toneladas, marcas, modelos y seguimiento de estados operativos (`DISPONIBLE`, `EN_VIAJE`, `MANTENIMIENTO`).

---

### 8. Automatización de Pruebas

Se han implementado scripts de automatización para garantizar la estabilidad del backend y facilitar la integración continua (CI):

*   **`test-validation.sh`:** Valida la robustez del middleware de validación y los contratos de Zod.
---

### 9. Diccionario de Datos

El diseño detallado de la base de datos (Entidad-Relación, tipos y restricciones) se encuentra sincronizado automáticamente con el esquema de base de datos relacional (RDBMS) mediante Prisma.

*   **Archivo Oficial:** `Diccionario_Datos_V2_Sincronizado.xlsx`
*   **Contenido:** Detalle multihidja (una pestaña por modelo: `User`, `Driver`, `Vehicle`, `Trip`, `AuditLog`, etc.), incluyendo nulidad, claves primarias/foráneas y descripciones funcionales estandarizadas.
*   **Generación:** Sincronizado dinámicamente mediante el script `generate_dict.py`.
*   **Estado:** **Listo para entrega final (Sustentación de Proyecto).**

---

### 10. Seguridad y Autenticación

El sistema implementa una arquitectura de seguridad multicapa para cumplir con los estándares de integridad y confidencialidad.

*   **Hashing de Contraseñas (RNF01):** Se utiliza `bcryptjs` con un factor de costo de 10 para cifrar las contraseñas antes de su almacenamiento. El sistema aplica una política de "Zero Visibility", donde las contraseñas nunca son devueltas en las peticiones API mediante la cláusula `select` de Prisma y desestructuración de objetos en la capa de servicios.
*   **Autenticación JWT (RF01):** La autenticación se gestiona mediante **JSON Web Tokens**.
    *   **Flujo:** Tras un login exitoso en `/api/auth/login`, el servidor emite un token firmado con una validez de 8 horas.
    *   **Payload:** El JWT incluye el `id` y el `rol` del usuario, lo que permite una trazabilidad inmediata y eficiente sin consultas redundantes a la base de datos.
    *   **Transporte:** El cliente debe incluir este token en el header `Authorization: Bearer <token>` para todas las peticiones a rutas protegidas.
*   **Control de Acceso Basado en Roles (RBAC):** Se implementa una capa de autorización mediante `role.middleware.js`.
    *   **`adminMiddleware`:** Restringe el acceso a endpoints sensibles (como la gestión de usuarios) exclusivamente a usuarios con el rol `ADMIN`.
*   **Middleware de Guardia (`authMiddleware`):** Intercepta las peticiones, valida la firma del token y el tiempo de expiración. Una vez validado, inyecta el ID y el Rol del usuario en el objeto `req.user`.
*   **Contexto de Auditoría:** La integración de la seguridad permite que el `auditService` capture automáticamente la identidad del actor que realiza mutaciones en los módulos de Vehículos y Usuarios, garantizando la trazabilidad forense total.

---

### 11. Catálogo de Endpoints y Seguridad

| Módulo | Endpoint | Método | Middleware de Seguridad | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `/api/auth/login` | POST | Público | Inicio de sesión y emisión de JWT. |
| **Usuarios** | `/api/usuarios` | GET | `authMiddleware` + `isAdmin` | Listar todos los usuarios. |
| **Usuarios** | `/api/usuarios` | POST | `authMiddleware` + `isAdmin` | Registrar un nuevo usuario. |
| **Vehículos** | `/api/vehiculos` | GET | `authMiddleware` | Listar flota vehicular. |
| **Vehículos** | `/api/vehiculos/:id` | GET | `authMiddleware` | Detalle de un vehículo específico. |
| **Vehículos** | `/api/vehiculos` | POST | `authMiddleware` | Registrar nuevo vehículo. |
| **Vehículos** | `/api/vehiculos/:id` | PUT | `authMiddleware` + `isAdmin` | Actualizar datos de vehículo. |
| **Vehículos** | `/api/vehiculos/:id` | DELETE | `authMiddleware` + `isAdmin` | Baja lógica (Soft Delete). |
| **Conductores** | `/api/conductores` | GET | `authMiddleware` | Listar todos los conductores. |
| **Conductores** | `/api/conductores/:id` | GET | `authMiddleware` | Detalle de un conductor. |
| **Conductores** | `/api/conductores` | POST | `authMiddleware` | Registrar nuevo conductor. |
| **Conductores** | `/api/conductores/:id` | PUT | `authMiddleware` + `isAdmin` | Actualizar datos de conductor. |
| **Conductores** | `/api/conductores/:id` | DELETE | `authMiddleware` + `isAdmin` | Baja lógica de conductor. |
| **Viajes** | `/api/viajes` | GET | `authMiddleware` | Listar historial de viajes. |
| **Viajes** | `/api/viajes/:id` | GET | `authMiddleware` | Detalle técnico de un viaje. |
| **Viajes** | `/api/viajes` | POST | `authMiddleware` | Registrar nuevo viaje (ACID). |
| **Viajes** | `/api/viajes/:id` | PUT | `authMiddleware` | Actualizar viaje y re-calcular. |
| **Viajes** | `/api/viajes/:id` | DELETE | `authMiddleware` + `isAdmin` | Eliminación forense de viaje. |
| **Tarifas** | `/api/tarifas` | GET | `authMiddleware` | Consultar tarifario vigente. |
| **Tarifas** | `/api/tarifas` | POST | `authMiddleware` + `isAdmin` | Configurar/Upsert de tarifas base. |

---

### 12. Seguridad Avanzada e Infraestructura (Hardening)

Como parte de la evolución hacia un sistema de grado empresarial, se ha implementado una capa de seguridad perimetral y de transporte robusta.

#### 12.1. Blindaje de Transporte (HttpOnly Cookies)
Para mitigar ataques de **Cross-Site Scripting (XSS)**, el sistema ha migrado de la gestión de tokens en `localStorage` a **Cookies HttpOnly**.
*   **Aislamiento del Token:** El JWT es gestionado directamente por el navegador. El código JavaScript del cliente no puede acceder al token via `document.cookie`, lo que anula la posibilidad de robo de sesión mediante scripts maliciosos.
*   **Configuración Enterprise:** Las cookies se emiten con flags `Strict` para `SameSite` (prevención de CSRF) y `Secure` en entornos de producción.
*   **Transparencia con Axios:** La capa de API (`axios.js`) utiliza `withCredentials: true`, permitiendo que el navegador adjunte automáticamente la cookie de sesión en cada petición hacia el dominio del backend.

#### 12.2. Protección de Cabeceras (Helmet.js)
Se utiliza **Helmet** para configurar automáticamente cabeceras de seguridad HTTP esenciales:
*   **Content-Security-Policy:** Previene la ejecución de scripts no autorizados.
*   **X-Frame-Options:** Protege contra ataques de Clickjacking.
*   **Strict-Transport-Security:** Fuerza la comunicación sobre canales cifrados (HSTS).

#### 12.3. Prevención de Abuso (Rate Limiting)
Para proteger la infraestructura contra ataques de denegación de servicio (DoS) y fuerza bruta, se ha implementado un limitador de tasa de peticiones.
*   **Umbral:** 100 peticiones por cada ventana de 15 minutos por IP.
*   **Visibilidad:** El sistema informa al cliente sobre su estado de consumo mediante cabeceras estándar `RateLimit-*`.

#### 12.4. Sanitización y Control de Payload
*   **Límite de Body:** El servidor restringe el tamaño de las peticiones JSON a **10kb**, mitigando ataques de saturación de memoria por payloads excesivamente grandes.
*   **Manejo de Errores Silencioso:** En entornos de producción, el sistema nunca filtra trazas de error (stack traces) al cliente final, devolviendo mensajes genéricos para evitar la fuga de información técnica sobre la infraestructura.

---

### 13. Cultura DevOps: Comentarios de Código Senior

Siguiendo las mejores prácticas de ingeniería, el código fuente ha sido enriquecido con comentarios de estilo **DevOps Senior**. Estos comentarios no solo explican *qué* hace el código, sino el *por qué* de cada decisión técnica, facilitando la comprensión de la infraestructura para futuros auditores y desarrolladores.
