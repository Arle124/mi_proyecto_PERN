#!/bin/bash

# Configuración
URL="http://localhost:3001/api/usuarios"

echo "------------------------------------------------"
echo "🧪 TEST 1: Petición Errónea (Validación Zod)"
echo "------------------------------------------------"
curl -X POST $URL \
     -H "Content-Type: application/json" \
     -d '{
           "primerNombre": "",
           "primerApellido": "Perez",
           "correo": "correo-invalido",
           "password": "123"
         }'
echo -e "\n\n"

echo "------------------------------------------------"
echo "🧪 TEST 2: Petición Correcta (ACID + Auditoría)"
echo "------------------------------------------------"
curl -X POST $URL \
     -H "Content-Type: application/json" \
     -d '{
           "primerNombre": "Andres",
           "primerApellido": "Gomez",
           "correo": "andres.gomez.v2@novapalma.com",
           "password": "passwordSeguro123",
           "rol": "OPERADOR"
         }'
echo -e "\n"
