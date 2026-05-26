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

    // Formateo explícito de los registros para el reporte de auditoría
    const formattedData = trips.map(t => ({
      'Ticket': `#${t.ticket}`,
      // Consistencia horaria crucial: se usa timeZone: 'UTC' para que no reste
      // horas locales (Colombia/Ecuador UTC-5) y muestre el día calendario exacto guardado.
      'Fecha': new Date(t.fecha).toLocaleDateString(undefined, { timeZone: 'UTC' }),
      'Conductor': `${t.driver?.primerNombre} ${t.driver?.primerApellido}`,
      'Cédula': t.driver?.cedula,
      'Vehículo': t.vehicle?.placa,
      'Origen': t.origen,
      'Producto': t.producto,
      'Tonelaje (Tons)': Number(t.tonelaje),
      'Consumo ACPM (Gal)': t.consumoAcpm ? Number(t.consumoAcpm) : 0,
      'Ferry Usado': t.usoFerry ? 'SÍ' : 'NO',
      'Valor Pago (COP)': Number(t.valorPago)
    }));

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
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte Financiero');

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

      {/* Financial Summary Cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="card p-3 border-0 shadow-sm bg-primary text-white">
            <small className="opacity-85 text-uppercase fw-semibold" style={{ fontSize: '15px' }}>Ingresos Totales (Facturación)</small>
            <h3 className="fw-bold mt-1 mb-0">${Number(stats.totalBilling).toLocaleString()}</h3>
            <span className="small opacity-90 mt-1 d-inline-block">COP consolidado</span>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card p-3 border-0 shadow-sm bg-success text-white">
            <small className="opacity-85 text-uppercase fw-semibold" style={{ fontSize: '15px' }}>Carga Total Transportada</small>
            <h3 className="fw-bold mt-1 mb-0">{Number(stats.totalTons).toFixed(2)} Ton</h3>
            <span className="small opacity-90 mt-1 d-inline-block">Peso total registrado</span>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card p-3 border-0 shadow-sm bg-info text-white">
            <small className="opacity-85 text-uppercase fw-semibold" style={{ fontSize: '15px' }}>Combustible ACPM Consumido</small>
            <h3 className="fw-bold mt-1 mb-0">{Number(stats.totalAcpm).toFixed(1)} Gal</h3>
            <span className="small opacity-90 mt-1 d-inline-block">Consumo total estimado</span>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card p-3 border-0 shadow-sm bg-warning text-white">
            <small className="opacity-85 text-uppercase fw-semibold" style={{ fontSize: '15px' }}>Cruces de Ferry</small>
            <h3 className="fw-bold mt-1 mb-0">{stats.totalFerryCrossings}</h3>
            <span className="small opacity-90 mt-1 d-inline-block">Tránsitos fluviales</span>
          </div>
        </div>
      </div>

      {/* Printable Report Title - only visible when printing */}
      <div className="print-only mb-4 text-center">
        <h2 className="fw-bold text-dark m-0">NOVAPALMA LOGÍSTICA S.A.S.</h2>
        <p className="text-secondary small m-1">Nit: 900.123.456-7 — Reporte Oficial de Balances Financieros</p>
        <hr className="my-2" />
        <div className="d-flex justify-content-between text-muted small px-3">
          <span>Fecha Generación: {new Date().toLocaleString()}</span>
          <span>Rango: {startDate || 'Inicio'} hasta {endDate || 'Fin'}</span>
        </div>
      </div>

      {/* Trips Table */}
      <div className="card border-0 shadow-sm bg-white">
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
                <th className="py-3 text-secondary small text-uppercase fw-bold">Conductor</th>
                <th className="py-3 text-secondary small text-uppercase fw-bold">Vehículo</th>
                <th className="py-3 text-secondary small text-uppercase fw-bold">Producto</th>
                <th className="py-3 text-secondary small text-uppercase fw-bold">Tonelaje</th>
                <th className="py-3 text-secondary small text-uppercase fw-bold">ACPM</th>
                <th className="py-3 text-secondary small text-uppercase fw-bold">Ferry</th>
                <th className="py-3 text-secondary small text-uppercase fw-bold px-4 text-end">Valor Pago</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                    Cargando informe...
                  </td>
                </tr>
              ) : trips.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-5 text-muted">No se encontraron registros de viajes en el rango seleccionado.</td>
                </tr>
              ) : (
                trips.map((t) => (
                  <tr key={t.id}>
                    <td className="px-4 fw-bold text-primary">#{t.ticket}</td>
                    <td>{new Date(t.fecha).toLocaleDateString(undefined, { timeZone: 'UTC' })}</td>
                    <td className="fw-medium">{t.driver?.primerNombre} {t.driver?.primerApellido}</td>
                    <td><span className="badge bg-light text-dark border">{t.vehicle?.placa}</span></td>
                    <td>
                      <span className={`badge px-2 py-1 rounded-pill ${t.producto === 'FRUTO' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning-emphasis'}`}>
                        {t.producto}
                      </span>
                    </td>
                    <td>{t.tonelaje} Ton</td>
                    <td>{t.consumoAcpm || 0} Gal</td>
                    <td>
                      <span className={`badge px-2 py-0.5 rounded-pill ${t.usoFerry ? 'bg-info-subtle text-info' : 'bg-light text-muted border'}`}>
                        {t.usoFerry ? 'SÍ' : 'NO'}
                      </span>
                    </td>
                    <td className="fw-bold px-4 text-end text-dark">${Number(t.valorPago).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .print-container {
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background-color: white !important;
          }
          body {
            background-color: white !important;
            color: black !important;
          }
          .card {
            box-shadow: none !important;
            border: 1px solid #dee2e6 !important;
          }
          .table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            font-size: 11px !important;
            padding: 6px !important;
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
