import { ZodError } from 'zod';

export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        status: 'error',
        message: 'Validación de datos fallida',
        errors: (error.issues || []).map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    // Error no esperado (500)
    console.error('❌ Error inesperado en el middleware de validación:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error interno del servidor durante la validación',
    });
  }
};

