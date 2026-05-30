import { z } from 'zod';

export const createUserSchema = z.object({
  primerNombre: z.string().min(1, 'El primer nombre es obligatorio').max(60),
  segundoNombre: z.string().max(60).optional().nullable(),
  primerApellido: z.string().min(1, 'El primer apellido es obligatorio').max(60),
  segundoApellido: z.string().max(60).optional().nullable(),
  correo: z.string().email('Debe ser un correo electrónico válido').max(200),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[0-9]/, 'La contraseña debe contener al menos un número')
    .regex(/[^A-Za-z0-9]/, 'La contraseña debe contener al menos un carácter especial (ej. !@#$%^&*)')
    .max(255),
  rol: z.enum(['ADMIN', 'OPERADOR']).optional(),
});

export const updateUserSchema = createUserSchema.partial().extend({
  activo: z.boolean().optional(),
});

export const validateUser = (data) => {
  return createUserSchema.safeParse(data);
};
