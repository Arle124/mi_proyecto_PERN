import openpyxl
import json
import datetime

wb = openpyxl.load_workbook('Viajes Novapalma.xlsx', data_only=True)
ws = wb.active

trips = []

for row in ws.iter_rows(min_row=2, values_only=True):
    if not row[0]: # Skip empty rows
        continue
    
    # Map row values to dict
    trip = {
        'fecha': row[0].isoformat() if isinstance(row[0], datetime.datetime) else str(row[0]),
        'placa': row[1].strip().upper() if row[1] else None,
        'conductor': row[2].strip().upper() if row[2] else None,
        'empresa': row[3].strip() if row[3] else None,
        'origen': row[4].strip() if row[4] else None,
        'destino': row[5].strip() if row[5] else None,
        'producto': row[6].strip().upper() if row[6] else None,
        'ticket': int(row[7]) if row[7] is not None else None,
        'kilogramos': float(row[8]) if row[8] is not None else 0.0,
        'valorTonelada': float(row[9]) if row[9] is not None else 0.0,
        'valorFlete': float(row[10]) if row[10] is not None else 0.0,
        'valorConductor': float(row[11]) if row[11] is not None else 0.0,
        'valorAcpm': float(row[12]) if row[12] is not None else 0.0,
        'valorFerry': float(row[13]) if row[13] is not None else 0.0,
    }
    trips.append(trip)

with open('server/excel_trips.json', 'w', encoding='utf-8') as f:
    json.dump(trips, f, ensure_ascii=False, indent=2)

print(f"Extracted {len(trips)} trips successfully.")
