import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { DollarSign, Filter, Download, Printer, Table, Calendar, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

const Finance = () => {
  const { isAdmin } = useAuth();
  const [trips, setTrips] = useState([]);
  const [stats, setStats] = useState({
    totalTons: 0,
    totalBilling: 0,
    totalAcpm: 0,
    totalFerryCrossings: 0
  });
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (isAdmin()) {
      fetchReport();
    }
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let url = '/finanzas/report';
      const params = [];
      if (startDate) params.push(`startDate=${startDate}`);
      if (endDate) params.push(`endDate=${endDate}`);
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      const { data } = await api.get(url);
      setTrips(data.trips);
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching finance report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (e) => {
    e.preventDefault();
    fetchReport();
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    // We fetch without filters
    setTimeout(() => {
      fetchReport();
    }, 50);
  };

  /**
   * EXPORTACIÓN DE REPORTES EN FORMATO EXCEL (.xlsx)
   * - Procesa los datos filtrados en memoria de la grilla de finanzas.
   * - Aplica la consistencia de zona horaria (UTC) para evitar desfase de 1 día en fechas.
   * - Auto-ajusta el ancho de columnas (wchs) de forma dinámica para estética premium.
   */
  const exportToExcel = () => {
    if (trips.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    // Formateo explícito de los registros para coincidir 100% con la planilla Viajes Novapalma.xlsx
    const formattedData = trips.map(t => {
      const driverVal = Number(t.valorConductor || 0);
      const acpmVal = Number(t.valorAcpm || 0);
      const ferryVal = Number(t.valorFerry || 0);
      const totalExpenses = driverVal + acpmVal + ferryVal;
      const netUtility = Number(t.valorPago) - totalExpenses;
      
      const valorTon = Number(t.tonelaje) > 0 
        ? parseFloat((Number(t.valorPago) / (Number(t.tonelaje) * 1000)).toFixed(3)) 
        : 0;

      return {
        'Fecha': new Date(t.fecha).toLocaleDateString(undefined, { timeZone: 'UTC' }),
        'PLACA': t.vehicle?.placa || '',
        'Conductor': t.driver ? `${t.driver.primerNombre} ${t.driver.primerApellido}` : '',
        'Empresa': t.empresa || 'N/A',
        'ORIGEN': t.origen || '',
        'DESTINO': t.destino || 'N/A',
        'PRODUCTO': t.producto || '',
        'TIQUETE': t.ticket || 0,
        'KILOGRAMOS': Number(t.tonelaje) * 1000,
        'VALOR TONELADA': valorTon,
        'VALOR FLETE VIAJE': Number(t.valorPago),
        'PORCENTAJE CONDUCTOR': driverVal,
        'ACPM': acpmVal,
        'FERRY': ferryVal,
        'GASTOS': totalExpenses,
        'NETO': netUtility
      };
    });

    // Conversión de JSON estructurado a hoja física de XLSX
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    
    // Auto-fit dinámico de columnas según longitud máxima del contenido de la columna + 2 padding
    const colWidths = Object.keys(formattedData[0] || {}).map(key => {
      const maxLength = Math.max(
        key.length,
        ...formattedData.map(row => String(row[key] || '').length)
      );
      return { wch: maxLength + 2 };
    });
    worksheet['!cols'] = colWidths;

    // Crea el libro de trabajo (workbook) y añade la pestaña de reporte consolidado
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Hoja1'); // Nombre de pestaña 'Hoja1' igual que el original

    // Dispara la descarga del reporte etiquetado con la marca temporal actual
    XLSX.writeFile(workbook, `reporte_financiero_novapalma_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  /**
   * IMPRESIÓN Y EXPORTACIÓN A PDF NATIVA
   * Utiliza las hojas de estilo del navegador para formato horizontal (Landscape)
   */
  const triggerPrint = () => {
    window.print();
  };

  if (!isAdmin()) {
    return <div className="alert alert-danger p-3">Acceso restringido. Solo administradores.</div>;
  }

  return (
    <div className="container-fluid print-container">
      {/* Header section hidden during print */}
      <div className="d-flex justify-content-between align-items-center mb-4 no-print">
        <div>
          <h4 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <DollarSign className="text-primary" size={24} />
            Reportes y Finanzas Logísticas
          </h4>
          <p className="text-muted small">Visualiza balances consolidados, filtra despachos y genera informes oficiales para auditoría.</p>
        </div>
        <div className="d-flex gap-2">
          <button onClick={exportToExcel} className="btn btn-outline-success d-flex align-items-center gap-2">
            <Download size={18} /> Exportar Excel
          </button>
          <button onClick={triggerPrint} className="btn btn-outline-primary d-flex align-items-center gap-2">
            <Printer size={18} /> Imprimir PDF
          </button>
        </div>
      </div>

      {/* Date Filters form - hidden during print */}
      <div className="card p-3 border-0 shadow-sm mb-4 no-print bg-white">
        <form onSubmit={handleFilter} className="row g-3 align-items-end">
          <div className="col-md-4">
            <label className="form-label small fw-bold text-secondary">Fecha Inicial</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-0"><Calendar size={18} /></span>
              <input 
                type="date" 
                className="form-control bg-light border-0" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
              />
            </div>
          </div>
          <div className="col-md-4">
            <label className="form-label small fw-bold text-secondary">Fecha Final</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-0"><Calendar size={18} /></span>
              <input 
                type="date" 
                className="form-control bg-light border-0" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
              />
            </div>
          </div>
          <div className="col-md-4 d-flex gap-2">
            <button type="submit" className="btn btn-primary flex-grow-1 d-flex align-items-center justify-content-center gap-2">
              <Filter size={18} /> Filtrar Reporte
            </button>
            <button type="button" onClick={handleReset} className="btn btn-light border">
              Limpiar
            </button>
          </div>
        </form>
      </div>

      {/* Financial Summary Cards (Screen Only) */}
      <div className="row g-4 mb-4 no-print">
        <div className="col-md-3">
          <div className="card p-3 border-0 shadow-sm bg-primary text-white">
            <small className="opacity-85 text-uppercase fw-semibold" style={{ fontSize: '15px' }}>Ingresos Totales (Flete)</small>
            <h3 className="fw-bold mt-1 mb-0">${Number(stats.totalBilling || 0).toLocaleString()}</h3>
            <span className="small opacity-90 mt-1 d-inline-block">COP facturado</span>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card p-3 border-0 shadow-sm bg-danger text-white">
            <small className="opacity-85 text-uppercase fw-semibold" style={{ fontSize: '15px' }}>Gastos Operativos (Total)</small>
            <h3 className="fw-bold mt-1 mb-0">${Number(stats.totalExpenses || 0).toLocaleString()}</h3>
            <span className="small opacity-90 mt-1 d-inline-block">Conductor + ACPM + Ferry</span>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card p-3 border-0 shadow-sm bg-success text-white">
            <small className="opacity-85 text-uppercase fw-semibold" style={{ fontSize: '15px' }}>Utilidad Neta (Neto)</small>
            <h3 className="fw-bold mt-1 mb-0">${Number(stats.totalNet || 0).toLocaleString()}</h3>
            <span className="small opacity-90 mt-1 d-inline-block">COP rentabilidad real</span>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card p-3 border-0 shadow-sm bg-dark text-white">
            <small className="opacity-85 text-uppercase fw-semibold" style={{ fontSize: '15px' }}>Desglose de Gastos</small>
            <div className="mt-1 small" style={{ fontSize: '12px' }}>
              <div className="d-flex justify-content-between"><span>Conductor:</span> <span className="fw-bold">${Number(stats.totalDriverPayout || 0).toLocaleString()}</span></div>
              <div className="d-flex justify-content-between"><span>ACPM:</span> <span className="fw-bold">${Number(stats.totalAcpmCost || 0).toLocaleString()}</span></div>
              <div className="d-flex justify-content-between"><span>Ferry:</span> <span className="fw-bold">${Number(stats.totalFerryCost || 0).toLocaleString()}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Report Title - only visible when printing */}
      <div className="print-only mb-4 text-center print-header">
        <h2 className="fw-bold text-dark m-0" style={{ letterSpacing: '1px' }}>NOVAPALMA LOGÍSTICA S.A.S.</h2>
        <p className="text-secondary small m-1 fw-semibold">Nit: 900.123.456-7 — Reporte de Auditoría y Balance Financiero</p>
        <div style={{ width: '80px', height: '3px', backgroundColor: '#3b82f6', margin: '8px auto' }}></div>
        <div className="d-flex justify-content-between text-muted small px-3 mt-3 border-top border-bottom py-2 bg-light">
          <span><strong>Fecha Generación:</strong> {new Date().toLocaleString()}</span>
          <span><strong>Rango de Auditoría:</strong> {startDate || 'Inicio del registro'} hasta {endDate || 'Fecha actual'}</span>
        </div>
      </div>

      {/* Financial Summary for Print Only (Stunning Executive Layout) */}
      <div className="print-only mb-4 pt-2">
        <div className="row-print-summary">
          <div className="col-print-4">
            <div className="print-summary-box border-left-primary">
              <span className="print-box-title">Ingresos Totales (Flete)</span>
              <h4 className="print-box-value text-primary">${Number(stats.totalBilling || 0).toLocaleString()}</h4>
              <span className="print-box-sub">Volumen de ventas brutas</span>
            </div>
          </div>
          <div className="col-print-4">
            <div className="print-summary-box border-left-danger">
              <span className="print-box-title">Gastos Operativos</span>
              <h4 className="print-box-value text-danger">${Number(stats.totalExpenses || 0).toLocaleString()}</h4>
              <span className="print-box-sub">Conductor + Combustible + Peajes</span>
            </div>
          </div>
          <div className="col-print-4">
            <div className="print-summary-box border-left-success">
              <span className="print-box-title">Utilidad Neta (Margen)</span>
              <h4 className="print-box-value text-success">${Number(stats.totalNet || 0).toLocaleString()}</h4>
              <span className="print-box-sub">Rentabilidad operativa real</span>
            </div>
          </div>
          <div className="col-print-4">
            <div className="print-summary-box border-left-dark">
              <span className="print-box-title">Desglose de Egresos</span>
              <div className="print-box-details">
                <div>Conductor: <strong>${Number(stats.totalDriverPayout || 0).toLocaleString()}</strong></div>
                <div>ACPM: <strong>${Number(stats.totalAcpmCost || 0).toLocaleString()}</strong></div>
                <div>Ferry: <strong>${Number(stats.totalFerryCost || 0).toLocaleString()}</strong></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trips Table */}
      <div className="card border-0 shadow-sm bg-white print-card-wrapper">
        <div className="card-header bg-transparent border-0 pt-4 px-4 d-flex justify-content-between align-items-center no-print">
          <h5 className="fw-bold m-0 d-flex align-items-center gap-2">
            <Table size={20} className="text-secondary" />
            Desglose de Despachos Auditados
          </h5>
          <span className="badge bg-light text-dark border px-3 py-2 small">{trips.length} registros encontrados</span>
        </div>
        <div className="table-responsive p-2">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th className="px-4 py-3 text-secondary small text-uppercase fw-bold">Ticket</th>
                <th className="py-3 text-secondary small text-uppercase fw-bold">Fecha</th>
                <th className="py-3 text-secondary small text-uppercase fw-bold">Vehículo</th>
                <th className="py-3 text-secondary small text-uppercase fw-bold">Ruta (Origen &rarr; Destino)</th>
                <th className="py-3 text-secondary small text-uppercase fw-bold">Empresa</th>
                <th className="py-3 text-secondary small text-uppercase fw-bold">Producto</th>
                <th className="py-3 text-secondary small text-uppercase fw-bold">Tonelaje</th>
                <th className="py-3 text-secondary small text-uppercase fw-bold">Costo ACPM</th>
                <th className="py-3 text-secondary small text-uppercase fw-bold">Costo Ferry</th>
                <th className="py-3 text-secondary small text-uppercase fw-bold">Pago Cond.</th>
                <th className="py-3 text-secondary small text-uppercase fw-bold">Gastos</th>
                <th className="py-3 text-secondary small text-uppercase fw-bold px-4 text-end">Flete (Ingreso)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="12" className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                    Cargando informe...
                  </td>
                </tr>
              ) : trips.length === 0 ? (
                <tr>
                  <td colSpan="12" className="text-center py-5 text-muted">No se encontraron registros de viajes en el rango seleccionado.</td>
                </tr>
              ) : (
                trips.map((t) => {
                  const driverVal = Number(t.valorConductor || 0);
                  const acpmVal = Number(t.valorAcpm || 0);
                  const ferryVal = Number(t.valorFerry || 0);
                  const totalExpenses = driverVal + acpmVal + ferryVal;

                  return (
                    <tr key={t.id}>
                      <td className="px-4 fw-bold text-primary">#{t.ticket}</td>
                      <td>{new Date(t.fecha).toLocaleDateString(undefined, { timeZone: 'UTC' })}</td>
                      <td><span className="badge bg-light text-dark border">{t.vehicle?.placa}</span></td>
                      <td className="small fw-medium">
                        {t.origen} 
                        {t.destino ? <span className="text-secondary"> &rarr; {t.destino}</span> : ''}
                      </td>
                      <td className="text-muted small">{t.empresa || 'N/A'}</td>
                      <td>
                        <span className={`badge px-2 py-1 rounded-pill ${t.producto === 'FRUTO' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning-emphasis'}`}>
                          {t.producto}
                        </span>
                      </td>
                      <td>{t.tonelaje} Ton</td>
                      <td className="text-danger small">${acpmVal.toLocaleString()}</td>
                      <td className="text-danger small">${ferryVal.toLocaleString()}</td>
                      <td className="text-success small fw-medium">
                        ${driverVal.toLocaleString()} <small className="text-muted">({Number(t.porcentajeConductor || 1.0)}%)</small>
                      </td>
                      <td className="text-danger small fw-semibold">${totalExpenses.toLocaleString()}</td>
                      <td className="fw-bold px-4 text-end text-dark">${Number(t.valorPago).toLocaleString()}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sign-off & Audit Section for Print Only */}
      <div className="print-only audit-signatures mt-5 pt-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '60px' }}>
          <div className="sig-box">
            <div className="sig-line"></div>
            <span className="sig-title">Director de Logística</span>
            <span className="sig-desc">Novapalma S.A.S.</span>
          </div>
          <div className="sig-box">
            <div className="sig-line"></div>
            <span className="sig-title">Auditor Financiero</span>
            <span className="sig-desc">Control Operativo</span>
          </div>
          <div className="sig-box">
            <div className="sig-line"></div>
            <span className="sig-title">Representante de Contratista</span>
            <span className="sig-desc">Firma y Sello Comercial</span>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          @page {
            size: letter landscape;
            margin: 12mm 15mm 15mm 15mm;
          }
          
          /* Evitar cortes feos e inhabilitar viewport fijo de React Layout */
          html, body, #root, .d-flex, main {
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
            display: block !important;
            background-color: white !important;
            color: #0f172a !important;
          }
          
          .no-print {
            display: none !important;
          }
          
          .print-only {
            display: block !important;
          }
          
          .print-container {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          
          /* Habilitar impresión de fondos coloreados de CSS */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .print-card-wrapper {
            border: 1px solid #e2e8f0 !important;
            box-shadow: none !important;
            border-radius: 8px !important;
            background-color: white !important;
            overflow: visible !important;
          }
          
          /* Estructura Grid de Tarjetas de Resumen Financiero en Impresión */
          .row-print-summary {
            display: flex !important;
            gap: 15px !important;
            width: 100% !important;
            box-sizing: border-box !important;
            margin-bottom: 25px !important;
          }
          
          .col-print-4 {
            flex: 1 !important;
          }
          
          .print-summary-box {
            border: 1px solid #e2e8f0 !important;
            background-color: #f8fafc !important;
            border-radius: 8px !important;
            padding: 12px 14px !important;
            box-sizing: border-box !important;
            height: 100% !important;
          }
          
          .border-left-primary { border-left: 4px solid #3b82f6 !important; }
          .border-left-danger { border-left: 4px solid #ef4444 !important; }
          .border-left-success { border-left: 4px solid #10b981 !important; }
          .border-left-dark { border-left: 4px solid #1e293b !important; }
          
          .print-box-title {
            display: block !important;
            font-size: 10px !important;
            text-transform: uppercase !important;
            font-weight: 700 !important;
            color: #64748b !important;
          }
          
          .print-box-value {
            font-size: 18px !important;
            font-weight: 800 !important;
            margin: 4px 0 2px 0 !important;
          }
          
          .print-box-sub {
            display: block !important;
            font-size: 8.5px !important;
            color: #94a3b8 !important;
          }
          
          .print-box-details {
            font-size: 9px !important;
            margin-top: 4px !important;
            color: #334155 !important;
            line-height: 1.3 !important;
          }
          
          /* Tabla Optimizada para Impresión de Múltiples Páginas */
          .table-responsive {
            overflow: visible !important;
            display: block !important;
            width: 100% !important;
          }
          
          .table {
            width: 100% !important;
            border-collapse: collapse !important;
            page-break-inside: auto !important;
          }
          
          .table thead {
            display: table-header-group !important; /* Repetir cabecera en cada página */
          }
          
          .table tr {
            page-break-inside: avoid !important; /* No cortar filas a la mitad */
          }
          
          .table thead th {
            background-color: #0f172a !important;
            color: white !important;
            font-size: 9px !important;
            font-weight: 700 !important;
            padding: 8px 6px !important;
            border: 1px solid #334155 !important;
          }
          
          .table tbody td {
            font-size: 9px !important;
            padding: 7px 6px !important;
            border: 1px solid #e2e8f0 !important;
            color: #1e293b !important;
          }
          
          .table tbody tr:nth-child(even) td {
            background-color: #f8fafc !important; /* Filas alternas */
          }
          
          /* Firmas Auditables */
          .audit-signatures {
            page-break-inside: avoid !important;
          }
          
          .sig-box {
            width: 28% !important;
            text-align: center !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
          }
          
          .sig-line {
            width: 180px !important;
            border-top: 1px dashed #64748b !important;
            margin-bottom: 6px !important;
          }
          
          .sig-title {
            font-size: 10px !important;
            font-weight: 700 !important;
            color: #1e293b !important;
          }
          
          .sig-desc {
            font-size: 8.5px !important;
            color: #64748b !important;
          }
        }
        .print-only {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default Finance;
