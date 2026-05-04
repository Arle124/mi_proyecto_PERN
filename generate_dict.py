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

            # Descripción Funcional (Basada en lógica de negocio solicitada)
            desc = ""
            if field_name == "id": 
                desc = "Identificador Único Universal (UUID)."
            elif field_name == "deletedAt":
                desc = "Técnica que permite desactivar registros sin eliminarlos físicamente para garantizar la trazabilidad."
            elif model_name == "Trip":
                desc = f"Campo del Registro de Viajes y control de tickets ({field_name})."
            elif model_name == "AuditLog":
                desc = f"Parte de la Auditoría para registrar acciones realizadas por los usuarios ({field_name})."
            elif "Nombre" in field_name or "Apellido" in field_name: 
                desc = "Datos personales registrados en el sistema."
            elif field_name == "correo": 
                desc = "Email único para autenticación y notificaciones."
            elif field_name == "password": 
                desc = "Hash bcrypt de seguridad para la contraseña."
            elif field_name == "placa": 
                desc = "Identificación vehicular (Formato AAA000)."
            elif field_name == "activo": 
                desc = "Estado de activación lógica en el sistema."
            elif field_name == "capacidad": 
                desc = "Carga máxima permitida en toneladas."
            elif field_name == "estado": 
                desc = "Estado operativo actual del recurso."
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
    prisma_path = 'mi-proyecto-pern/server/prisma/schema.prisma'
    output_path = 'mi-proyecto-pern/Diccionario_Datos_V2_Sincronizado.xlsx'
    
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
