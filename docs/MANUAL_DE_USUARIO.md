# Manual de Usuario - Novapalma Logística 🌴
## Guía Operativa del Sistema de Gestión de Viajes y Control Financiero

Este manual describe el funcionamiento de la plataforma **Novapalma** y proporciona instrucciones paso a paso para despachadores, operadores y administradores del sistema.

---

### 1. PANTALLA DE INICIO DE SESIÓN (LOGIN)

El ingreso a la plataforma está protegido mediante autenticación con cifrado bancario y cookies seguras HttpOnly para evitar secuestros de sesión.

#### Instrucciones de Ingreso:
1. Navegue al enlace del sistema (En línea: `https://novapalma.vercel.app/login`).
2. Visualizará el logotipo corporativo de **Novapalma Logistics** (imagotipo premium que combina azul y verde).
3. Ingrese su **Correo Electrónico Corporativo** y su **Contraseña**.
4. Haga clic en el botón **Ingresar** (color azul eléctrico con efecto de elevación táctil).
5. Si sus credenciales son correctas, el sistema inyectará la sesión en el navegador y lo redireccionará instantáneamente al **Dashboard Principal**.

> [!IMPORTANT]
> **Seguridad Antivandalismo (Rate Limiting):** 
> Si realiza más de 15 intentos de inicio de sesión fallidos en menos de 15 minutos desde la misma dirección IP, el backend bloqueará temporalmente su acceso mostrando el error `429 Too Many Requests`. Adicionalmente, el sistema limita las peticiones generales a la API para evitar abusos o ataques de denegación de servicio.

---

### 2. PANEL DE CONTROL (DASHBOARD PRINCIPAL)

El Dashboard es el panel centralizador de estadísticas. Se alimenta en tiempo real de la base de datos PostgreSQL, recalculándose automáticamente con cada viaje registrado.

#### Indicadores Clave de Desempeño (KPIs):
- **Viajes del Mes:** Total de fletes logísticos completados en el período actual.
- **Vehículos Activos:** Cantidad de camiones en la flota operativa disponibles para fletes.
- **Conductores Activos:** Número de choferes dados de alta y autorizados.
- **Facturación Consolidada:** Sumatoria monetaria de todos los fletes cargados en el mes, expresada en pesos colombianos (COP).

> [!NOTE]
> Todos los importes financieros se muestran formateados con signos de pesos y separadores de miles para facilitar su lectura rápida bajo estrés operativo.

---

### 3. MÓDULO DE CONDUCTORES Y VEHÍCULOS (GESTIÓN DE FLOTA)

Módulo exclusivo para el registro y control de recursos logísticos.

#### 3.1. Gestión de Conductores
Al registrar o editar un conductor, el sistema activa un **firewall dinámico en caliente** en el teclado del usuario:
- **Nombres y Apellidos:** El campo cuenta con un filtro alfabético reactivo. Si intenta digitar números o símbolos especiales, el frontend los remueve instantáneamente de la pantalla, aceptando únicamente letras y espacios.
- **Cédula y Teléfono:** Cuentan con un filtro numérico estricto. Se impide físicamente la escritura de letras o guiones, aceptando única y estrictamente dígitos enteros.

#### 3.2. Gestión de Vehículos
- **Placa:** Debe ingresarse obligatoriamente bajo el formato estándar colombiano de tránsito (`AAA123` - 3 letras mayúsculas seguidas de 3 dígitos). Si se ingresa una estructura errónea, el formulario de Zod la intercepta y bloquea el envío.
- **Capacidad:** Debe registrarse en toneladas decimales (ej: `32.50` para tractomulas de tres ejes).
- **Estado:** El vehículo se clasifica en dos estados operativos posibles: **DISPONIBLE** (activo en la flota y listo para ser asignado a nuevos viajes) o **INACTIVO** (desactivado de la flota activa mediante la baja lógica).

---

### 4. MÓDULO DE VIAJES (NÚCLEO OPERATIVO)

Este panel representa el corazón transaccional de **Novapalma** y es operado diariamente por los despachadores en báscula.

```text
 [ Báscula Física ] ──(Ticket Peso)──> [ Digitación Reactiva UI ] ──(ACID)──> [ PostgreSQL + Auditoría ]
```

#### 4.1. Registro de un Nuevo Viaje
1. Presione el botón **Registrar Viaje** para abrir el modal flotante interactivo.
2. **Número de Ticket:** Digite el número secuencial de la báscula física.
   * *Blindaje UI:* Este input ha sido configurado para eliminar las molestas e ineficientes flechas incrementales nativas. Adicionalmente, cuenta con un filtro por expresiones regulares que impide la entrada de signos negativos (`-`), sumas (`+`) o letras de notación exponencial (`e`).
3. **Selección de Conductor y Vehículo:** Despliegue el menú de selección. Solo se listarán los choferes y camiones que estén en estado activo.
4. **Digitación en Kilogramos:** Para evitar que el despachador tenga que realizar conversiones manuales en papel, la interfaz de usuario le permite digitar el peso en **Kilogramos** (ej: `12.540 kg`). Al presionar guardar, el sistema realiza la conversión automática y transparente dividiendo por 1.000 para persistir el valor exacto en **Toneladas** (`12.540 Tn`) en el motor PostgreSQL.
5. **Formateo Monetario en Caliente (Separador de Miles):** A medida que digita importes monetarios como el **Flete Pactado** o el costo de **ACPM**, el input formatea el texto en vivo agregando puntos de separación de miles (ej: si escribe `1250000`, la pantalla le mostrará visualmente de forma reactiva `1.250.000` pesos COP). Esto previene errores de digitación de ceros adicionales.

#### 4.2. Edición y Eliminación Segura
- **Edición:** El modal de edición implementa una conversión automática bidireccional: descarga el peso en toneladas de la base de datos, lo multiplica por 1.000 y lo presenta en la pantalla del despachador en kilogramos para su cómoda modificación, volviendo a convertirlo a toneladas al guardar.
- **Eliminación:** Exclusiva para administradores. Al presionar eliminar, se despliega un **Modal de Confirmación Elegante de Bootstrap 5** (en lugar de los diálogos nativos y feos de `window.confirm`) detallando los datos del ticket a dar de baja. Al confirmar, el sistema realiza un **Soft Delete** (borrado lógico), preservando el registro histórico inalterado en auditoría forense pero liberando el vehículo para nuevos fletes en el panel activo.

---

### 5. MÓDULO DE REPORTES Y FINANZAS (FINANZAS)

Módulo gerencial de alta dirección diseñado para auditar márgenes de rentabilidad.

#### Operación del Panel:
1. **Filtro de Fechas:** Ingrese un rango de fechas (Fecha Inicio y Fecha Fin) mediante los selectores de calendario nativos (en modo oscuro, el icono del calendario se invierte automáticamente a color blanco brillante para un contraste óptimo).
2. **Cálculos Consolidados en Vivo:** La pantalla muestra las sumatorias agregadas de:
   - **Tonnage Total:** Sumatoria de toneladas movilizadas.
   - **Facturación Consolidada:** Total de ingresos por flete.
   - **Costo de Combustible:** Sumatoria de egresos por ACPM.
   - **Costo de Ferry:** Gasto consolidado por cruces fluviales en ferry.
   - **Utilidad Bruta y Utilidad Neta de la Flota:** Cálculos de rentabilidad restando los costos operativos y las comisiones pagadas a conductores.

#### Exportación Certificada a Microsoft Excel:
El sistema cuenta con un botón **Exportar a Excel** que genera instantáneamente una planilla `.xlsx` estructurada profesionalmente.

> [!TIP]
> **Garantía Anti-Desfase (Timezone Fix):** 
> Todos los informes y archivos Excel exportados se formatean bajo la zona horaria **UTC**. Esto neutraliza el molesto "efecto día anterior" causado por los navegadores locales en husos horarios como el de Colombia (UTC-5), garantizando que las fechas en el Excel impreso correspondan exactamente al día calendado en el ticket de báscula física.

---

### 6. SEGURIDAD Y PRIVILEGIOS DE ROLES (RBAC)

El acceso a las funciones está condicionado por el rol del usuario asignado en la base de datos:

| Característica / Módulo | Rol: ADMINISTRADOR | Rol: OPERADOR (Despachador) |
| :--- | :---: | :---: |
| Registrar Viajes | Sí | Sí |
| Modificar Viajes | Sí | Sí |
| Eliminar Viajes (Soft Delete) | **Sí** | No (Restringido) |
| Registrar Conductores / Vehículos | Sí | Sí |
| Modificar / Eliminar Conductores | **Sí** | No (Restringido) |
| Modificar / Eliminar Vehículos | **Sí** | No (Restringido) |
| Configuración de Tarifas | **Sí** | No (Visualización de lectura) |
| CRUD de Usuarios y Cuentas | **Sí** | No (Oculto de barra de navegación) |
| Generación de Reportes Financieros | **Sí** | No (Oculto de barra de navegación) |
| Bitácora de Auditoría Forense | **Sí** | No (Oculto de barra de navegación) |
| Columnas de "Acciones" en Tablas (Vehículos/Conductores) | Completas (Editar/Eliminar) | Ocultas (Visualización limpia) |
