import pandas as pd
import re

def parse_prisma(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

    models = re.findall(r'model\s+(\w+)\s+{(.*?)}', content, re.DOTALL)
    data = []

    for model_name, body in models:
        lines = body.strip().split('\n')
        for line in lines:
            line = line.strip()
            if not line or line.startswith('@@') or line.startswith('//'):
                continue
            
            # Simple parsing of field, type, and attributes
            parts = re.split(r'\s+', line)
            if len(parts) < 2:
                continue
            
            field_name = parts[0]
            field_type = parts[1]
            attributes = " ".join(parts[2:]) if len(parts) > 2 else ""

            # Clave
            clave = ""
            if "@id" in attributes: clave = "PK"
            elif "@unique" in attributes: clave = "Unique"
            elif "@relation" in attributes or "fields:" in line: clave = "FK"

            # Nulidad
            nulidad = "No" if "?" not in field_type else "Sí"
            clean_type = field_type.replace("?", "")

            # Descripción Funcional detallada y profesional
            desc = ""
            if field_name == "id":
                desc = "Identificador Único Universal (UUID) autogenerado."
            elif field_name == "createdAt":
                desc = "Marca temporal inmutable de la creación del registro."
            elif field_name == "updatedAt":
                desc = "Marca temporal de la última modificación automática del registro."
            elif field_name == "deletedAt":
                desc = "Fecha de eliminación lógica (Soft Delete) para preservar la trazabilidad."
            elif field_name == "activo":
                desc = "Indicador lógico de activación en el sistema."
            elif "Nombre" in field_name or "Apellido" in field_name:
                desc = f"Parte de la información del nombre personal ({field_name})."
            elif field_name == "correo":
                desc = "Correo electrónico corporativo único para autenticación."
            elif field_name == "password":
                desc = "Hash bcrypt de seguridad para la contraseña del usuario."
            elif field_name == "rol":
                desc = "Rol asignado para control de acceso (ADMIN, OPERADOR)."
            elif field_name == "cedula":
                desc = "Cédula de ciudadanía o identificación del conductor."
            elif field_name == "telefono":
                desc = "Número telefónico de contacto del conductor."
            elif field_name == "placa":
                desc = "Placa patente de identificación única del vehículo."
            elif field_name == "marca":
                desc = "Marca fabricante del vehículo."
            elif field_name == "modelo":
                desc = "Modelo o año del vehículo."
            elif field_name == "capacidad":
                desc = "Capacidad máxima de carga permitida en toneladas métricas."
            elif field_name == "estado" and model_name == "Vehicle":
                desc = "Estado de disponibilidad del vehículo (DISPONIBLE, EN_VIAJE, MANTENIMIENTO)."
            elif model_name == "Trip":
                trip_desc = {
                    "ticket": "Número secuencial único del ticket de báscula física.",
                    "fecha": "Fecha y hora en que se realizó el flete.",
                    "origen": "Ubicación de origen/cargue del flete.",
                    "destino": "Ubicación de destino del flete.",
                    "producto": "Tipo de producto transportado (FRUTO, COMPOST).",
                    "empresa": "Nombre de la empresa destinataria o relacionada con el viaje.",
                    "tonelaje": "Peso neto transportado en toneladas métricas.",
                    "valorPago": "Monto total liquidado y a pagar por el viaje.",
                    "porcentajeConductor": "Porcentaje de comisión asignado al conductor (ej. 1.00 para 100%).",
                    "valorConductor": "Monto liquidado correspondiente al pago del conductor.",
                    "consumoAcpm": "Consumo de combustible ACPM en galones.",
                    "valorAcpm": "Costo monetario del combustible ACPM consumido.",
                    "usoFerry": "Indicador de si se utilizó servicio de cruce fluvial en Ferry.",
                    "valorFerry": "Costo monetario del cruce fluvial en Ferry.",
                    "driverId": "Clave foránea que referencia al conductor del viaje.",
                    "vehicleId": "Clave foránea que referencia al vehículo del viaje.",
                    "registradoPorId": "Clave foránea del usuario operador que registró el viaje.",
                    "actualizadoPorId": "Clave foránea del último usuario que modificó el viaje.",
                    "driver": "Relación con la entidad Conductor.",
                    "vehicle": "Relación con la entidad Vehículo.",
                    "registradoPor": "Relación con el Usuario creador.",
                    "actualizadoPor": "Relación con el Usuario editor."
                }
                desc = trip_desc.get(field_name, f"Atributo operativo del viaje ({field_name}).")
            elif model_name == "AuditLog":
                audit_desc = {
                    "userId": "Clave foránea del usuario que realizó la acción auditada.",
                    "user": "Relación con el Usuario que ejecutó la acción.",
                    "action": "Acción registrada (CREATE, UPDATE, DELETE, LOGIN, LOGOUT).",
                    "entity": "Nombre de la entidad o tabla donde se realizó el cambio.",
                    "entityId": "Identificador del registro de la entidad afectada.",
                    "oldValues": "Estado anterior del registro en formato JSON.",
                    "newValues": "Estado posterior del registro en formato JSON.",
                    "ipAddress": "Dirección IP del cliente que generó el cambio.",
                    "userAgent": "Cadena identificadora del cliente o navegador (User-Agent)."
                }
                desc = audit_desc.get(field_name, f"Campo de auditoría ({field_name}).")
            elif model_name == "RefreshToken":
                token_desc = {
                    "token": "Valor del token de refresco JWT.",
                    "userId": "Clave foránea del usuario al que pertenece la sesión.",
                    "user": "Relación con el Usuario de la sesión.",
                    "expiresAt": "Fecha y hora de expiración de la sesión.",
                    "revoked": "Indicador de si el token de refresco fue invalidado/cerrado."
                }
                desc = token_desc.get(field_name, f"Campo de sesión ({field_name}).")
            else:
                desc = f"Atributo técnico de la entidad {model_name}."

            data.append({
                "Tabla": model_name,
                "Campo": field_name,
                "Tipo de Dato": clean_type,
                "Nulidad": nulidad,
                "Clave": clave,
                "Descripción Funcional": desc
            })

    return data

def main():
    import os
    prisma_path = 'server/prisma/schema.prisma'
    output_path = 'docs/Diccionario_Datos_V2_Sincronizado.xlsx'
    if not os.path.exists(prisma_path):
        prisma_path = 'mi-proyecto-pern/server/prisma/schema.prisma'
        output_path = 'mi-proyecto-pern/docs/Diccionario_Datos_V2_Sincronizado.xlsx'
    
    try:
        data = parse_prisma(prisma_path)
        df = pd.DataFrame(data)
        
        # Exportar a Excel con múltiples hojas (una por modelo)
        with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
            # Obtener lista única de tablas
            tablas = df['Tabla'].unique()
            
            for tabla in tablas:
                # Filtrar datos para la tabla actual
                df_tabla = df[df['Tabla'] == tabla].drop(columns=['Tabla'])
                # Escribir en una hoja con el nombre de la tabla
                df_tabla.to_excel(writer, index=False, sheet_name=tabla)
            
        print(f"✅ Diccionario multihidja (v2) generado en: {output_path}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()

