import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Save, AlertCircle, X, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Formateador de moneda estilo colombiano (separador de miles con punto)
const formatCurrencyCOP = (val) => {
  if (val === undefined || val === null || val === '') return '';
  const stringVal = val.toString().replace(/\D/g, '');
  if (!stringVal) return '';
  return Number(stringVal).toLocaleString('de-DE');
};

const getInitialFormData = () => ({
  ticket: '',
  fecha: new Date().toISOString().split('T')[0],
  origen: localStorage.getItem('defaultOrigen') || '',
  destino: localStorage.getItem('defaultDestino') || '',
  empresa: '',
  producto: 'FRUTO',
  tonelaje: '',   // Ingresado en KILOGRAMOS en la UI, guardado en TONELADAS en la BD
  valorPago: '',  // Manual para COMPOST
  precioKg: localStorage.getItem('defaultPriceKg') || '100',   // Pago por KILOGRAMO para FRUTO
  driverId: '',
  vehicleId: '',
  consumoAcpm: 0,
  usoFerry: false,
  porcentajeConductor: 1.00,
  valorAcpm: localStorage.getItem('defaultAcpm') || '0',
  valorFerry: localStorage.getItem('defaultFerry') || '0'
});

const Trips = ({ isDashboard = false }) => {
  const { isAdmin } = useAuth();
  const [trips, setTrips] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: null
  });

  // Estado del formulario
  const [formData, setFormData] = useState(getInitialFormData());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tripsRes, driversRes, vehiclesRes] = await Promise.all([
        api.get('/viajes'),
        api.get('/conductores'),
        api.get('/vehiculos')
      ]);
      setTrips(tripsRes.data);
      setDrivers(driversRes.data);
      setVehicles(vehiclesRes.data); // No filtering by status, late planillas are flexible!
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * ============================================================
   * CONTROLADORES DE INTERFAZ Y BLINDAJES DE SEGURIDAD (UX)
   * ============================================================
   */

  /**
   * Manejador genérico de cambios en inputs con sanitización activa.
   * RF-Viajes-01: Evita caracteres especiales, signos negativos o pegado malicioso.
   */
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'usoFerry') {
      setFormData({
        ...formData,
        usoFerry: checked,
        valorFerry: checked ? formData.valorFerry : ''
      });
      return;
    }

    if (name === 'ticket') {
      // Sanitización estricta de ticket: remueve cualquier carácter no numérico (\D).
      // Impide físicamente guiones, signos +, letras o espacios en vivo.
      const positiveInteger = value.replace(/\D/g, '');
      setFormData({
        ...formData,
        ticket: positiveInteger
      });
      return;
    }
    
    if (
      name === 'tonelaje' || 
      name === 'consumoAcpm' || 
      name === 'porcentajeConductor'
    ) {
      // Sanitización para entradas numéricas decimales o enteras (kg, galones, porcentaje)
      let cleanedValue = value.replace(/-/g, '');
      if (cleanedValue !== '' && parseFloat(cleanedValue) < 0) {
        cleanedValue = '0';
      }
      
      setFormData({
        ...formData,
        [name]: cleanedValue
      });
      return;
    }

    if (
      name === 'valorPago' || 
      name === 'precioKg' || 
      name === 'valorAcpm' || 
      name === 'valorFerry'
    ) {
      // Sanitización para valores monetarios (solo dígitos enteros)
      const digitsOnly = value.replace(/\D/g, '');
      setFormData({
        ...formData,
        [name]: digitsOnly
      });
      return;
    }

    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  /**
   * Bloqueador de teclado físico en inputs numéricos.
   * Bloquea signos negativos, positivos y notación científica 'e' / 'E'
   * para prevenir que se rompa el esquema de la base de datos o Zod.
   */
  const handleKeyDownPositive = (e) => {
    if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
      e.preventDefault();
    }
  };

  /**
   * OBTENCIÓN DEL VALOR PAGO PACTADO (AUTOMÁTICO O MANUAL)
   * Para FRUTO se calcula dinámicamente multiplicando Tons * 1000 * precioKg.
   * Para COMPOST se ingresa de forma manual.
   */
  const getCalculatedPayment = () => {
    if (formData.producto === 'FRUTO') {
      const kg = parseFloat(formData.tonelaje) || 0;
      const priceKg = parseFloat(formData.precioKg) || 0;
      // Cálculo directo: Kilogramos * Precio por Kg
      return Math.round(kg * priceKg);
    }
    return parseFloat(formData.valorPago) || 0;
  };

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setError('');
    setFormData(getInitialFormData());
    setShowModal(true);
  };

  const handleEditClick = (trip) => {
    setIsEditing(true);
    setEditingId(trip.id);
    setError('');
    
    // UI almacena en kilogramos, BD en toneladas (tons * 1000)
    const tons = Number(trip.tonelaje) || 0;
    const kg = Math.round(tons * 1000);
    
    // Obtener precio por kilo para pre-poblar
    let calculatedPriceKg = '100';
    if (trip.producto === 'FRUTO' && kg > 0) {
      calculatedPriceKg = Math.round(Number(trip.valorPago) / kg).toString();
    }

    setFormData({
      ticket: trip.ticket.toString(),
      fecha: new Date(trip.fecha).toISOString().split('T')[0],
      origen: trip.origen,
      destino: trip.destino || '',
      empresa: trip.empresa || '',
      producto: trip.producto,
      tonelaje: kg.toString(),
      valorPago: Math.round(parseFloat(trip.valorPago) || 0).toString(),
      precioKg: calculatedPriceKg,
      driverId: trip.driverId,
      vehicleId: trip.vehicleId,
      consumoAcpm: trip.consumoAcpm ? trip.consumoAcpm.toString() : '0',
      usoFerry: trip.usoFerry || false,
      porcentajeConductor: trip.porcentajeConductor ? trip.porcentajeConductor.toString() : '1.00',
      valorAcpm: trip.valorAcpm ? Math.round(parseFloat(trip.valorAcpm) || 0).toString() : '0',
      valorFerry: trip.valorFerry ? Math.round(parseFloat(trip.valorFerry) || 0).toString() : '0'
    });
    
    setShowModal(true);
  };

  const handleDelete = (id) => {
    setConfirmModal({
      show: true,
      title: 'Eliminar Planilla de Viaje',
      message: '¿Estás seguro de eliminar esta planilla de viaje? Esta acción es irreversible.',
      onConfirm: async () => {
        try {
          await api.delete(`/viajes/${id}`);
          fetchData();
        } catch (err) {
          alert(err.response?.data?.error || 'Error al eliminar el viaje');
        }
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const payload = {
        ticket: parseInt(formData.ticket, 10),
        fecha: formData.fecha,
        origen: formData.origen,
        destino: formData.destino || null,
        empresa: formData.empresa || null,
        producto: formData.producto,
        tonelaje: parseFloat(formData.tonelaje) / 1000,
        consumoAcpm: parseFloat(formData.consumoAcpm) || 0,
        usoFerry: formData.usoFerry,
        porcentajeConductor: parseFloat(formData.porcentajeConductor) || 1.00,
        valorAcpm: parseFloat(formData.valorAcpm) || 0,
        valorFerry: parseFloat(formData.valorFerry) || 0,
        driverId: formData.driverId,
        vehicleId: formData.vehicleId,
      };

      payload.valorPago = getCalculatedPayment();
      
      if (isEditing) {
        await api.put(`/viajes/${editingId}`, payload);
      } else {
        await api.post('/viajes', payload);
      }
      
      setShowModal(false);
      fetchData();
      setIsEditing(false);
      setEditingId(null);
      setFormData(getInitialFormData());
    } catch (error) {
      setError(error.response?.data?.error || 'Error al guardar el viaje');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Registro de Despachos (Viajes)</h4>
          <p className="text-muted small">Visualiza e ingresa las planillas de los conductores registradas al final del periodo.</p>
        </div>
        {/* HIDE nuevo viaje button if integrated in the general Dashboard */}
        {!isDashboard && (
          <button 
            className="btn btn-primary d-flex align-items-center gap-2"
            onClick={handleOpenCreateModal}
          >
            <Plus size={20} /> Nuevo Viaje
          </button>
        )}
      </div>

      {/* Tabla de Viajes */}
      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
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
                <th className="py-3 text-secondary small text-uppercase fw-bold">Valor Flete</th>
                <th className="py-3 text-secondary small text-uppercase fw-bold">Conductor</th>
                <th className="py-3 text-secondary small text-uppercase fw-bold">Pago Cond.</th>
                <th className="py-3 text-secondary small text-uppercase fw-bold">Gastos</th>
                <th className="py-3 text-secondary small text-uppercase fw-bold">Margen Neto</th>
                {isAdmin() && <th className="py-3 text-secondary small text-uppercase fw-bold text-end pe-4">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isAdmin() ? 13 : 12} className="text-center py-5">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                    Cargando viajes registrados...
                  </td>
                </tr>
              ) : trips.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin() ? 13 : 12} className="text-center py-5 text-muted">No se encontraron registros de viajes.</td>
                </tr>
              ) : (
                trips.map((trip) => {
                  const driverVal = Number(trip.valorConductor || 0);
                  const acpmVal = Number(trip.valorAcpm || 0);
                  const ferryVal = Number(trip.valorFerry || 0);
                  const totalExpenses = driverVal + acpmVal + ferryVal;
                  const netUtility = Number(trip.valorPago) - totalExpenses;

                  return (
                    <tr key={trip.id}>
                      <td className="px-4 fw-bold text-primary">#{trip.ticket}</td>
                      <td>{new Date(trip.fecha).toLocaleDateString(undefined, { timeZone: 'UTC' })}</td>
                      <td><span className="badge bg-light text-dark border">{trip.vehicle?.placa}</span></td>
                      <td className="small fw-medium">
                        {trip.origen} 
                        {trip.destino ? <span className="text-secondary"> &rarr; {trip.destino}</span> : ''}
                      </td>
                      <td className="text-muted small">{trip.empresa || 'N/A'}</td>
                      <td>
                        <span className={`badge px-2 py-1 rounded-pill ${trip.producto === 'FRUTO' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning-emphasis'}`}>
                          {trip.producto}
                        </span>
                      </td>
                      <td className="small">{trip.tonelaje} Ton</td>
                      <td className="fw-bold text-dark small">${Number(trip.valorPago).toLocaleString()}</td>
                      <td className="small">{trip.driver?.primerNombre} {trip.driver?.primerApellido}</td>
                      <td className="text-success small fw-semibold">
                        ${driverVal.toLocaleString()} <small className="text-muted">({Number(trip.porcentajeConductor || 1.0)}%)</small>
                      </td>
                      <td className="text-danger small">${totalExpenses.toLocaleString()}</td>
                      <td className={`fw-bold small ${netUtility >= 0 ? 'text-success' : 'text-danger'}`}>
                        ${netUtility.toLocaleString()}
                      </td>
                      {isAdmin() && (
                        <td className="text-end pe-4">
                          <button 
                            className="btn btn-link text-primary p-0 me-3" 
                            onClick={() => handleEditClick(trip)} 
                            title="Editar Viaje"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            className="btn btn-link text-danger p-0" 
                            onClick={() => handleDelete(trip.id)} 
                            title="Eliminar Viaje"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Creación */}
      {showModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title d-flex align-items-center gap-2">
                  {isEditing ? <Edit size={20} /> : <Plus size={20} />} 
                  {isEditing ? 'Editar Planilla de Viaje' : 'Registrar Nueva Planilla de Viaje'}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  {error && (
                    <div className="alert alert-danger d-flex align-items-center gap-2">
                      <AlertCircle size={20} /> {error}
                    </div>
                  )}
                  
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Número de Ticket *</label>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        pattern="[0-9]*"
                        name="ticket" 
                        className="form-control" 
                        placeholder="Ej: 14529" 
                        value={formData.ticket} 
                        onChange={handleInputChange} 
                        required 
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Fecha de Operación *</label>
                      <input 
                        type="date" 
                        name="fecha" 
                        className="form-control" 
                        value={formData.fecha} 
                        onChange={handleInputChange} 
                        required 
                      />
                    </div>

                    {/* RUTA (ORIGEN Y DESTINO SEPARADOS) */}
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Origen / Punto de Carga *</label>
                      <input 
                        type="text" 
                        name="origen" 
                        className="form-control" 
                        placeholder="Ej: Extractora-Gloria" 
                        value={formData.origen} 
                        onChange={handleInputChange} 
                        required 
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Destino / Punto de Descarga *</label>
                      <input 
                        type="text" 
                        name="destino" 
                        className="form-control" 
                        placeholder="Ej: Hacienda-Gloria" 
                        value={formData.destino} 
                        onChange={handleInputChange} 
                        required 
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Empresa / Cliente</label>
                      <input 
                        type="text" 
                        name="empresa" 
                        className="form-control" 
                        placeholder="Ej: EXTRACTORA - GLORIA" 
                        value={formData.empresa} 
                        onChange={handleInputChange} 
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Porcentaje Conductor (%) *</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        min="0"
                        onKeyDown={handleKeyDownPositive}
                        name="porcentajeConductor" 
                        className="form-control" 
                        placeholder="Ej: 1.00" 
                        value={formData.porcentajeConductor} 
                        onChange={handleInputChange} 
                        required 
                      />
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Conductor Responsable *</label>
                      <select name="driverId" className="form-select" value={formData.driverId} onChange={handleInputChange} required>
                        <option value="">Seleccione Conductor...</option>
                        {drivers.map(d => (
                          <option key={d.id} value={d.id}>{d.primerNombre} {d.primerApellido} ({d.cedula})</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Vehículo Asignado *</label>
                      <select name="vehicleId" className="form-select" value={formData.vehicleId} onChange={handleInputChange} required>
                        <option value="">Seleccione Vehículo...</option>
                        {vehicles.map(v => (
                          <option key={v.id} value={v.id}>{v.placa} - {v.marca} ({v.capacidad} Ton)</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-12">
                      <label className="form-label small fw-bold">Producto Transportado *</label>
                      <select name="producto" className="form-select" value={formData.producto} onChange={handleInputChange} required>
                        <option value="FRUTO">FRUTO (Fruta de Palma)</option>
                        <option value="COMPOST">COMPOST (Abono orgánico)</option>
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-bold">Kilogramos Reales (kg) *</label>
                      <input 
                        type="number" 
                        step="1" 
                        min="0"
                        onKeyDown={handleKeyDownPositive}
                        name="tonelaje" 
                        className="form-control fw-bold" 
                        placeholder="Ej: 8540" 
                        value={formData.tonelaje} 
                        onChange={handleInputChange} 
                        required 
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold">Consumo ACPM (Galones)</label>
                      <input 
                        type="number" 
                        step="0.1" 
                        min="0"
                        onKeyDown={handleKeyDownPositive}
                        name="consumoAcpm" 
                        className="form-control" 
                        placeholder="Ej: 15.0"
                        value={formData.consumoAcpm} 
                        onChange={handleInputChange} 
                      />
                    </div>
                    <div className="col-md-4 d-flex align-items-center pt-4">
                      <div className="form-check form-switch">
                        <input 
                          type="checkbox" 
                          name="usoFerry" 
                          className="form-check-input" 
                          id="usoFerrySwitch" 
                          checked={formData.usoFerry} 
                          onChange={handleInputChange} 
                        />
                        <label className="form-check-label small fw-bold" htmlFor="usoFerrySwitch">¿Requiere Cruce de Ferry?</label>
                      </div>
                    </div>

                    {/* COSTOS FINANCIEROS REALES */}
                    <div className="col-md-6">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <label className="form-label small fw-bold m-0">Costo ACPM Real (COP)</label>
                        <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-2 py-0.5 small cursor-pointer" onClick={() => setFormData(prev => ({ ...prev, valorAcpm: localStorage.getItem('defaultAcpm') || '0' }))} title="Haga clic para aplicar el valor configurado por defecto" style={{ cursor: 'pointer', fontSize: '0.75rem' }}>
                          Defecto: ${formatCurrencyCOP(localStorage.getItem('defaultAcpm') || '0')}
                        </span>
                      </div>
                      <div className="input-group">
                        <span className="input-group-text">$</span>
                        <input 
                          type="text" 
                          name="valorAcpm" 
                          className="form-control text-end fw-semibold" 
                          placeholder="Ej: 349.291" 
                          value={formatCurrencyCOP(formData.valorAcpm)} 
                          onChange={handleInputChange} 
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <label className="form-label small fw-bold m-0">Costo Ferry Real (COP)</label>
                        <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-2 py-0.5 small cursor-pointer" onClick={() => formData.usoFerry && setFormData(prev => ({ ...prev, valorFerry: localStorage.getItem('defaultFerry') || '0' }))} title="Haga clic para aplicar el valor configurado por defecto" style={{ cursor: formData.usoFerry ? 'pointer' : 'not-allowed', opacity: formData.usoFerry ? 1 : 0.5, fontSize: '0.75rem' }}>
                          Defecto: ${formatCurrencyCOP(localStorage.getItem('defaultFerry') || '0')}
                        </span>
                      </div>
                      <div className="input-group">
                        <span className="input-group-text">$</span>
                        <input 
                          type="text" 
                          name="valorFerry" 
                          className="form-control text-end fw-semibold" 
                          placeholder={formData.usoFerry ? "Ej: 220.000" : "Bloqueado (Active Ferry)"} 
                          value={formatCurrencyCOP(formData.valorFerry)} 
                          onChange={handleInputChange} 
                          disabled={!formData.usoFerry}
                        />
                      </div>
                    </div>

                    {/* DYNAMIC PRICE & MARGIN PREVIEW SECTION */}
                    <div className="col-12 mt-4 p-3 bg-light rounded border border-light-subtle">
                      <div className="row g-3">
                        <div className="col-md-6">
                          <div>
                            {formData.producto === 'FRUTO' ? (
                              <>
                                <span className="badge bg-success mb-1">CÁLCULO AUTOMÁTICO (KG &rarr; PRECIO KILO)</span>
                                <h6 className="m-0 fw-bold mb-1">Precio por Kilogramo (Fruta)</h6>
                                <p className="text-muted small mb-2">Ingrese el valor pactado por kilo. El sistema calculará el flete y mostrará la equivalencia corporativa.</p>
                                <div className="mt-2">
                                  <div className="d-flex justify-content-between align-items-center mb-2">
                                    <label className="form-label small fw-bold text-success m-0">Precio por Kg de Fruta (COP) *</label>
                                    <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-0.5 small cursor-pointer" onClick={() => setFormData(prev => ({ ...prev, precioKg: localStorage.getItem('defaultPriceKg') || '100' }))} title="Haga clic para aplicar el valor configurado por defecto" style={{ cursor: 'pointer', fontSize: '0.75rem' }}>
                                      Defecto: ${formatCurrencyCOP(localStorage.getItem('defaultPriceKg') || '100')}
                                    </span>
                                  </div>
                                  <div className="input-group mb-2">
                                    <span className="input-group-text bg-success text-white">$</span>
                                    <input 
                                      type="text" 
                                      name="precioKg" 
                                      className="form-control fw-bold text-end" 
                                      placeholder="Ej: 130" 
                                      value={formatCurrencyCOP(formData.precioKg)} 
                                      onChange={handleInputChange} 
                                      required={formData.producto === 'FRUTO'}
                                    />
                                    <span className="input-group-text bg-light text-muted">/ kg</span>
                                  </div>

                                  <div className="bg-white p-2 rounded border border-light-subtle small mt-2">
                                    <div className="d-flex justify-content-between mb-1">
                                      <span className="text-muted">Cantidad a facturar:</span>
                                      <span className="fw-semibold text-dark">
                                        {Number(formData.tonelaje || 0).toLocaleString()} kg ({((parseFloat(formData.tonelaje) || 0) / 1000).toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })} Tons)
                                      </span>
                                    </div>
                                    <div className="d-flex justify-content-between mb-1">
                                      <span className="text-muted">Precio por Kilogramo:</span>
                                      <span className="fw-semibold text-dark">
                                        ${formatCurrencyCOP(formData.precioKg)} COP / kg
                                      </span>
                                    </div>
                                    <div className="d-flex justify-content-between mb-1 text-secondary">
                                      <span className="small">Equivalente por Tonelada:</span>
                                      <span className="small fw-semibold">
                                        ${formatCurrencyCOP(Number(formData.precioKg || 0) * 1000)} COP / Ton
                                      </span>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
                                      <span className="text-muted fw-bold">Valor de Flete Total:</span>
                                      <span className="badge bg-success-subtle text-success fw-bold fs-6">
                                        ${Number(getCalculatedPayment()).toLocaleString()} COP
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <>
                                <span className="badge bg-primary mb-1">PRECIO MANUAL ESTIPULADO</span>
                                <h6 className="m-0 fw-bold mb-1">Valor de Flete Pactado</h6>
                                <p className="text-muted small mb-2">Las tarifas se calculan de forma manual y se ingresan directamente al sistema.</p>
                                <div className="mt-2">
                                  <label className="form-label small fw-bold text-primary">Costo Flete Pactado (COP) *</label>
                                  <div className="input-group">
                                    <span className="input-group-text">$</span>
                                    <input 
                                      type="text" 
                                      name="valorPago" 
                                      className="form-control fw-bold text-end" 
                                      placeholder="Ej: 450.000" 
                                      value={formatCurrencyCOP(formData.valorPago)} 
                                      onChange={handleInputChange} 
                                      required={formData.producto === 'COMPOST'}
                                    />
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* LIVE RENTABILITY PREVIEWER */}
                        <div className="col-md-6 border-start ps-4">
                          <h6 className="fw-bold mb-2 text-secondary small text-uppercase">Previsualización de Rentabilidad</h6>
                          
                          <div className="d-flex justify-content-between mb-1 small">
                            <span className="text-muted">Ingreso Flete:</span>
                            <span className="fw-semibold text-dark">${Number(getCalculatedPayment()).toLocaleString()}</span>
                          </div>
                          
                          <div className="d-flex justify-content-between mb-1 small">
                            <span className="text-muted">Pago Conductor ({formData.porcentajeConductor || 1}%):</span>
                            <span className="text-danger fw-semibold">-${Number(getCalculatedPayment() * (parseFloat(formData.porcentajeConductor || 1) / 100)).toLocaleString()}</span>
                          </div>
                          
                          <div className="d-flex justify-content-between mb-1 small">
                            <span className="text-muted">Gasto ACPM (COP):</span>
                            <span className="text-danger fw-semibold">-${Number(formData.valorAcpm || 0).toLocaleString()}</span>
                          </div>
                          
                          <div className="d-flex justify-content-between mb-2 small">
                            <span className="text-muted">Gasto Ferry (COP):</span>
                            <span className="text-danger fw-semibold">-${Number(formData.valorFerry || 0).toLocaleString()}</span>
                          </div>
                          
                          <hr className="my-2" />
                          
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="fw-bold text-secondary">Margen Neto (Utilidad):</span>
                            <span className={`fw-bold fs-5 ${getCalculatedPayment() - (getCalculatedPayment() * (parseFloat(formData.porcentajeConductor || 1) / 100) + parseFloat(formData.valorAcpm || 0) + parseFloat(formData.valorFerry || 0)) >= 0 ? 'text-success' : 'text-danger'}`}>
                              ${Number(getCalculatedPayment() - (getCalculatedPayment() * (parseFloat(formData.porcentajeConductor || 1) / 100) + parseFloat(formData.valorAcpm || 0) + parseFloat(formData.valorFerry || 0))).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary d-flex align-items-center gap-2">
                    <Save size={18} /> Guardar Planilla
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación */}
      {confirmModal.show && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '400px' }}>
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-dark">{confirmModal.title}</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                ></button>
              </div>
              <div className="modal-body py-3">
                <p className="text-secondary mb-0" style={{ fontSize: '0.95rem' }}>{confirmModal.message}</p>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button 
                  type="button" 
                  className="btn btn-light fw-semibold" 
                  onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger fw-semibold" 
                  onClick={() => {
                    confirmModal.onConfirm();
                    setConfirmModal({ ...confirmModal, show: false });
                  }}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Trips;
