import { z } from 'zod';

export const driverSchema = z.object({
  cedula: z.string().min(1, 'La cédula es obligatoria').max(20),
  primerNombre: z.string().min(1, 'El primer nombre es obligatorio').max(60),
  segundoNombre: z.string().max(60).optional().nullable(),
  primerApellido: z.string().min(1, 'El primer apellido es obligatorio').max(60),
  segundoApellido: z.string().max(60).optional().nullable(),
  telefono: z.string().max(20).optional().nullable(),
});

export const updateDriverSchema = driverSchema.partial();
