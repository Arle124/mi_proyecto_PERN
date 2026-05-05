# Novapalma 🌴 - Sistema de Gestión Logística y Financiera

![Node.js](https://img.shields.io/badge/Node.js-v25-green?style=flat-square&logo=node.js)
![React](https://img.shields.io/badge/React-Vite-blue?style=flat-square&logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-latest-blue?style=flat-square&logo=postgresql)
![Prisma](https://img.shields.io/badge/Prisma-v7.8.0-2D3748?style=flat-square&logo=prisma)

## 📋 Descripción
Novapalma es una plataforma integral de gestión logística y financiera diseñada para optimizar la cadena de suministro y el control operativo. Este proyecto de Ingeniería de Software implementa una arquitectura robusta basada en el stack **PERN** (PostgreSQL, Express, React, Node.js), priorizando la integridad de los datos y la trazabilidad forense.

## 🛠️ Stack Técnico
- **Backend:** Node.js v25 con Express.
- **Frontend:** React (Vite) para una interfaz ágil y moderna.
- **Base de Datos:** PostgreSQL.
- **ORM:** Prisma v7.8.0 optimizado con `@prisma/adapter-pg` para garantizar estabilidad total en entornos Linux y compatibilidad nativa con las últimas versiones de Node.
- **Validación:** Esquemas de Zod para garantizar la integridad de los datos en el nivel de entrada.

## 🔐 Seguridad y Autorización
El sistema implementa una arquitectura de seguridad multicapa:
- **Autenticación:** Gestión de sesiones mediante JSON Web Tokens (JWT).
- **RBAC (Role-Based Access Control):** Control de acceso basado en roles.
  - **Admin:** Acceso total, gestión de usuarios y configuración del sistema.
  - **Operador:** Gestión operativa de la flota y procesos logísticos.
- **Cifrado:** Hashing de contraseñas con `bcryptjs` (10 salt rounds).
- **Auditoría:** Registro inmutable de transacciones críticas (`audit_logs`) con snapshots de cambios.

## 🚀 Guía de Inicio

### Requisitos Previos
- Node.js v25 o superior.
- Instancia de PostgreSQL (Base de datos: `mi_proyecto_pern`).

### Configuración del Servidor
```bash
# Entrar al directorio del servidor
cd server

# Instalar dependencias
npm install

# Generar el cliente de Prisma
npx prisma generate

# Poblar la base de datos con datos iniciales (Admin predeterminado)
npm run seed
```

### Ejecución del Proyecto
Para iniciar el servidor con node.js:
```bash
node index.js
```

Para iniciar el cliente de React:
```bash
# En una nueva terminal
cd client
npm install
npm run dev
```

## 📖 Referencia Técnica
Para detalles profundos sobre la arquitectura MVC Potenciada, el diseño de la base de datos y los estándares de ingeniería aplicados, consulte la documentación principal:

👉 **[DOCUMENTATION.md](./DOCUMENTATION.md)**

---
*Desarrollado como proyecto de Ingeniería de Software - Novapalma Logística.*
