# Centro de Documentación - Novapalma Logística 🌴
## Mapa de Documentación y Guías del Proyecto

Bienvenido al directorio central de documentación de **Novapalma**. Aquí encontrarás las guías de ingeniería, diccionarios y manuales técnicos detallados del sistema.

### 📖 Contenido Disponible:

1.  👉 **[Documentación Técnica General (DOCUMENTATION.md)](./DOCUMENTATION.md)**
    *   Detalle profundo de la **Arquitectura MVC Potenciada** (Rutas -> Controladores -> Capa de Servicios).
    *   Integración del ORM Prisma 7 y PostgreSQL.
    *   Mecanismo de **Auditoría Forense Inmutable** (`audit_logs` con snapshots before/after).
    *   Políticas de borrado lógico (Soft Delete) y transacciones atómicas robustas (ACID).
    *   Seguridad avanzada y hardening (Helmet.js, HttpOnly cookies, Rate limiting, sanitización).

2.  👉 **[Diccionario de Datos Completo (DATA_DICTIONARY.md)](./DATA_DICTIONARY.md)**
    *   Catálogo exhaustivo de todas las tablas relacionales de la base de datos (3NF).
    *   Detalle columna por columna de `users`, `drivers`, `vehicles`, `trips`, `audit_logs` y `refresh_tokens`.
    *   Tipos de datos de PostgreSQL, restricciones, claves primarias/foráneas y descripciones funcionales.
    *   Índices optimizados de rendimiento para reportes dinámicos.

3.  👉 **[Guía de Pruebas y Control de Calidad (TESTING_GUIDE.md)](./TESTING_GUIDE.md)**
    *   Instrucciones para correr la suite de pruebas de extremo a extremo (E2E) con **Selenium WebDriver**.
    *   Detalle técnico de los scripts de firewall de datos y validaciones de Zod (`tests/test-validation.sh` y `tests/test-vehicles.sh`).
    *   Estrategias de resiliencia y tolerancia a fallos ante microdesconexiones del motor relacional.

4.  👉 **[Guía de Instalación y Despliegue General (README.md Principal)](../README.md)**
    *   Requisitos de inicio rápido.
    *   Despliegue automatizado con **Docker Compose** en un solo comando (Recomendado).
    *   Guía de inicio en desarrollo local clásico paso a paso.

---
*Directorio oficial de sustentación técnica de Ingeniería de Software — Novapalma Logística.*
