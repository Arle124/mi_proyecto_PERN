#!/bin/bash

# Configuración
URL="http://localhost:3001/api/vehiculos"

# Colores para la terminal
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "===================================================="
echo "🚚 TEST DE MÓDULO DE VEHÍCULOS - NOVAPALMA"
echo "===================================================="

echo -e "\n${RED}🧪 TEST 1: Fallo de Validación (Zod)${NC}"
echo "Placa inválida (123ABC) y capacidad negativa (-10)"
curl -s -X POST $URL \
     -H "Content-Type: application/json" \
     -d '{
           "placa": "123ABC",
           "marca": "Kenworth",
           "modelo": "T800",
           "capacidad": -10,
           "estado": "DISPONIBLE"
         }' | jq .
echo -e "\n"

echo -e "${GREEN}🧪 TEST 2: Creación Exitosa (ACID + Auditoría)${NC}"
RESPONSE=$(curl -s -X POST $URL \
     -H "Content-Type: application/json" \
     -d '{
           "placa": "XYZ987",
           "marca": "Kenworth",
           "modelo": "T800",
           "capacidad": 35,
           "estado": "DISPONIBLE"
         }')

echo "$RESPONSE" | jq .

# Extraer ID para el siguiente test
VEHICLE_ID=$(echo "$RESPONSE" | jq -r '.id')

if [ "$VEHICLE_ID" == "null" ] || [ -z "$VEHICLE_ID" ]; then
    echo -e "${RED}❌ Error: No se pudo obtener el ID del vehículo creado.${NC}"
    exit 1
fi

echo -e "\n${GREEN}🧪 TEST 3: Soft Delete (Integridad de Datos)${NC}"
echo "Eliminando vehículo ID: $VEHICLE_ID"
curl -s -X DELETE "$URL/$VEHICLE_ID" | jq .

echo -e "\n===================================================="
echo "✅ Pruebas finalizadas."
echo "===================================================="
