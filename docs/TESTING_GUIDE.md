# Guía de Pruebas y Aseguramiento de Calidad (QA)
## Plan de Verificación, Pruebas Unitarias y E2E — Novapalma Logística

Este documento describe la suite de pruebas automatizadas y herramientas de control de calidad (QA) disponibles en el proyecto, garantizando la estabilidad operativa, la prevención de caídas de servicio y la correcta inyección del Pool de Conexión de PostgreSQL.

---

### 1. Pruebas de Integración y E2E (Selenium WebDriver)

El proyecto cuenta con una prueba de integración interactiva y de extremo a extremo (E2E) mediante Selenium WebDriver.

*   **Archivo:** `server/test-quality.js`
*   **Tecnologías:** `selenium-webdriver` + Chrome Headless.
*   **Propósito:** Validar el ciclo completo del usuario sin intervención humana.

#### Cobertura del Flujo E2E:
1.  **Transporte seguro:** Conecta con la interfaz visual del cliente en `http://localhost:5173/login`.
2.  **Autenticación:** Rellena de forma automatizada las credenciales del Administrador Semilla (`admin@novapalma.com` / `admin123`).
3.  **Autorización & Redirección:** Simula el clic de envío, detecta la respuesta de cookies seguras HttpOnly y espera la redirección del navegador al panel principal `/`.
4.  **Carga de Métricas Dinámicas:** Valida que las cuatro tarjetas principales de estadísticas (Viajes del mes, Vehículos Activos, Conductores Activos y Facturación Consolidada) se carguen dinámicamente desde la base de datos a través de las APIs del servidor, descartando estados de carga pendientes (`...`).
5.  **Informe de Salud:** Emite un reporte consolidado en consola con el estado técnico de los endpoints.

#### Ejecución:
Para ejecutar la prueba de calidad (asegúrate de tener levantado el entorno con Docker o de forma local):
```bash
cd server
node test-quality.js
```

---

### 2. Pruebas de Firewall de Entrada y Contratos (Zod Validator)

Para garantizar la integridad y sanitización de los datos enviados a la base de datos (evitando SQL Injection, payloads excesivamente grandes y desbordamiento de tipos), el sistema implementa validaciones estrictas en el nivel del router a través de **Zod**.

*   **Script de Validación:** `tests/test-validation.sh`
*   **Formato:** Shell Script + peticiones `curl`.
*   **Módulo Evaluado:** `/api/viajes` (Registro de Viajes) y `/api/vehiculos` (Gestión de Flota).

#### Flujo de Prueba de Firewall:
El script realiza peticiones deliberadamente erróneas al servidor local backend (`http://localhost:3001`):
1.  **Peso Negativo o Inválido:** Envía un viaje con peso en toneladas menor a cero, esperando un código de estado `400 Bad Request` y un reporte detallado del esquema de Zod.
2.  **Formato de Placa Erróneo:** Envía el registro de un vehículo con placa fuera del formato oficial colombiano (ej. `AB12` en lugar del regex requerido `/^[A-Z]{3}[0-9]{3}$/`), esperando el rechazo inmediato por parte de la capa de seguridad.

#### Ejecución:
```bash
chmod +x tests/test-validation.sh
./tests/test-validation.sh
```

---

### 3. Pruebas de Registro Operativo de Flota

Para validar el flujo normalizado de registro de vehículos con placa reglamentaria y validaciones de Zod.

*   **Archivo:** `tests/test-vehicles.sh`
*   **Propósito:** Probar la creación exitosa y fallida de vehículos directamente sobre el endpoint `/api/vehiculos`.

#### Ejecución:
```bash
chmod +x tests/test-vehicles.sh
./tests/test-vehicles.sh
```

---

### 4. Directrices de Hardening y Tolerancia a Fallos

*   **Tolerancia en Conexiones Inactivas (Idle Pool):**
    El backend cuenta con un blindaje en `db.js` mediante la escucha activa del evento `error` en el Pool de conexiones de `pg`. Esto previene caídas silenciosas del proceso de Node.js si la base de datos experimenta microdesconexiones de red.
*   **Captura Global de Excepciones:**
    En `server/index.js` se implementan escuchadores globales para `uncaughtException` y `unhandledRejection`. Si ocurre un fallo crítico imprevisto en alguna promesa o hilo de ejecución, el servidor captura el error, escribe el stack trace en logs y continúa operando sin tirar abajo el proceso principal.
