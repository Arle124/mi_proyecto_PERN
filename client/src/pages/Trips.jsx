import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Search, Calendar, X, Save, AlertCircle } from 'lucide-react';

const Trips = () => {
  const [trips, setTrips] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    ticket: '',
    fecha: new Date().toISOString().split('T')[0],
    origen: '',
    tipoViaje: 'NORMAL',
    tipoPago: 'EFECTIVO',
    tonelaje: '',
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
      const [tripsRes, driversRes, vehiclesRes] = await Promise.all([
        api.get('/viajes'),
        api.get('/conductores'),
        api.get('/vehiculos')
      ]);
      setTrips(tripsRes.data);
      setDrivers(driversRes.data);
      setVehicles(vehiclesRes.data.filter(v => v.estado === 'DISPONIBLE'));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const payload = {
        ...formData,
        tonelaje: parseFloat(formData.tonelaje),
        consumoAcpm: parseFloat(formData.consumoAcpm)
      };
      
      await api.post('/viajes', payload);
      setShowModal(false);
      fetchData(); // Recargar lista
      // Reset form
      setFormData({
        ticket: '',
        fecha: new Date().toISOString().split('T')[0],
        origen: '',
        tipoViaje: 'NORMAL',
        tipoPago: 'EFECTIVO',
        tonelaje: '',
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
          <h4 className="fw-bold mb-1">Gestión de Viajes</h4>
          <p className="text-muted small">Visualiza y controla todos los despachos activos</p>
        </div>
        <button 
          className="btn btn-primary d-flex align-items-center gap-2"
          onClick={() => setShowModal(true)}
        >
          <Plus size={20} /> Nuevo Viaje
        </button>
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
                <th className="py-3 text-secondary small text-uppercase fw-bold">Tonelaje</th>
                <th className="py-3 text-secondary small text-uppercase fw-bold">Valor Pago</th>
                <th className="py-3 text-secondary small text-uppercase fw-bold">Tipo</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                    Cargando datos...
                  </td>
                </tr>
              ) : trips.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">No se encontraron viajes registrados.</td>
                </tr>
              ) : (
                trips.map((trip) => (
                  <tr key={trip.id}>
                    <td className="px-4 fw-medium text-primary">{trip.ticket}</td>
                    <td>{new Date(trip.fecha).toLocaleDateString()}</td>
                    <td>{trip.driver?.primerNombre} {trip.driver?.primerApellido}</td>
                    <td><span className="badge bg-light text-dark border">{trip.vehicle?.placa}</span></td>
                    <td>{trip.tonelaje} Ton</td>
                    <td className="fw-bold">${Number(trip.valorPago).toLocaleString()}</td>
                    <td>
                      <span className={`badge-status ${trip.tipoViaje === 'ESPECIAL' ? 'bg-warning text-dark' : 'bg-info text-white'}`}>
                        {trip.tipoViaje}
                      </span>
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
                  <Plus size={20} /> Registrar Nuevo Viaje
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
                      <label className="form-label small fw-bold">Número de Ticket</label>
                      <input type="text" name="ticket" className="form-control" value={formData.ticket} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Fecha del Viaje</label>
                      <input type="date" name="fecha" className="form-control" value={formData.fecha} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-12">
                      <label className="form-label small fw-bold">Origen / Destino</label>
                      <input type="text" name="origen" className="form-control" placeholder="Ej: Planta Central -> Sucursal Norte" value={formData.origen} onChange={handleInputChange} required />
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Conductor</label>
                      <select name="driverId" className="form-select" value={formData.driverId} onChange={handleInputChange} required>
                        <option value="">Seleccione Conductor...</option>
                        {drivers.map(d => (
                          <option key={d.id} value={d.id}>{d.primerNombre} {d.primerApellido} ({d.cedula})</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Vehículo (Disponible)</label>
                      <select name="vehicleId" className="form-select" value={formData.vehicleId} onChange={handleInputChange} required>
                        <option value="">Seleccione Vehículo...</option>
                        {vehicles.map(v => (
                          <option key={v.id} value={v.id}>{v.placa} - {v.marca} ({v.capacidad} Ton)</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-bold">Tonelaje Real</label>
                      <input type="number" step="0.01" name="tonelaje" className="form-control" value={formData.tonelaje} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold">Tipo de Viaje</label>
                      <select name="tipoViaje" className="form-select" value={formData.tipoViaje} onChange={handleInputChange}>
                        <option value="NORMAL">NORMAL</option>
                        <option value="ESPECIAL">ESPECIAL</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold">Tipo de Pago</label>
                      <select name="tipoPago" className="form-select" value={formData.tipoPago} onChange={handleInputChange}>
                        <option value="EFECTIVO">EFECTIVO</option>
                        <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                        <option value="CREDITO">CREDITO</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary d-flex align-items-center gap-2">
                    <Save size={18} /> Guardar Viaje
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
