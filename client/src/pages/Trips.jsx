import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Save, AlertCircle, X } from 'lucide-react';

const Trips = ({ isDashboard = false }) => {
  const [trips, setTrips] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [tariffs, setTariffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  
  // Valor por kg de Fruto cargado de base de datos
  const [valorKgFruto, setValorKgFruto] = useState(25); // Valor por defecto

  // Estado del formulario
  const [formData, setFormData] = useState({
    ticket: '',
    fecha: new Date().toISOString().split('T')[0],
    origen: '',
    producto: 'FRUTO',
    tipoPago: 'TRANSFERENCIA',
    tonelaje: '',
    valorPago: '', // Manual para COMPOST
    driverId: '',
    vehicleId: '',
    consumoAcpm: 0,
    usoFerry: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tripsRes, driversRes, vehiclesRes, tariffsRes] = await Promise.all([
        api.get('/viajes'),
        api.get('/conductores'),
        api.get('/vehiculos'),
        api.get('/tarifas')
      ]);
      setTrips(tripsRes.data);
      setDrivers(driversRes.data);
      setVehicles(vehiclesRes.data); // No filtering by status, late planillas are flexible!
      
      const tariffsData = tariffsRes.data;
      setTariffs(tariffsData);
      
      // Buscar el valor del Kg para FRUTO
      const fruitTariff = tariffsData.find(t => t.producto === 'FRUTO');
      if (fruitTariff) {
        setValorKgFruto(Number(fruitTariff.valorKg));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'ticket') {
      // Solo permite números positivos, eliminando guiones, espacios y cualquier letra o carácter especial
      const positiveInteger = value.replace(/\D/g, '');
      setFormData({
        ...formData,
        ticket: positiveInteger
      });
      return;
    }
    
    if (name === 'tonelaje' || name === 'consumoAcpm' || name === 'valorPago') {
      // Elimina cualquier signo negativo y caracteres raros (permitiendo números y punto decimal)
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

    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Bloquea signos negativos, signos positivos y notación científica en inputs de número
  const handleKeyDownPositive = (e) => {
    if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
      e.preventDefault();
    }
  };

  // Cálculo del valor del pago en vivo
  const getCalculatedPayment = () => {
    if (formData.producto === 'FRUTO') {
      const tons = parseFloat(formData.tonelaje) || 0;
      return tons * 1000 * valorKgFruto;
    }
    // Para compost retorna el valor ingresado
    return parseFloat(formData.valorPago) || 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const payload = {
        ticket: parseInt(formData.ticket, 10),
        fecha: formData.fecha,
        origen: formData.origen,
        producto: formData.producto,
        tipoPago: formData.tipoPago,
        tonelaje: parseFloat(formData.tonelaje),
        consumoAcpm: parseFloat(formData.consumoAcpm) || 0,
        usoFerry: formData.usoFerry,
        driverId: formData.driverId,
        vehicleId: formData.vehicleId,
      };

      if (formData.producto === 'COMPOST') {
        payload.valorPago = parseFloat(formData.valorPago);
      }
      
      await api.post('/viajes', payload);
      setShowModal(false);
      fetchData(); // Recargar lista
      
      // Reset form
      setFormData({
        ticket: '',
        fecha: new Date().toISOString().split('T')[0],
        origen: '',
        producto: 'FRUTO',
        tipoPago: 'TRANSFERENCIA',
        tonelaje: '',
        valorPago: '',
        driverId: '',
        vehicleId: '',
        consumoAcpm: 0,
        usoFerry: false
      });
    } catch (error) {
      setError(error.response?.data?.error || 'Error al registrar el viaje');
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
            onClick={() => setShowModal(true)}
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
                <th className="py-3 text-secondary small text-uppercase fw-bold">Conductor</th>
                <th className="py-3 text-secondary small text-uppercase fw-bold">Vehículo</th>
                <th className="py-3 text-secondary small text-uppercase fw-bold">Producto</th>
                <th className="py-3 text-secondary small text-uppercase fw-bold">Tonelaje</th>
                <th className="py-3 text-secondary small text-uppercase fw-bold">Valor Pago</th>
                <th className="py-3 text-secondary small text-uppercase fw-bold">Registrado Por</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-5">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                    Cargando viajes registrados...
                  </td>
                </tr>
              ) : trips.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-5 text-muted">No se encontraron registros de viajes.</td>
                </tr>
              ) : (
                trips.map((trip) => (
                  <tr key={trip.id}>
                    <td className="px-4 fw-bold text-primary">#{trip.ticket}</td>
                    <td>{new Date(trip.fecha).toLocaleDateString(undefined, { timeZone: 'UTC' })}</td>
                    <td>{trip.driver?.primerNombre} {trip.driver?.primerApellido}</td>
                    <td><span className="badge bg-light text-dark border">{trip.vehicle?.placa}</span></td>
                    <td>
                      <span className={`badge px-3 py-1.5 rounded-pill ${trip.producto === 'FRUTO' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning-emphasis'}`}>
                        {trip.producto}
                      </span>
                    </td>
                    <td>{trip.tonelaje} Ton</td>
                    <td className="fw-bold">${Number(trip.valorPago).toLocaleString()}</td>
                    <td className="text-muted small">
                      {trip.registradoPor?.primerNombre} {trip.registradoPor?.primerApellido}
                    </td>
                  </tr>
                ))
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
                  <Plus size={20} /> Registrar Nueva Planilla de Viaje
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
                    <div className="col-md-12">
                      <label className="form-label small fw-bold">Ruta / Origen / Destino *</label>
                      <input 
                        type="text" 
                        name="origen" 
                        className="form-control" 
                        placeholder="Ej: Finca El Recreo -> Planta Central" 
                        value={formData.origen} 
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

                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Producto Transportado *</label>
                      <select name="producto" className="form-select" value={formData.producto} onChange={handleInputChange} required>
                        <option value="FRUTO">FRUTO (Fruta de Palma)</option>
                        <option value="COMPOST">COMPOST (Abono orgánico)</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Tipo de Pago *</label>
                      <select name="tipoPago" className="form-select" value={formData.tipoPago} onChange={handleInputChange} required disabled>
                        <option value="TRANSFERENCIA">TRANSFERENCIA bancaria (Requerido DIAN)</option>
                      </select>
                    </div>

                     <div className="col-md-4">
                      <label className="form-label small fw-bold">Tonelaje Real *</label>
                      <input 
                        type="number" 
                        step="0.001" 
                        min="0"
                        onKeyDown={handleKeyDownPositive}
                        name="tonelaje" 
                        className="form-control" 
                        placeholder="Ej: 8.540" 
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

                    {/* DYNAMIC PRICE SECTION */}
                    <div className="col-12 mt-4 p-3 bg-light rounded border border-light-subtle">
                      {formData.producto === 'FRUTO' ? (
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <span className="badge bg-success mb-1">CÁLCULO AUTOMÁTICO</span>
                            <h6 className="m-0 fw-bold">Fruto de Palma por Kilogramo</h6>
                            <small className="text-muted">Tarifa vigente configurada por kg: <strong>${valorKgFruto} COP</strong></small>
                          </div>
                          <div className="text-end">
                            <small className="text-secondary small fw-medium">Valor Total Liquidado</small>
                            <h4 className="m-0 fw-bold text-success">${Number(getCalculatedPayment()).toLocaleString()}</h4>
                          </div>
                        </div>
                      ) : (
                        <div className="row align-items-center">
                          <div className="col-md-6">
                            <span className="badge bg-warning text-dark mb-1">PRECIO MANUAL ESTIPULADO</span>
                            <h6 className="m-0 fw-bold">Compost (Abono Orgánico)</h6>
                            <small className="text-muted">Ingresa el valor total acordado con el cliente.</small>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small fw-bold text-primary">Valor Pactado (COP) *</label>
                            <div className="input-group">
                              <span className="input-group-text">$</span>
                              <input 
                                type="number" 
                                min="0"
                                onKeyDown={handleKeyDownPositive}
                                name="valorPago" 
                                className="form-control fw-bold text-end" 
                                placeholder="Ej: 450000" 
                                value={formData.valorPago} 
                                onChange={handleInputChange} 
                                required={formData.producto === 'COMPOST'} 
                              />
                            </div>
                          </div>
                        </div>
                      )}
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
    </div>
  );
};

export default Trips;
