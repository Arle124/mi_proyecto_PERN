import { z } from 'zod';

export const tripSchema = z.object({
  ticket: z.string().min(1, 'El ticket es obligatorio').max(50),
  fecha: z.preprocess((arg) => {
    if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
  }, z.date({ invalid_type_error: "Fecha inválida" })),
  origen: z.string().min(1, 'El origen es obligatorio').max(150),
  tipoViaje: z.enum(['NORMAL', 'ESPECIAL']),
  tipoPago: z.enum(['EFECTIVO', 'TRANSFERENCIA', 'CREDITO']).optional().default('EFECTIVO'),
  tonelaje: z.number().positive('El tonelaje debe ser positivo'),
  consumoAcpm: z.number().nonnegative().optional().nullable(),
  usoFerry: z.boolean().optional().default(false),
  driverId: z.string().uuid('ID de conductor inválido'),
  vehicleId: z.string().uuid('ID de vehículo inválido'),
});

export const updateTripSchema = tripSchema.partial();
