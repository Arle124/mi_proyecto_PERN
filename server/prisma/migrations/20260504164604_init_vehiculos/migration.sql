/*
  Warnings:

  - Added the required column `capacidad` to the `vehicles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `marca` to the `vehicles` table without a default value. This is not possible if the table is not empty.
  - Made the column `modelo` on table `vehicles` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('DISPONIBLE', 'EN_VIAJE', 'MANTENIMIENTO');

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "capacidad" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "estado" "VehicleStatus" NOT NULL DEFAULT 'DISPONIBLE',
ADD COLUMN     "marca" VARCHAR(50) NOT NULL,
ALTER COLUMN "modelo" SET NOT NULL;
