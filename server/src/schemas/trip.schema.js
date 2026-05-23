import { z } from 'zod';

export const tripSchema = z.object({
  ticket: z.preprocess((val) => parseInt(val, 10), z.number().int().positive('El ticket debe ser un número entero positivo')),
  fecha: z.preprocess((arg) => {
    if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
  }, z.date({ invalid_type_error: "Fecha inválida" })),
  origen: z.string().min(1, 'El origen es obligatorio').max(150),
  producto: z.enum(['FRUTO', 'COMPOST']),
  tipoPago: z.enum(['TRANSFERENCIA']).optional().default('TRANSFERENCIA'),
  tonelaje: z.number().positive('El tonelaje debe ser positivo'),
  valorPago: z.number().positive('El valor del pago debe ser positivo').optional().nullable(),
  consumoAcpm: z.number().nonnegative().optional().nullable(),
  usoFerry: z.boolean().optional().default(false),
  driverId: z.string().uuid('ID de conductor inválido'),
  vehicleId: z.string().uuid('ID de vehículo inválido'),
});

export const updateTripSchema = tripSchema.partial();
