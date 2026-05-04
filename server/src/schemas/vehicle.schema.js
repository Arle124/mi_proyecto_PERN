import { z } from 'zod';

export const vehicleSchema = z.object({
  placa: z.string().regex(/^[A-Z]{3}[0-9]{3}$/, 'La placa debe tener formato AAA000 (3 letras y 3 números)'),
  marca: z.string().min(1, 'La marca es obligatoria').max(50),
  modelo: z.string().min(1, 'El modelo es obligatorio').max(100),
  capacidad: z.number().positive('La capacidad debe ser un número positivo (toneladas)'),
  estado: z.enum(['DISPONIBLE', 'EN_VIAJE', 'MANTENIMIENTO']).optional().default('DISPONIBLE'),
});

export const updateVehicleSchema = vehicleSchema.partial();
