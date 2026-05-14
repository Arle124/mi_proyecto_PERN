import { z } from 'zod';

export const rateTariffSchema = z.object({
  tipoViaje: z.enum(['NORMAL', 'ESPECIAL']),
  valorTon: z.number().positive('El valor por tonelada debe ser un número positivo'),
  activo: z.boolean().optional().default(true),
});

export const updateRateTariffSchema = rateTariffSchema.partial();
