# Evaluación de Calidad del Producto de Software (ISO/IEC 25010 - SQuaRE)
## Proyecto: Novapalma (Sistema de Gestión Logística y Financiera)

Este documento realiza un mapeo y evaluación de cómo el sistema **Novapalma** cumple con los criterios y subcaracterísticas del estándar internacional de calidad de software **ISO/IEC 25010**. 

---

## Resumen Ejecutivo de Cumplimiento

El proyecto Novapalma, desarrollado con el stack **PERN** (PostgreSQL, Express, React, Node.js), integra de manera nativa mecanismos avanzados de seguridad, validación en caliente, auditoría forense inmutable y arquitectura desacoplada. A continuación se detalla el nivel de cumplimiento para cada una de las 8 características principales:

```mermaid
radar-chart
    title Nivel de Cumplimiento ISO/IEC 25010 (Estimado)
    "Adecuación Funcional": 95
    "Eficiencia de Desempeño": 90
    "Compatibilidad": 95
    "Usabilidad": 92
    "Fiabilidad": 90
    "Seguridad": 98
    "Mantenibilidad": 95
    "Portabilidad": 95
```

---

### 1. Adecuación Funcional (Functional Suitability)
*Grado en el que el producto de software proporciona funciones que cumplen las necesidades declaradas e implícitas.*

*   **Compleitud Funcional:**
    *   **Implementación:** El sistema cubre el 100% de los requisitos definidos por el cliente en el levantamiento de información (RF01 a RF15): Gestión de Viajes (fletes, pesos, destinos), Control de Flota y Conductores, Tablas de Tarifas y reportes consolidados (márgenes, peajes, ACPM y ferry).
*   **Corrección Funcional:**
    *   **Implementación:** Los cálculos financieros y de tonelaje se realizan con precisión. La interfaz de usuario implementa conversiones bidireccionales transparentes (ej. visualización en Kilogramos para el usuario y persistencia en Toneladas en base de datos mediante floats).
    *   **Validación:** Se definen esquemas **Zod** estrictos en el backend que validan longitudes, formatos (ej. expresiones regulares para placas colombianas `/^[A-Z]{3}[0-9]{3}$/`) y tipos de datos en la entrada del servidor.
*   **Pertinencia Funcional:**
    *   **Implementación:** La plataforma está adaptada estrictamente a la realidad operativa del municipio de Pelaya, Cesar (ej. contempla el cruce de ferry, consumo y subsidios de ACPM, y el transporte de fruto de palma de aceite y compost).

---

### 2. Eficiencia de Desempeño (Performance Efficiency)
*Rendimiento en relación con la cantidad de recursos utilizados bajo condiciones determinadas.*

*   **Comportamiento Temporal:**
    *   **Implementación:** El servidor Express optimizado en Node.js v25 responde a peticiones comunes en milisegundos (< 100ms), cumpliendo con holgura el requisito **RNF02** (tiempo de respuesta menor a 3 segundos). La UI en React utiliza **Vite** para una carga e interactividad inmediata del DOM.
*   **Utilización de Recursos:**
    *   **Implementación:** El pool de conexiones de base de datos se gestiona eficientemente con el cliente Prisma optimizado (`@prisma/adapter-pg`). El uso de contenedores livianos mediante **Docker Compose** limita y optimiza la asignación de memoria y CPU en el sistema host.
*   **Capacidad:**
    *   **Implementación:** El backend cuenta con un middleware de **Rate Limiting** (`express-rate-limit`) configurado para admitir hasta 100 peticiones por cada 15 minutos por IP, protegiendo la capacidad del servidor ante saturación o abusos intencionados. Los payloads JSON de entrada están limitados estrictamente a **10KB** para evitar el agotamiento de memoria RAM.

---

### 3. Compatibilidad (Compatibility)
*Capacidad de dos o más sistemas de intercambiar información y/o coexistir en el mismo entorno.*

*   **Coexistencia:**
    *   **Implementación:** El despliegue a través de **Docker Compose** encapsula los servicios de base de datos, backend y frontend en redes virtuales aisladas. Esto evita conflictos de puertos con otras instancias del sistema host (por ejemplo, si el sistema host ya tiene PostgreSQL corriendo localmente en el puerto 5432, Docker permite mapear o coexistir sin interferencias).
*   **Interoperabilidad:**
    *   **Implementación:** El backend expone una **API REST** estándar que interactúa únicamente mediante el formato estructurado **JSON**. Cuenta con cabeceras CORS configuradas dinámicamente, lo que facilita que el backend atienda llamadas del cliente web de React, aplicaciones móviles o servicios externos autorizados.

---

### 4. Usabilidad (Usability)
*Facilidad con la que los usuarios pueden utilizar el sistema con efectividad, eficiencia y satisfacción.*

*   **Reconocibilidad de la Adecuación:**
    *   **Implementación:** La distribución de la UI presenta un Dashboard de indicadores clave al inicio y menús de navegación claros para Conductores, Vehículos, Viajes y Reportes de Finanzas.
*   **Capacidad de Aprendizaje:**
    *   **Implementación:** Diseño minimalista y limpio con Bootstrap 5, reduciendo la curva de aprendizaje para los despachadores y operadores de la contratista.
*   **Capacidad para ser Operado:**
    *   **Implementación:**
        *   Los inputs numéricos complejos como "Ticket" se modificaron a tipo texto (`type="text" inputMode="numeric" pattern="[0-9]*"`), eliminando los molestos botones incrementales nativos del navegador.
        *   El campo deshabilitado de "Tipo de Pago" (obligado por la DIAN) se diseñó con un cursor de no permitido (`not-allowed`) y colores adaptados para eliminar textos invisibles en modo oscuro.
*   **Protección contra Errores de Usuario:**
    *   **Implementación:**
        *   **Filtros en caliente:** En el frontend, manejadores `onChange` bloquean en tiempo real la inserción de números en campos de texto de nombres, y letras o signos negativos en campos de toneladas, cédulas y teléfonos.
        *   **Validación de teclado:** Bloqueo de las teclas `-`, `+` y `e` en inputs numéricos.
        *   **Soft Delete:** Para evitar la pérdida accidental de datos históricos, la eliminación de vehículos o conductores cambia su estado a inactivo (`deletedAt` con timestamp), preservando la integridad referencial.
*   **Estética de la Interfaz de Usuario:**
    *   **Implementación:** Paleta de colores balanceada con branding institucional (azul y verde de Novapalma). Modo Oscuro dinámico y de alto contraste mediante variables CSS personalizadas que aseguran la correcta lectura de placeholders y cabeceras de tablas.
*   **Accesibilidad:**
    *   **Implementación:** Uso de etiquetas semánticas HTML5, contrastes verificados para entornos de baja luz y diseño totalmente responsivo adaptado a dispositivos móviles y de escritorio.

---

### 5. Fiabilidad (Reliability)
*Capacidad del sistema para mantener un nivel de rendimiento bajo condiciones especificadas.*

*   **Madurez:**
    *   **Implementación:** La robustez del código se valida de manera continua mediante una suite de pruebas de integración extremo a extremo (E2E) escritas con **Selenium WebDriver** (`tests/test-unsanitized-fields.js`).
*   **Disponibilidad:**
    *   **Implementación:** El servidor Express implementa un manejo centralizado de excepciones que evita que fallos en la base de datos o en la validación de negocio provoquen caídas del servicio (cuelgues o interrupción del proceso Node.js).
*   **Tolerancia a Fallos (Fault Tolerance):**
    *   **Implementación:** El middleware centralizado `errorHandler.js` intercepta errores de infraestructura (como fallos de Prisma `P2002`, `P2003`, etc.), devolviendo códigos HTTP semánticos y seguros al cliente, permitiendo al sistema continuar operando con normalidad.
*   **Capacidad de Recuperación:**
    *   **Implementación:** Integridad de datos blindada mediante **Transacciones ACID** de Prisma (`prisma.$transaction`). Si el registro de un viaje o su auditoría fallan, la operación se revierte en su totalidad, garantizando la consistencia. El sistema cuenta además con rutinas para realizar copias de seguridad de PostgreSQL.

---

### 6. Seguridad (Security)
*Grado en que el producto de software protege la información contra accesos no autorizados y fugas de datos.*

*   **Confidencialidad:**
    *   **Implementación:** 
        *   Las contraseñas se almacenan cifradas utilizando **Bcryptjs** con 10 rondas de salting.
        *   El backend aplica una política de **"Zero Visibility"** donde las contraseñas están excluidas de los resultados de las consultas (`select` restrictivos).
        *   La sesión del usuario se gestiona mediante tokens JWT encapsulados en **Cookies HttpOnly**, lo que anula la capacidad de scripts maliciosos de acceder al token vía JavaScript (mitigación de ataques XSS).
*   **Integridad:**
    *   **Implementación:** 
        *   Las cookies de sesión viajan protegidas con las flags `SameSite: Strict` o `None; Secure` según el entorno de despliegue, previniendo ataques de tipo CSRF.
        *   Uso de la librería **Helmet.js** para inyectar cabeceras HTTP de seguridad (Content Security Policy, X-Frame-Options, HSTS).
        *   Validación estricta de payloads con Zod.
*   **No Repudio:**
    *   **Implementación:** Cada creación, modificación o baja de registros críticos (viajes, tarifas, usuarios) queda registrada en una tabla inmutable de **Auditoría Forense** (`audit_logs`), capturando de forma obligatoria el ID del actor, fecha y hora, IP origen y cabecera de UserAgent.
*   **Responsabilidad (Accountability):**
    *   **Implementación:** El sistema de auditoría guarda snapshots completos en formato JSON del estado anterior (`oldValues`) y el estado posterior (`newValues`) de cada registro. Esto permite determinar exactamente qué usuario alteró un dato, qué valor modificó y en qué momento preciso.
*   **Autenticidad:**
    *   **Implementación:** El middleware de guardia `authMiddleware.js` intercepta y valida la firma digital y expiración de los JWT antes de dar paso a los servicios. Se implementa control de acceso basado en roles (**RBAC**), distinguiendo estrictamente los permisos entre un `ADMIN` y un `OPERADOR`.

---

### 7. Mantenibilidad (Maintainability)
*Facilidad con la que el código de software puede ser modificado para corregirlo, mejorarlo o adaptarlo.*

*   **Modularidad:**
    *   **Implementación:** Estructura modular basada en el patrón **MVC Potenciado** (Rutas $\rightarrow$ Controladores $\rightarrow$ Servicios $\rightarrow$ Modelos). La lógica de negocio está completamente desacoplada de la orquestación de transporte HTTP (controladores).
*   **Reusabilidad:**
    *   **Implementación:** La Capa de Servicios centraliza las consultas de datos, permitiendo que un mismo servicio (ej. `auditService` o `userService`) sea invocado por controladores HTTP, utilidades de terminal (CLI) o tareas programadas sin duplicar código.
*   **Capacidad de ser Analizado:**
    *   **Implementación:** El código cuenta con una cobertura de comentarios técnicos de estilo **DevOps Senior**, detallando el racional técnico de las soluciones (ej. Timezone shifts, mitigación de errores de Prisma). Adicionalmente, el servidor arroja notificaciones formateadas por consola como `🛡️ Auditoría Forense confirmada` para facilitar la depuración en tiempo de desarrollo.
*   **Capacidad de ser Modificado:**
    *   **Implementación:** Las migraciones de base de datos se gestionan de forma declarativa e incremental con **Prisma Migrate**, permitiendo evolucionar el esquema relacional de PostgreSQL de forma segura.
*   **Capacidad de ser Probado (Testability):**
    *   **Implementación:** Cuenta con scripts de validación automatizados en consola (`test-validation.sh` y `test-vehicles.sh`) y la suite de pruebas funcionales de Selenium WebDriver, permitiendo validar la integridad del sistema en menos de un minuto ante cualquier modificación del código.

---

### 8. Portabilidad (Portability)
*Facilidad con la que el software se puede transferir de un entorno de hardware, software u operacional a otro.*

*   **Adaptabilidad:**
    *   **Implementación:** El sistema está completamente parametrizado a través de variables de entorno (archivo `.env`), permitiendo configurar la URL de conexión a la base de datos, el puerto del servidor, los dominios CORS permitidos y el entorno (`development` / `production`) sin alterar una sola línea de código fuente.
*   **Facilidad de Instalación:**
    *   **Implementación:** La portabilidad del sistema está garantizada por contenedores **Docker**. Levantar la arquitectura completa de Novapalma (Base de datos PostgreSQL, API Backend en Node y Frontend en React) requiere únicamente la ejecución de:
      ```bash
      docker compose up -d --build
      ```
*   **Capacidad de ser Reemplazado:**
    *   **Implementación:** Al estar estructurado como un backend REST API desacoplado del frontend SPA (Single Page Application), es posible reescribir o reemplazar completamente el cliente web por una aplicación móvil (Flutter/React Native) o de escritorio sin necesidad de modificar el servidor y la base de datos.
