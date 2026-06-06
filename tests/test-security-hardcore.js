import axios from 'axios';

const API_URL = 'http://localhost:3001/api'; // Cambia por tu puerto del backend PERN
const LOGIN_ENDPOINT = `${API_URL}/auth/login`;

async function runHardcoreSecurityAudit() {
  console.log("🔥 Iniciando Auditoría de Seguridad Backend (Hardcore Mode)...");

  // ------------------------------------------------------------
  // PRUEBA 1: SQLi Real pasando por encima de las validaciones de formato email
  // ------------------------------------------------------------
  console.log("\n🧪 Test 1: Inyección SQL Directa al Endpoint...");
  try {
    const sqliPayloads = [
      { correo: "admin@correo.com' --", password: "123" },
      { correo: "' OR 1=1 --", password: "123" },
      { correo: "bypass@test.com", password: "' OR '1'='1" } // SQLi en el password
    ];

    for (const payload of sqliPayloads) {
      const res = await axios.post(LOGIN_ENDPOINT, payload, { validateStatus: () => true });
      
      // Si el servidor devuelve un 200 OK o un error 500 interno de base de datos, hay peligro.
      if (res.status === 200) {
        console.error(`❌ ¡ALERTA CRÍTICA! SQLi exitoso con payload: ${payload.email}`);
      } else if (res.status === 500) {
        console.warn(`⚠️ ADVERTENCIA: El servidor tiró un 500. Posible fuga de error de la Base de Datos (PostgreSQL).`);
      } else {
        console.log(`✅ CONTROL EXITOSO: El backend rechazó el payload con código ${res.status}.`);
      }
    }
  } catch (err) {
    console.error("Error en Test 1:", err.message);
  }

  // ------------------------------------------------------------
  // PRUEBA 2: Fuerza Bruta / Inundación Real (Rate Limiter Test)
  // ------------------------------------------------------------
  console.log("\n⚡ Test 2: Saltando el botón del Front. Enviando 2010 peticiones en lotes para evitar saturación de sockets...");
  
  const totalRequests = 2010;
  const batchSize = 150;
  const responses = [];

  console.log(`📡 Disparando ráfaga hacia ${LOGIN_ENDPOINT} en lotes de ${batchSize}...`);
  
  try {
    for (let i = 0; i < totalRequests; i += batchSize) {
      const currentBatchSize = Math.min(batchSize, totalRequests - i);
      const batchPromises = [];
      for (let j = 0; j < currentBatchSize; j++) {
        batchPromises.push(
          axios.post(LOGIN_ENDPOINT, {
            correo: "ataque_fuerzabruta@test.com",
            password: `password_intento_${i + j}`
          }, { validateStatus: () => true })
        );
      }
      const batchResponses = await Promise.all(batchPromises);
      responses.push(...batchResponses);
      console.log(`  [Progreso] Enviadas ${responses.length}/${totalRequests} peticiones...`);
    }

    // Analizar cuántas peticiones logró detener tu Rate Limiter
    const statusCodes = responses.reduce((acc, res) => {
      acc[res.status] = (acc[res.status] || 0) + 1;
      return acc;
    }, {});

    console.log("\n📊 RESULTADO DEL ATAQUE DE FUERZA BRUTA:");
    console.log(statusCodes);

    if (statusCodes['429']) {
      console.log(`\n✅ CONTROL EXITOSO: El Rate Limiter bloqueó ${statusCodes['429']} peticiones con HTTP 429 (Too Many Requests).`);
    } else {
      console.error("\n❌ ALERTA DE SEGURIDAD: El backend procesó todas las peticiones (o devolvió errores sin rate-limiting). Vulnerable a Fuerza Bruta/DDoS.");
    }
  } catch (globalError) {
    console.error("\n💥 El ataque colapsó antes de recibir respuestas. ¿Está el backend encendido?", globalError.message);
  }
}

runHardcoreSecurityAudit();