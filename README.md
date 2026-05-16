# Novapalma 🌴 - Sistema de Gestión Logística y Financiera

![Node.js](https://img.shields.io/badge/Node.js-v25-green?style=flat-square&logo=node.js)
![React](https://img.shields.io/badge/React-Vite-blue?style=flat-square&logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-latest-blue?style=flat-square&logo=postgresql)
![Prisma](https://img.shields.io/badge/Prisma-v7.8.0-2D3748?style=flat-square&logo=prisma)

## Descripción
Novapalma es una plataforma integral de gestión logística y financiera diseñada para optimizar la cadena de suministro y el control operativo. Este proyecto de Ingeniería de Software implementa una arquitectura robusta basada en el stack **PERN** (PostgreSQL, Express, React, Node.js), priorizando la integridad de los datos y la trazabilidad forense.

## Stack Técnico
- **Backend:** Node.js v25 con Express.
- **Frontend:** React (Vite) para una interfaz ágil y moderna.
- **Base de Datos:** PostgreSQL.
- **ORM:** Prisma v7.8.0 optimizado con `@prisma/adapter-pg` para garantizar estabilidad total en entornos Linux y compatibilidad nativa con las últimas versiones de Node.
- **Validación:** Esquemas de Zod para garantizar la integridad de los datos en el nivel de entrada.

## Características Principales
- **Gestión de Viajes:** Control total de tickets, pesos, orígenes y tipos de servicios con transacciones ACID.
- **Flota y Conductores:** Registro detallado de vehículos y personal operativo.
- **Gestión de Tarifas:** Módulo administrativo para el control de precios por tonelada (Normal/Especial).
- **Seguridad Forense:** Auditoría completa de todas las acciones críticas.

## Seguridad y Autorización
El sistema implementa una arquitectura de seguridad multicapa:
- **Autenticación:** Gestión de sesiones seguras mediante JSON Web Tokens (JWT) y cookies.
- **RBAC (Role-Based Access Control):** Control de acceso basado en roles.
  - **Admin:** Acceso total, gestión de usuarios, auditoría y configuración de tarifas.
  - **Operador:** Gestión operativa de la flota y registro de viajes.
- **Hardening:** Implementación de `helmet`, `express-rate-limit` y validación estricta de esquemas con `Zod`.
- **Cifrado:** Hashing de contraseñas con `bcryptjs`.
- **Auditoría:** Registro inmutable de transacciones críticas (`audit_logs`) con snapshots `before/after`.

## Guía de Inicio

### Requisitos Previos
- Node.js v25 o superior.
- Instancia de PostgreSQL.

### Configuración del Entorno
1. Configure el archivo `.env` en la carpeta `server/` basándose en `.env.example`.
2. Ejecute los siguientes comandos:

```bash
# Servidor
cd server
npm install
npx prisma generate
npx prisma migrate dev --name init # Si es la primera vez
npm run seed

# Cliente
cd ../client
npm install
```

### Ejecución del Proyecto
Para iniciar el sistema completo:
```bash
# Terminal 1: Servidor
cd server
node index.js

# Terminal 2: Cliente
cd client
npm run dev
```

## 📖 Referencia Técnica
Para detalles profundos sobre la arquitectura MVC Potenciada, el diseño de la base de datos y los estándares de ingeniería aplicados, consulte la documentación principal:

👉 **[DOCUMENTATION.md](./DOCUMENTATION.md)**

---
*Desarrollado como proyecto de Ingeniería de Software - Novapalma Logística.*
