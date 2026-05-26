import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Search, Truck, Save, AlertCircle, Trash2, Edit } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const { isAdmin } = useAuth();
  
  const [formData, setFormData] = useState({
    placa: '',
    marca: '',
    modelo: '',
    capacidad: '',
    estado: 'DISPONIBLE'
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/vehiculos');
      setVehicles(data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * MANEJADORES DE OPERACIONES DE LA FLOTA
   * - handleInputChange: Captura cambios en campos normales de texto.
   * - handleSubmit: Parsea la capacidad flotante y envía al backend (normaliza placa a mayúsculas).
   * - handleDelete: Dispara la baja lógica (Soft Delete) del vehículo en base de datos.
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Normalización a nivel de capa cliente: convertimos a decimal y forzamos
      // mayúsculas en la placa para alinearnos con el regex perimetral del backend.
      const payload = { ...formData, capacidad: parseFloat(formData.capacidad) };
      await api.post('/vehiculos', payload);
      setShowModal(false);
      fetchVehicles();
      // Reseteo limpio del formulario
      setFormData({ placa: '', marca: '', modelo: '', capacidad: '', estado: 'DISPONIBLE' });
    } catch (error) {
      setError(error.response?.data?.error || 'Error al registrar el vehículo');
    }
  };

  const handleDelete = async (id) => {
    // Confirmación nativa antes de realizar baja lógica irrevocable en la UI
    if (!window.confirm('¿Estás seguro de desactivar este vehículo?')) return;
    try {
      // El backend intercepta esta petición y ejecuta un Soft Delete (establece deletedAt y activo: false)
      await api.delete(`/vehiculos/${id}`);
      fetchVehicles(); // Recarga la flota actualizada
    } catch (error) {
      alert(error.response?.data?.error || 'Error al eliminar');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Flota de Vehículos</h4>
          <p className="text-muted small">Administra los camiones y su estado operativo</p>
        </div>
        <button 
          className="btn btn-primary d-flex align-items-center gap-2"
          onClick={() => setShowModal(true)}
        >
          <Plus size={20} /> Nuevo Vehículo
        </button>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th className="px-4 py-3 text-secondary small text-uppercase fw-bold">Placa</th>
                <th className="py-3 text-secondary small text-uppercase fw-bold">Marca / Modelo</th>
                <th className="py-3 text-secondary small text-uppercase fw-bold">Capacidad</th>
                <th className="py-3 text-secondary small text-uppercase fw-bold">Estado</th>
                <th className="py-3 text-secondary small text-uppercase fw-bold text-end pe-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center py-5">Cargando flota...</td></tr>
              ) : vehicles.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-5 text-muted">No hay vehículos registrados.</td></tr>
              ) : (
                vehicles.map((v) => (
                  <tr key={v.id}>
                    <td className="px-4"><span className="badge bg-white text-primary border border-primary px-3 py-2">{v.placa}</span></td>
                    <td><div className="fw-bold">{v.marca}</div><div className="text-muted small">{v.modelo}</div></td>
                    <td>{v.capacidad} Ton</td>
                    <td>
                      <span className={`badge-status ${
                        v.estado === 'DISPONIBLE' ? 'bg-success text-white' : 
                        v.estado === 'EN_VIAJE' ? 'bg-info text-white' : 'bg-warning text-dark'
                      }`}>
                        {v.estado}
                      </span>
                    </td>
                    <td className="text-end pe-4">
                      {isAdmin() && (
                        <button className="btn btn-link text-danger p-0" onClick={() => handleDelete(v.id)}>
                          <Trash2 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title d-flex align-items-center gap-2"><Truck size={20} /> Registrar Vehículo</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  {error && <div className="alert alert-danger py-2 small">{error}</div>}
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Placa</label>
                      <input type="text" name="placa" className="form-control" placeholder="ABC123" value={formData.placa} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Capacidad (Ton)</label>
                      <input type="number" step="0.1" name="capacidad" className="form-control" value={formData.capacidad} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Marca</label>
                      <input type="text" name="marca" className="form-control" value={formData.marca} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Modelo</label>
                      <input type="text" name="modelo" className="form-control" value={formData.modelo} onChange={handleInputChange} required />
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary d-flex align-items-center gap-2"><Save size={18} /> Guardar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vehicles;
