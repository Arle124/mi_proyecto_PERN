#!/bin/bash

# Configuración
BASE_URL="http://localhost:3001/api"
COOKIE_FILE="/tmp/novapalma_cookies.txt"

# Colores para la terminal
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}🛡️  TEST DE SEGURIDAD: PREVENCIÓN DE BLOQUEO DE ADMIN${NC}"
echo -e "${BLUE}====================================================${NC}"

# 1. Iniciar sesión como Administrador
echo -e "\n${BLUE}🔑 1. Autenticando Administrador Semilla (admin@novapalma.com)...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
     -H "Content-Type: application/json" \
     -d '{
           "correo": "admin@novapalma.com",
           "password": "admin123"
         }' \
     -c "$COOKIE_FILE")

# Verificar si se inició sesión con éxito
if [[ "$LOGIN_RESPONSE" == *"error"* ]]; then
  echo -e "${RED}❌ Error en autenticación: $LOGIN_RESPONSE${NC}"
  rm -f "$COOKIE_FILE"
  exit 1
fi

echo -e "${GREEN}✅ Autenticación exitosa. Sesión guardada.${NC}"

# 2. Obtener usuarios y buscar el ID de admin@novapalma.com
echo -e "\n${BLUE}🔍 2. Consultando lista de usuarios y localizando Administrador...${NC}"
USERS_LIST=$(curl -s -X GET "$BASE_URL/usuarios" -b "$COOKIE_FILE")
ADMIN_ID=$(echo "$USERS_LIST" | jq -r '.[] | select(.correo=="admin@novapalma.com") | .id')

if [ -z "$ADMIN_ID" ] || [ "$ADMIN_ID" == "null" ]; then
  echo -e "${RED}❌ Error: No se encontró al usuario admin@novapalma.com en la lista.${NC}"
  rm -f "$COOKIE_FILE"
  exit 1
fi

echo -e "${GREEN}✅ Administrador localizado. ID: $ADMIN_ID${NC}"

# 3. TEST DE SEGURIDAD 1: Intentar desactivar al único Administrador
echo -e "\n${RED}🧪 TEST 1: Intento de desactivación de la última cuenta de ADMINISTRADOR${NC}"
RESPONSE_1=$(curl -s -X PUT "$BASE_URL/usuarios/$ADMIN_ID" \
     -b "$COOKIE_FILE" \
     -H "Content-Type: application/json" \
     -d '{"activo": false}')

echo -e "Respuesta del Servidor:\n$RESPONSE_1"

if echo "$RESPONSE_1" | grep -qE "No se puede desactivar o degradar al único administrador activo|No puedes desactivar o suspender tu propia cuenta"; then
  echo -e "${GREEN}🎯 ¡ÉXITO! La solicitud fue denegada correctamente por el backend.${NC}"
else
  echo -e "${RED}❌ ¡FALLO! El sistema permitió desactivar al único administrador.${NC}"
fi

# 4. TEST DE SEGURIDAD 2: Intentar degradar el rol del único Administrador
echo -e "\n${RED}🧪 TEST 2: Intento de degradación del único administrador a OPERADOR${NC}"
RESPONSE_2=$(curl -s -X PUT "$BASE_URL/usuarios/$ADMIN_ID" \
     -b "$COOKIE_FILE" \
     -H "Content-Type: application/json" \
     -d '{"rol": "OPERADOR"}')

echo -e "Respuesta del Servidor:\n$RESPONSE_2"

if echo "$RESPONSE_2" | grep -qE "No se puede desactivar o degradar al único administrador activo|No puedes degradar tu propio rol"; then
  echo -e "${GREEN}🎯 ¡ÉXITO! La degradación de privilegios fue bloqueada de forma segura.${NC}"
else
  echo -e "${RED}❌ ¡FALLO! El sistema permitió degradar al único administrador.${NC}"
fi

# Limpieza
rm -f "$COOKIE_FILE"
echo -e "\n${BLUE}====================================================${NC}"
echo -e "${GREEN}🎉 Pruebas de seguridad finalizadas con éxito.${NC}"
echo -e "${BLUE}====================================================${NC}"
