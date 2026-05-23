# Novapalma 🌴 - Sistema de Gestión Logística y Financiera

![Node.js](https://img.shields.io/badge/Node.js-v25-green?style=flat-square&logo=node.js)
![React](https://img.shields.io/badge/React-Vite-blue?style=flat-square&logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-latest-blue?style=flat-square&logo=postgresql)
![Prisma](https://img.shields.io/badge/Prisma-v7.8.0-2D3748?style=flat-square&logo=prisma)
![Docker](https://img.shields.io/badge/Docker-compose-blue?style=flat-square&logo=docker)
![Selenium](https://img.shields.io/badge/Selenium-E2E_Testing-red?style=flat-square&logo=selenium)

## Descripción
Novapalma es una plataforma integral de gestión logística y financiera diseñada para optimizar la cadena de suministro y el control operativo. Este proyecto de Ingeniería de Software implementa una arquitectura robusta basada en el stack **PERN** (PostgreSQL, Express, React, Node.js), priorizando la integridad de los datos y la trazabilidad forense.

## Stack Técnico
- **Backend:** Node.js v25 con Express.
- **Frontend:** React (Vite) para una interfaz ágil, moderna e interactiva.
- **Base de Datos:** PostgreSQL.
- **Contenedores:** Docker & Docker Compose para una orquestación y portabilidad completa.
- **Pruebas de Calidad:** Selenium WebDriver para pruebas de integración E2E automatizadas.
- **ORM:** Prisma v7.8.0 optimizado con `@prisma/adapter-pg` para garantizar estabilidad total en entornos Linux y compatibilidad nativa con las últimas versiones de Node.
- **Validación:** Esquemas de Zod para garantizar la integridad de los datos en el nivel de entrada.

## Características Principales
- **Gestión de Viajes:** Control total de tickets, pesos, orígenes y tipos de servicios con transacciones ACID.
- **Flota y Conductores:** Registro detallado de vehículos y personal operativo.
- **Gestión de Tarifas:** Módulo administrativo para el control de precios por tonelada (Normal/Especial).
- **Control de Usuarios:** Módulo de administración CRUD completo de usuarios con asignación de roles (ADMIN/OPERADOR) y estados de activación.
- **Reportes Financieros:** Visualización avanzada de datos agregados (tonelaje total, facturación total, consumo de ACPM y cruces de ferry) con filtros dinámicos por rango de fechas.
- **Seguridad Forense:** Auditoría completa e inmutable de todas las acciones críticas.

## Seguridad y Autorización
El sistema implementa una arquitectura de seguridad multicapa:
- **Autenticación:** Gestión de sesiones seguras mediante JSON Web Tokens (JWT) y cookies.
- **RBAC (Role-Based Access Control):** Control de acceso basado en roles.
-   **Admin:** Acceso total, gestión de usuarios, reportes financieros, auditoría forense y configuración de tarifas.
-   **Operador:** Gestión operativa de la flota, vehículos, conductores y registro de viajes.
- **Hardening:** Implementación de `helmet`, `express-rate-limit` y validación estricta de esquemas con `Zod`.
- **Cifrado:** Hashing de contraseñas con `bcryptjs`.
- **Auditoría:** Registro inmutable de transacciones críticas (`audit_logs`) con snapshots `before/after` del estado de los registros.

## Guía de Inicio

### Requisitos Previos
- Docker y Docker Compose (Recomendado).
- Node.js v25 o superior y PostgreSQL local (Alternativo).

---

### Opción 1: Ejecución con Docker Compose (Recomendado 🐳)

Esta opción levanta automáticamente la base de datos PostgreSQL, el servidor backend de Express y el cliente frontend de React en contenedores aislados.

> [!IMPORTANT]
> Si tienes una instancia local de PostgreSQL corriendo en tu sistema host en el puerto 5432, apágala temporalmente antes de levantar Docker para evitar conflictos de asignación de puertos:
> ```bash
> sudo systemctl stop postgresql
> ```

1. Inicia y construye el entorno con Docker Compose:
   ```bash
   docker compose up -d --build
   ```
2. El sistema estará disponible en los siguientes puertos:
   * **Frontend (React/Vite):** http://localhost:5173
   * **Backend (API Express):** http://localhost:3001
   * **Base de datos (PostgreSQL):** puerto `5432`

---

### Opción 2: Ejecución Local Tradicional

#### Configuración del Entorno
1. Configure el archivo `.env` en la carpeta `server/` basándose en `.env.example`.
2. Ejecute los siguientes comandos:

```bash
# Servidor
cd server
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed

# Cliente
cd ../client
npm install
```

#### Ejecución del Proyecto
Para iniciar el sistema completo:
```bash
# Terminal 1: Servidor
cd server
node index.js

# Terminal 2: Cliente
cd client
npm run dev
```


