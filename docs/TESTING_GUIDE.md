# Guía de Pruebas y Aseguramiento de Calidad (QA)
## Plan de Verificación, Pruebas Unitarias y E2E — Novapalma Logística

Este documento describe la suite de pruebas automatizadas y herramientas de control de calidad (QA) disponibles en el proyecto, garantizando la estabilidad operativa, la prevención de caídas de servicio y la correcta inyección del Pool de Conexión de PostgreSQL.

---

### 1. Pruebas de Integración y E2E (Selenium WebDriver)

El proyecto cuenta con una prueba de integración interactiva y de extremo a extremo (E2E) mediante Selenium WebDriver.

*   **Archivo:** `tests/test-quality.js`
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
node tests/test-quality.js
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

---

### 5. Suite de Pruebas de Seguridad y Trazabilidad (Admin Lockout Prevention)

Para validar las reglas de negocio de alta seguridad (evitar auto-bloqueo del administrador activo y garantizar que siempre quede al menos un administrador activo en el sistema), se cuenta con la prueba de seguridad automatizada.

*   **Archivo:** `tests/test-lockout.sh`
*   **Propósito:** Intenta desactivar o degradar al administrador semilla autenticado, y comprueba que el backend deniegue la petición de forma segura y controlada con un mensaje apropiado.

#### Ejecución:
```bash
chmod +x tests/test-lockout.sh
./tests/test-lockout.sh
```

El correcto funcionamiento de esta suite de pruebas demuestra el 100% de trazabilidad de seguridad en la capa lógica.

---

### 6. Suite de Pentesting Automático y Resiliencia E2E
Esta prueba simula ataques perimetrales lógicos para verificar los mecanismos de seguridad del backend ante amenazas web comunes.

*   **Archivo:** `tests/test-selenium-security.js`
*   **Tecnologías:** `selenium-webdriver` + Chrome Headless.
*   **Propósito:** Auditar la efectividad de las defensas lógicas y cortafuegos ante Inyección SQL e inundación de peticiones.

#### Cobertura de la Suite:
1.  **Mitigación de Inyección SQL (SQLi Bypass):** Intenta inyectar payloads SQL clásicos (`' OR '1'='1`) en los campos del formulario de Login para auditar que la combinación de validación Zod y el hashing de base de datos deniegue el ingreso de forma controlada.
2.  **Mitigación de DDoS Lógico y Fuerza Bruta:** Envía clics e inundaciones masivas en ráfagas al botón de inicio de sesión para verificar la respuesta del limitador de tasa del servidor (`express-rate-limit`), auditando que el cortafuegos perimetral retorne un código de estado `429 Too Many Requests`.

#### Ejecución:
```bash
node tests/test-selenium-security.js
```

---

### 7. Suite de Sanitización y Validación Visual E2E
Audita minuciosamente las defensas del frontend y la usabilidad de los formularios en tiempo real, garantizando la consistencia y sanitización dinámica antes del envío de datos.

*   **Archivo:** `tests/test-unsanitized-fields.js`
*   **Tecnologías:** `selenium-webdriver` + Chrome Headless.
*   **Propósito:** Validar que los campos de entrada no acepten datos inválidos y que las conversiones automáticas funcionen visualmente sin fricción.

#### Cobertura de la Suite:
1.  **Campos Alfabéticos:** Digita números y caracteres especiales en los nombres de usuarios y conductores, auditando que el manejador `onChange` remueva instantáneamente cualquier carácter no alfabético de la pantalla.
2.  **Campos Numéricos y Cédula:** Intenta escribir letras y guiones en los campos de teléfono o cédula, verificando que los inputs numéricos permanezcan limpios y solo contengan dígitos.
3.  **Inputs de Límites y Negativos:** Verifica la inyección de guiones (`-`), signos de suma (`+`) y notaciones de exponente (`e` o `E`) en los inputs numéricos (como tonelaje o consumo de ACPM), comprobando que el frontend prevenga e impida físicamente cualquier valor negativo o nulo.
4.  **Cálculo e Inputs en Kilogramos:** Digita pesos en kilogramos (ej: `8540`) y tarifas en pesos por kilo (ej: `130`), auditando que las tarjetas del frontend muestren en tiempo real el tonelaje equivalente (`8.540 Tn`) y las tarifas calculadas por tonelada antes de la confirmación.

#### Ejecución:
```bash
node tests/test-unsanitized-fields.js
```

---

### 8. Pruebas Unitarias Atómicas de Esquemas de Validación (Backend)
Suite de pruebas de bajo nivel para asegurar que el firewall del backend (definido mediante esquemas Zod) valide e intercepte correctamente los payloads recibidos en la API antes de tocar la base de datos.

*   **Archivo:** `tests/test-schemas-unit.js`
*   **Tecnologías:** Módulo nativo de aserciones de Node.js (`node:assert`) + **Zod**.
*   **Propósito:** Verificar el comportamiento atómico de los esquemas Zod de conductores, vehículos y creación de usuarios ante casos de prueba válidos y extremos no válidos.

#### Ejecución:
```bash
node tests/test-schemas-unit.js
```

El correcto funcionamiento de todas estas suites de pruebas demuestra el 100% de trazabilidad, robustez, calidad y seguridad en la plataforma Novapalma.

