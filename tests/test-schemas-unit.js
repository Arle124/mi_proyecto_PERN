import assert from 'node:assert';
import { driverSchema } from '../server/src/schemas/driver.schema.js';
import { vehicleSchema } from '../server/src/schemas/vehicle.schema.js';
import { createUserSchema } from '../server/src/schemas/user.schema.js';

/**
 * 🧪 PRUEBAS UNITARIAS DE VALIDACIÓN DE ESQUEMAS (NODE:ASSERT + ZOD)
 * =================================================================
 * Este script ejecuta una suite de pruebas unitarias sobre los esquemas de
 * validación del backend utilizando el módulo nativo de aserciones de Node.js.
 * Garantiza de manera atómica que los esquemas Zod actúen como un cortafuegos
 * impenetrable, rechazando payloads maliciosos y aceptando estructuras de datos válidas.
 */

const testSuite = {
  // ---------------------------------------------------------------------------
  // 1. PRUEBAS DE CONDUCTORES (DRIVER SCHEMA)
  // ---------------------------------------------------------------------------
  testDriverSchema() {
    console.log("👨‍✈️ Probando driverSchema...");

    // Caso 1: Conductor Válido
    const validDriver = {
      cedula: "1098765432",
      primerNombre: "Juan",
      segundoNombre: "Carlos",
      primerApellido: "Pérez",
      segundoApellido: "Rodríguez",
      telefono: "3105551234"
    };
    const parsed = driverSchema.safeParse(validDriver);
    assert.strictEqual(parsed.success, true, "Debería aceptar un conductor con datos correctos");

    // Caso 2: Cédula con caracteres especiales ("1+1")
    const invalidCedula = { ...validDriver, cedula: "1+1" };
    const parsedCedula = driverSchema.safeParse(invalidCedula);
    assert.strictEqual(parsedCedula.success, false, "Debería rechazar cédulas con caracteres especiales ('1+1')");
    assert.ok(
      parsedCedula.error.issues.some(e => e.message.includes("números") || e.message.includes("dígitos")),
      "Debería lanzar un error de tipo numérico o longitud para cédula '1+1'"
    );

    // Caso 3: Cédula muy corta (menos de 6 caracteres)
    const shortCedula = { ...validDriver, cedula: "12345" };
    const parsedShortCedula = driverSchema.safeParse(shortCedula);
    assert.strictEqual(parsedShortCedula.success, false, "Debería rechazar cédulas de menos de 6 dígitos");

    // Caso 4: Teléfono con letras
    const invalidPhone = { ...validDriver, telefono: "123-ABC" };
    const parsedPhone = driverSchema.safeParse(invalidPhone);
    assert.strictEqual(parsedPhone.success, false, "Debería rechazar teléfonos que contengan letras");

    // Caso 5: Nombres con números/símbolos
    const invalidName = { ...validDriver, primerNombre: "Juan123#" };
    const parsedName = driverSchema.safeParse(invalidName);
    assert.strictEqual(parsedName.success, false, "Debería rechazar nombres que contengan números o símbolos");

    // Caso 6: Nombres demasiado cortos (menos de 2 caracteres)
    const shortName = { ...validDriver, primerNombre: "J" };
    const parsedShortName = driverSchema.safeParse(shortName);
    assert.strictEqual(parsedShortName.success, false, "Debería rechazar nombres de menos de 2 caracteres");

    console.log("   ✅ driverSchema verificado exitosamente!");
  },

  // ---------------------------------------------------------------------------
  // 2. PRUEBAS DE VEHÍCULOS (VEHICLE SCHEMA)
  // ---------------------------------------------------------------------------
  testVehicleSchema() {
    console.log("🚚 Probando vehicleSchema...");

    // Caso 1: Vehículo Válido
    const validVehicle = {
      placa: "XYZ987",
      marca: "Kenworth",
      modelo: "T800",
      capacidad: 35.5,
      estado: "DISPONIBLE"
    };
    const parsed = vehicleSchema.safeParse(validVehicle);
    assert.strictEqual(parsed.success, true, "Debería aceptar un vehículo con formato de placa AAA000 y datos correctos");

    // Caso 2: Placa con formato inválido
    const invalidPlate = { ...validVehicle, placa: "abc-1234" };
    const parsedPlate = vehicleSchema.safeParse(invalidPlate);
    assert.strictEqual(parsedPlate.success, false, "Debería rechazar placas que no tengan formato AAA000");

    // Caso 3: Capacidad no numérica o negativa
    const invalidCapacity = { ...validVehicle, capacidad: -10 };
    const parsedCapacity = vehicleSchema.safeParse(invalidCapacity);
    assert.strictEqual(parsedCapacity.success, false, "Debería rechazar capacidades negativas");

    // Caso 4: Marca/Modelo con inyecciones de caracteres especiales
    const invalidMarca = { ...validVehicle, marca: "Kenworth#$%" };
    const parsedMarca = vehicleSchema.safeParse(invalidMarca);
    assert.strictEqual(parsedMarca.success, false, "Debería rechazar marcas con caracteres especiales de inyección");

    // Caso 5: Marca/Modelo muy cortos (menos de 2 caracteres)
    const shortMarca = { ...validVehicle, marca: "K" };
    const parsedShortMarca = vehicleSchema.safeParse(shortMarca);
    assert.strictEqual(parsedShortMarca.success, false, "Debería rechazar marcas de menos de 2 caracteres");

    console.log("   ✅ vehicleSchema verificado exitosamente!");
  },

  // ---------------------------------------------------------------------------
  // 3. PRUEBAS DE USUARIOS (USER SCHEMA)
  // ---------------------------------------------------------------------------
  testUserSchema() {
    console.log("👥 Probando createUserSchema...");

    // Caso 1: Usuario Válido
    const validUser = {
      primerNombre: "Andrés",
      primerApellido: "Gómez",
      correo: "andres.gomez@novapalma.com",
      password: "ClaveSegura2026!",
      rol: "OPERADOR"
    };
    const parsed = createUserSchema.safeParse(validUser);
    assert.strictEqual(parsed.success, true, "Debería aceptar un usuario con credenciales robustas y datos correctos");

    // Caso 2: Nombres con números/símbolos
    const invalidName = { ...validUser, primerNombre: "Andrés123#" };
    const parsedName = createUserSchema.safeParse(invalidName);
    assert.strictEqual(parsedName.success, false, "Debería rechazar nombres que contengan números o símbolos");

    // Caso 3: Correo electrónico inválido
    const invalidEmail = { ...validUser, correo: "correo-invalido@" };
    const parsedEmail = createUserSchema.safeParse(invalidEmail);
    assert.strictEqual(parsedEmail.success, false, "Debería rechazar correos con formato inválido");

    // Caso 4: Contraseña débil (menos de 8 caracteres)
    const weakPass = { ...validUser, password: "123" };
    const parsedPass = createUserSchema.safeParse(weakPass);
    assert.strictEqual(parsedPass.success, false, "Debería rechazar contraseñas débiles de menos de 8 caracteres");

    // Caso 5: Nombres demasiado cortos (menos de 2 caracteres)
    const shortName = { ...validUser, primerNombre: "A" };
    const parsedShortName = createUserSchema.safeParse(shortName);
    assert.strictEqual(parsedShortName.success, false, "Debería rechazar nombres de menos de 2 caracteres");

    console.log("   ✅ createUserSchema verificado exitosamente!");
  }
};

function runAllUnitTests() {
  console.log("==========================================================================");
  console.log("🧪   INICIANDO PRUEBAS UNITARIAS DE BACKEND (CORTAFUEGOS ZOD)             ");
  console.log("==========================================================================");
  
  try {
    testSuite.testDriverSchema();
    testSuite.testVehicleSchema();
    testSuite.testUserSchema();
    
    console.log("==========================================================================");
    console.log("🎉   ¡PRUEBAS UNITARIAS SUPERADAS CON ÉXITO!                              ");
    console.log("     Todos los esquemas de backend previenen mutaciones inválidas.       ");
    console.log("==========================================================================\n");
  } catch (error) {
    console.error("\n💥  ¡FALLO EN PRUEBA UNITARIA!");
    console.error(`    Mensaje: ${error.message}`);
    console.error(`    Operador: ${error.operator}`);
    console.error(`    Valor Esperado: ${error.expected}`);
    console.error(`    Valor Obtenido: ${error.actual}\n`);
    process.exit(1);
  }
}

runAllUnitTests();
