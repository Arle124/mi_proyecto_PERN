import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

/**
 * 🌴 AUDITORÍA INTEGRAL DE SEGURIDAD E INTEGRIDAD DE DATOS (SELENIUM E2E)
 * =====================================================================
 * Este script realiza una auditoría de seguridad automatizada de alto nivel
 * sobre los formularios críticos de todo el sistema (Conductores, Vehículos y Usuarios).
 * Evalúa si las entradas están debidamente sanitizadas en el Frontend o si el
 * Backend implementa validaciones estrictas, bloqueando datos maliciosos o erróneos.
 */

const BASE_URL = 'http://localhost:5173';
const LOGIN_URL = `${BASE_URL}/login`;
const ADMIN_EMAIL = 'admin@novapalma.com';
const ADMIN_PASSWORDS = ['AdminNovapalma2026!', 'admin123'];

async function runHighLevelAudit() {
  console.log("==========================================================================");
  console.log("🛡️   INICIANDO AUDITORÍA INTEGRAL DE SEGURIDAD Y SANITIZACIÓN E2E        ");
  console.log("==========================================================================");

  const options = new chrome.Options();
  options.addArguments('--headless'); // Headless para rapidez y consistencia en la ejecución
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  const auditReport = [];

  try {
    // -------------------------------------------------------------------------
    // AUTENTICACIÓN
    // -------------------------------------------------------------------------
    console.log(`🌐 Conectando a la aplicación en ${LOGIN_URL}...`);
    await driver.get(LOGIN_URL);
    await driver.wait(until.elementLocated(By.css('input[type="email"]')), 5000);

    let loginSuccess = false;
    for (const password of ADMIN_PASSWORDS) {
      console.log(`🔑 Intentando inicio de sesión con: "${password}"...`);
      const emailInput = await driver.findElement(By.css('input[type="email"]'));
      const passwordInput = await driver.findElement(By.css('input[type="password"]'));
      
      await emailInput.clear();
      await passwordInput.clear();
      await emailInput.sendKeys(ADMIN_EMAIL);
      await passwordInput.sendKeys(password);
      await (await driver.findElement(By.css('button[type="submit"]'))).click();

      try {
        await driver.wait(async () => {
          const currentUrl = await driver.getCurrentUrl();
          if (!currentUrl.includes('/login')) return true;
          
          const errorAlerts = await driver.findElements(By.css('.alert-danger'));
          if (errorAlerts.length > 0) {
            throw new Error(await errorAlerts[0].getText());
          }
          return false;
        }, 8000);

        const currentUrl = await driver.getCurrentUrl();
        if (!currentUrl.includes('/login')) {
          console.log("🔓 ¡Sesión iniciada con éxito en el panel administrativo!");
          loginSuccess = true;
          break;
        }
      } catch (err) {
        console.log(`⚠️ Fallo: ${err.message}`);
      }
    }

    if (!loginSuccess) {
      throw new Error("No se pudo iniciar sesión. Asegúrate de tener el Backend y Frontend corriendo y con datos base de seed.");
    }

    // =========================================================================
    // MÓDULO 1: CONDUCTORES (DRIVERS)
    // =========================================================================
    console.log("\n📁 [MÓDULO 1] Auditando Módulo de Conductores...");
    await driver.get(`${BASE_URL}/conductores`);
    await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Nuevo Conductor')]")), 5000);

    // --- Prueba 1.1: Cédula (Caso "1+1") ---
    console.log("🧪 Prueba 1.1: Verificando campo 'Cédula' contra caracteres especiales ('1+1')...");
    await (await driver.findElement(By.xpath("//button[contains(., 'Nuevo Conductor')]"))).click();
    await driver.wait(until.elementLocated(By.css('input[name="cedula"]')), 3000);

    let cedulaInput = await driver.findElement(By.css('input[name="cedula"]'));
    await cedulaInput.sendKeys("1+1");
    let val = await cedulaInput.getAttribute("value");

    if (val !== "1+1") {
      console.log(`   ✅ PROTEGIDO en Frontend: Filtrado de "${val}" en vivo.`);
      auditReport.push({
        modulo: "Conductores",
        campo: "Cédula",
        prueba: 'Ingresar "1+1"',
        resultado: "✅ PROTEGIDO (Sanitizado en Frontend)"
      });
      await (await driver.findElement(By.css('button.btn-close'))).click();
    } else {
      console.log("   ⚠️ Frontend permisivo. Evaluando respuesta del Backend...");
      await (await driver.findElement(By.css('input[name="telefono"]'))).sendKeys("3001234567");
      await (await driver.findElement(By.css('input[name="primerNombre"]'))).sendKeys("Auditor");
      await (await driver.findElement(By.css('input[name="primerApellido"]'))).sendKeys("Conductores");
      await (await driver.findElement(By.xpath("//button[contains(., 'Guardar Conductor')]"))).click();
      await driver.sleep(1500);

      const isModalOpen = await driver.findElements(By.css('.modal.d-block')).then(el => el.length > 0);
      if (isModalOpen) {
        const errorMsg = await (await driver.findElement(By.css('.alert-danger'))).getText();
        console.log(`   ✅ PROTEGIDO en Backend: Rechazado con el error: "${errorMsg}"`);
        auditReport.push({
          modulo: "Conductores",
          campo: "Cédula",
          prueba: 'Ingresar "1+1"',
          resultado: `✅ PROTEGIDO (Rechazado por Backend: "${errorMsg}")`
        });
        await (await driver.findElement(By.css('button.btn-close'))).click();
      } else {
        console.log("   ❌ VULNERABLE: Registro guardado en base de datos sin sanitizar.");
        auditReport.push({
          modulo: "Conductores",
          campo: "Cédula",
          prueba: 'Ingresar "1+1"',
          resultado: "❌ VULNERABLE (Permite caracteres especiales)"
        });
        await cleanUpRecord(driver, "1+1", "conductores", "Desactivar Conductor");
      }
    }

    // --- Prueba 1.2: Teléfono ---
    console.log("🧪 Prueba 1.2: Verificando campo 'Teléfono' contra caracteres no numéricos...");
    await (await driver.findElement(By.xpath("//button[contains(., 'Nuevo Conductor')]"))).click();
    await driver.wait(until.elementLocated(By.css('input[name="cedula"]')), 3000);

    let telInput = await driver.findElement(By.css('input[name="telefono"]'));
    await telInput.sendKeys("123-ABC-!");
    val = await telInput.getAttribute("value");

    if (val !== "123-ABC-!") {
      console.log(`   ✅ PROTEGIDO en Frontend: Filtrado de "${val}" en vivo.`);
      auditReport.push({
        modulo: "Conductores",
        campo: "Teléfono",
        prueba: 'Ingresar "123-ABC-!"',
        resultado: "✅ PROTEGIDO (Sanitizado en Frontend)"
      });
      await (await driver.findElement(By.css('button.btn-close'))).click();
    } else {
      console.log("   ⚠️ Frontend permisivo. Evaluando respuesta del Backend...");
      const uniqueCedula = "999" + Math.floor(Math.random() * 1000000);
      await (await driver.findElement(By.css('input[name="cedula"]'))).sendKeys(uniqueCedula);
      await (await driver.findElement(By.css('input[name="primerNombre"]'))).sendKeys("Auditor");
      await (await driver.findElement(By.css('input[name="primerApellido"]'))).sendKeys("Conductores");
      await (await driver.findElement(By.xpath("//button[contains(., 'Guardar Conductor')]"))).click();
      await driver.sleep(1500);

      const isModalOpen = await driver.findElements(By.css('.modal.d-block')).then(el => el.length > 0);
      if (isModalOpen) {
        const errorMsg = await (await driver.findElement(By.css('.alert-danger'))).getText();
        console.log(`   ✅ PROTEGIDO en Backend: Rechazado con el error: "${errorMsg}"`);
        auditReport.push({
          modulo: "Conductores",
          campo: "Teléfono",
          prueba: 'Ingresar "123-ABC-!"',
          resultado: `✅ PROTEGIDO (Rechazado por Backend: "${errorMsg}")`
        });
        await (await driver.findElement(By.css('button.btn-close'))).click();
      } else {
        console.log("   ❌ VULNERABLE: Registro guardado en base de datos sin sanitizar.");
        auditReport.push({
          modulo: "Conductores",
          campo: "Teléfono",
          prueba: 'Ingresar "123-ABC-!"',
          resultado: "❌ VULNERABLE (Permite texto en teléfono)"
        });
        await cleanUpRecord(driver, uniqueCedula, "conductores", "Desactivar Conductor");
      }
    }

    // --- Prueba 1.3: Nombres ---
    console.log("🧪 Prueba 1.3: Verificando campo 'Primer Nombre' contra números y símbolos...");
    await (await driver.findElement(By.xpath("//button[contains(., 'Nuevo Conductor')]"))).click();
    await driver.wait(until.elementLocated(By.css('input[name="cedula"]')), 3000);

    let nombreInput = await driver.findElement(By.css('input[name="primerNombre"]'));
    await nombreInput.sendKeys("Carlos123#");
    val = await nombreInput.getAttribute("value");

    if (val !== "Carlos123#") {
      console.log(`   ✅ PROTEGIDO en Frontend: Filtrado de "${val}" en vivo.`);
      auditReport.push({
        modulo: "Conductores",
        campo: "Primer Nombre",
        prueba: 'Ingresar "Carlos123#"',
        resultado: "✅ PROTEGIDO (Sanitizado en Frontend)"
      });
      await (await driver.findElement(By.css('button.btn-close'))).click();
    } else {
      console.log("   ⚠️ Frontend permisivo. Evaluando respuesta del Backend...");
      const uniqueCedula = "888" + Math.floor(Math.random() * 1000000);
      await (await driver.findElement(By.css('input[name="cedula"]'))).sendKeys(uniqueCedula);
      await (await driver.findElement(By.css('input[name="primerApellido"]'))).sendKeys("Conductores");
      await (await driver.findElement(By.xpath("//button[contains(., 'Guardar Conductor')]"))).click();
      await driver.sleep(1500);

      const isModalOpen = await driver.findElements(By.css('.modal.d-block')).then(el => el.length > 0);
      if (isModalOpen) {
        const errorMsg = await (await driver.findElement(By.css('.alert-danger'))).getText();
        console.log(`   ✅ PROTEGIDO en Backend: Rechazado con el error: "${errorMsg}"`);
        auditReport.push({
          modulo: "Conductores",
          campo: "Primer Nombre",
          prueba: 'Ingresar "Carlos123#"',
          resultado: `✅ PROTEGIDO (Rechazado por Backend: "${errorMsg}")`
        });
        await (await driver.findElement(By.css('button.btn-close'))).click();
      } else {
        console.log("   ❌ VULNERABLE: Registro guardado en base de datos sin sanitizar.");
        auditReport.push({
          modulo: "Conductores",
          campo: "Primer Nombre",
          prueba: 'Ingresar "Carlos123#"',
          resultado: "❌ VULNERABLE (Permite números en nombres)"
        });
        await cleanUpRecord(driver, uniqueCedula, "conductores", "Desactivar Conductor");
      }
    }

    // =========================================================================
    // MÓDULO 2: VEHÍCULOS (VEHICLES)
    // =========================================================================
    console.log("\n📁 [MÓDULO 2] Auditando Módulo de Vehículos...");
    await driver.get(`${BASE_URL}/vehiculos`);
    await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Nuevo Vehículo')]")), 5000);

    // --- Prueba 2.1: Placa (Formato y mayúsculas) ---
    console.log("🧪 Prueba 2.1: Verificando campo 'Placa' contra formato inválido y minúsculas...");
    await (await driver.findElement(By.xpath("//button[contains(., 'Nuevo Vehículo')]"))).click();
    await driver.wait(until.elementLocated(By.css('input[name="placa"]')), 3000);

    let placaInput = await driver.findElement(By.css('input[name="placa"]'));
    await placaInput.sendKeys("abc-1234");
    val = await placaInput.getAttribute("value");

    if (val !== "abc-1234") {
      console.log(`   ✅ PROTEGIDO en Frontend: Formateado a "${val}" en vivo.`);
      auditReport.push({
        modulo: "Vehículos",
        campo: "Placa",
        prueba: 'Ingresar "abc-1234"',
        resultado: `✅ PROTEGIDO (Sanitizado en Frontend a: "${val}")`
      });
      await (await driver.findElement(By.css('button.btn-close'))).click();
    } else {
      console.log("   ⚠️ Frontend permisivo. Evaluando respuesta del Backend...");
      await (await driver.findElement(By.css('input[name="marca"]'))).sendKeys("Volvo");
      await (await driver.findElement(By.css('input[name="modelo"]'))).sendKeys("FMX");
      await (await driver.findElement(By.css('input[name="capacidad"]'))).sendKeys("20");
      await (await driver.findElement(By.xpath("//button[contains(., 'Guardar Vehículo')]"))).click();
      await driver.sleep(1500);

      const isModalOpen = await driver.findElements(By.css('.modal.d-block')).then(el => el.length > 0);
      if (isModalOpen) {
        const errorMsg = await (await driver.findElement(By.css('.alert-danger'))).getText();
        console.log(`   ✅ PROTEGIDO en Backend: Rechazado con el error: "${errorMsg}"`);
        auditReport.push({
          modulo: "Vehículos",
          campo: "Placa",
          prueba: 'Ingresar "abc-1234"',
          resultado: `✅ PROTEGIDO (Rechazado por Backend: "${errorMsg}")`
        });
        await (await driver.findElement(By.css('button.btn-close'))).click();
      } else {
        console.log("   ❌ VULNERABLE: Registro de placa inválida aceptado.");
        auditReport.push({
          modulo: "Vehículos",
          campo: "Placa",
          prueba: 'Ingresar "abc-1234"',
          resultado: "❌ VULNERABLE (Permite formato inválido)"
        });
        await cleanUpRecord(driver, "abc-1234", "vehiculos", "Editar Vehículo"); // En vehículos la placa es visible
      }
    }

    // --- Prueba 2.2: Capacidad (Valores no numéricos) ---
    console.log("🧪 Prueba 2.2: Verificando campo 'Capacidad' contra caracteres alfabéticos...");
    await (await driver.findElement(By.xpath("//button[contains(., 'Nuevo Vehículo')]"))).click();
    await driver.wait(until.elementLocated(By.css('input[name="placa"]')), 3000);

    let capInput = await driver.findElement(By.css('input[name="capacidad"]'));
    await capInput.sendKeys("abc");
    val = await capInput.getAttribute("value");

    if (val !== "abc") {
      console.log(`   ✅ PROTEGIDO en Frontend: Filtrado de "${val}" en vivo.`);
      auditReport.push({
        modulo: "Vehículos",
        campo: "Capacidad",
        prueba: 'Ingresar "abc"',
        resultado: "✅ PROTEGIDO (Sanitizado en Frontend)"
      });
      await (await driver.findElement(By.css('button.btn-close'))).click();
    } else {
      console.log("   ⚠️ Frontend permisivo. Evaluando respuesta del Backend...");
      const randomPlaca = "XYZ" + Math.floor(Math.random() * 900 + 100);
      await (await driver.findElement(By.css('input[name="placa"]'))).sendKeys(randomPlaca);
      await (await driver.findElement(By.css('input[name="marca"]'))).sendKeys("Volvo");
      await (await driver.findElement(By.css('input[name="modelo"]'))).sendKeys("FMX");
      await (await driver.findElement(By.xpath("//button[contains(., 'Guardar Vehículo')]"))).click();
      await driver.sleep(1500);

      const isModalOpen = await driver.findElements(By.css('.modal.d-block')).then(el => el.length > 0);
      if (isModalOpen) {
        const errorMsg = await (await driver.findElement(By.css('.alert-danger'))).getText();
        console.log(`   ✅ PROTEGIDO en Backend: Rechazado con el error: "${errorMsg}"`);
        auditReport.push({
          modulo: "Vehículos",
          campo: "Capacidad",
          prueba: 'Ingresar "abc"',
          resultado: `✅ PROTEGIDO (Rechazado por Backend: "${errorMsg}")`
        });
        await (await driver.findElement(By.css('button.btn-close'))).click();
      } else {
        console.log("   ❌ VULNERABLE: Capacidad inválida guardada.");
        auditReport.push({
          modulo: "Vehículos",
          campo: "Capacidad",
          prueba: 'Ingresar "abc"',
          resultado: "❌ VULNERABLE (Permite texto)"
        });
        await cleanUpRecord(driver, randomPlaca, "vehiculos", "Editar Vehículo");
      }
    }

    // =========================================================================
    // MÓDULO 3: USUARIOS (USERS)
    // =========================================================================
    console.log("\n📁 [MÓDULO 3] Auditando Módulo de Usuarios...");
    await driver.get(`${BASE_URL}/usuarios`);
    await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Registrar Usuario')]")), 5000);

    // --- Prueba 3.1: Nombres ---
    console.log("🧪 Prueba 3.1: Verificando campo 'Primer Nombre' contra números y símbolos...");
    await (await driver.findElement(By.xpath("//button[contains(., 'Registrar Usuario')]"))).click();
    await driver.wait(until.elementLocated(By.css('input[name="primerNombre"]')), 3000);

    let userNombreInput = await driver.findElement(By.css('input[name="primerNombre"]'));
    await userNombreInput.sendKeys("Admin123!");
    val = await userNombreInput.getAttribute("value");

    if (val !== "Admin123!") {
      console.log(`   ✅ PROTEGIDO en Frontend: Filtrado de "${val}" en vivo.`);
      auditReport.push({
        modulo: "Usuarios",
        campo: "Primer Nombre",
        prueba: 'Ingresar "Admin123!"',
        resultado: "✅ PROTEGIDO (Sanitizado en Frontend)"
      });
      await (await driver.findElement(By.css('button.btn-close'))).click();
    } else {
      console.log("   ⚠️ Frontend permisivo. Evaluando respuesta del Backend...");
      const randomEmail = `test_${Math.floor(Math.random() * 100000)}@novapalma.com`;
      await (await driver.findElement(By.css('input[name="primerApellido"]'))).sendKeys("Auditor");
      await (await driver.findElement(By.css('input[name="correo"]'))).sendKeys(randomEmail);
      await (await driver.findElement(By.css('input[name="password"]'))).sendKeys("Secret2026!");
      await (await driver.findElement(By.xpath("//button[contains(., 'Guardar Usuario')]"))).click();
      await driver.sleep(1500);

      const isModalOpen = await driver.findElements(By.css('.modal.d-block')).then(el => el.length > 0);
      if (isModalOpen) {
        const errorMsg = await (await driver.findElement(By.css('.alert-danger'))).getText();
        console.log(`   ✅ PROTEGIDO en Backend: Rechazado con el error: "${errorMsg}"`);
        auditReport.push({
          modulo: "Usuarios",
          campo: "Primer Nombre",
          prueba: 'Ingresar "Admin123!"',
          resultado: `✅ PROTEGIDO (Rechazado por Backend: "${errorMsg}")`
        });
        await (await driver.findElement(By.css('button.btn-close'))).click();
      } else {
        console.log("   ❌ VULNERABLE: Registro de usuario inválido aceptado.");
        auditReport.push({
          modulo: "Usuarios",
          campo: "Primer Nombre",
          prueba: 'Ingresar "Admin123!"',
          resultado: "❌ VULNERABLE (Permite números en nombres)"
        });
        // Para limpiar el usuario, dado que la UI de usuarios usa toggle logic (UserX / UserCheck), simplemente lo dejamos inactivo
        await toggleUserStatus(driver, randomEmail);
      }
    }

    // -------------------------------------------------------------------------
    // REPORTE CONSOLIDADO
    // -------------------------------------------------------------------------
    printAuditReport(auditReport);

  } catch (error) {
    console.error("\n💥 Error crítico durante la ejecución de la auditoría:", error.message);
  } finally {
    console.log("\n🔌 Cerrando navegador...");
    await driver.quit();
  }
}

/**
 * Limpieza genérica de registros E2E creados
 */
async function cleanUpRecord(driver, uniqueId, modulo, actionTitle) {
  try {
    console.log(`🧹 [LIMPIEZA] Eliminando registro de prueba "${uniqueId}" en ${modulo}...`);
    await driver.navigate().refresh();
    await driver.sleep(2500);

    const rowXpath = `//tr[td[contains(., '${uniqueId}')]]`;
    const deleteBtn = await driver.findElement(By.xpath(`${rowXpath}//button[@title='${actionTitle}']`));
    await deleteBtn.click();

    await driver.wait(until.alertIsPresent(), 2000);
    const alert = await driver.switchTo().alert();
    await alert.accept();

    console.log(`   ✅ Registro "${uniqueId}" removido exitosamente.`);
    await driver.sleep(1000);
  } catch (err) {
    console.log(`   ⚠️ Error en limpieza: ${err.message}`);
  }
}

/**
 * Desactiva un usuario de prueba en la tabla de usuarios
 */
async function toggleUserStatus(driver, email) {
  try {
    console.log(`🧹 [LIMPIEZA] Desactivando usuario de prueba: ${email}...`);
    await driver.navigate().refresh();
    await driver.sleep(2000);

    const rowXpath = `//tr[td[contains(text(), '${email}')]]`;
    const toggleBtn = await driver.findElement(By.xpath(`${rowXpath}//button`)); // Hace click en el botón de cambiar estado
    await toggleBtn.click();
    console.log("   ✅ Usuario desactivado.");
  } catch (err) {
    console.log(`   ⚠️ No se pudo desactivar el usuario de pruebas: ${err.message}`);
  }
}

/**
 * Imprime reporte consolidado de auditoría
 */
function printAuditReport(report) {
  console.log("\n==========================================================================================");
  console.log("📊           REPORTE CONSOLIDADO: AUDITORÍA DE SEGURIDAD Y SANITIZACIÓN E2E               ");
  console.log("==========================================================================================");
  console.table(report);
  console.log("==========================================================================================");
  
  const vulnerableCount = report.filter(r => r.resultado.includes("❌")).length;
  if (vulnerableCount > 0) {
    console.log(`⚠️  ALERTA: Se han detectado ${vulnerableCount} brechas de sanitización / validaciones permisivas.`);
    console.log("💡 Sugerencia: Revisa los manejadores de eventos (onChange) en el frontend y los esquemas Zod en el backend.");
  } else {
    console.log("🎉 ¡COMPLIANCE TOTAL! Todos los módulos auditados cumplen con el estándar de validación del más alto nivel.");
  }
  console.log("==========================================================================================\n");
}

runHighLevelAudit();
