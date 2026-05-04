-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'OPERADOR');

-- CreateEnum
CREATE TYPE "TripType" AS ENUM ('NORMAL', 'ESPECIAL');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'CREDITO');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "primerNombre" VARCHAR(60) NOT NULL,
    "segundoNombre" VARCHAR(60),
    "primerApellido" VARCHAR(60) NOT NULL,
    "segundoApellido" VARCHAR(60),
    "correo" VARCHAR(200) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "rol" "Role" NOT NULL DEFAULT 'OPERADOR',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drivers" (
    "id" UUID NOT NULL,
    "cedula" VARCHAR(20) NOT NULL,
    "primerNombre" VARCHAR(60) NOT NULL,
    "segundoNombre" VARCHAR(60),
    "primerApellido" VARCHAR(60) NOT NULL,
    "segundoApellido" VARCHAR(60),
    "telefono" VARCHAR(20),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" UUID NOT NULL,
    "placa" VARCHAR(8) NOT NULL,
    "modelo" VARCHAR(100),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_tariffs" (
    "id" SERIAL NOT NULL,
    "tipoViaje" "TripType" NOT NULL,
    "valorTon" DECIMAL(12,2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "rate_tariffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips" (
    "id" UUID NOT NULL,
    "ticket" VARCHAR(50) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "origen" VARCHAR(150) NOT NULL,
    "tipoViaje" "TripType" NOT NULL,
    "tipoPago" "PaymentType" NOT NULL DEFAULT 'EFECTIVO',
    "tonelaje" DECIMAL(10,3) NOT NULL,
    "valorPago" DECIMAL(12,2) NOT NULL,
    "consumoAcpm" DECIMAL(8,3),
    "usoFerry" BOOLEAN NOT NULL DEFAULT false,
    "driverId" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "registradoPorId" UUID NOT NULL,
    "actualizadoPorId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "action" "AuditAction" NOT NULL,
    "entity" VARCHAR(50) NOT NULL,
    "entityId" VARCHAR(100),
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" VARCHAR(45),
    "userAgent" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "token" VARCHAR(512) NOT NULL,
    "userId" UUID NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_correo_key" ON "users"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_cedula_key" ON "drivers"("cedula");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_placa_key" ON "vehicles"("placa");

-- CreateIndex
CREATE UNIQUE INDEX "rate_tariffs_tipoViaje_key" ON "rate_tariffs"("tipoViaje");

-- CreateIndex
CREATE UNIQUE INDEX "trips_ticket_key" ON "trips"("ticket");

-- CreateIndex
CREATE INDEX "trips_fecha_idx" ON "trips"("fecha");

-- CreateIndex
CREATE INDEX "trips_deletedAt_idx" ON "trips"("deletedAt");

-- CreateIndex
CREATE INDEX "trips_driverId_fecha_idx" ON "trips"("driverId", "fecha");

-- CreateIndex
CREATE INDEX "trips_vehicleId_fecha_idx" ON "trips"("vehicleId", "fecha");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entityId_idx" ON "audit_logs"("entity", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_actualizadoPorId_fkey" FOREIGN KEY ("actualizadoPorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
