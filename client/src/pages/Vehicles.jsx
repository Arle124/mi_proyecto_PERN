import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Search, Truck, Save, AlertCircle, Trash2, Edit } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const { isAdmin } = useAuth();
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: null
  });
  
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
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Sanitización en caliente de placa (remover no-alfanuméricos, forzar mayúsculas y máximo 6 caracteres)
    if (name === 'placa') {
      const sanitizedPlaca = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
      setFormData({ ...formData, placa: sanitizedPlaca });
      return;
    }
    
    // Sanitización en caliente de capacidad (solo números y un único punto decimal)
    if (name === 'capacidad') {
      let numericDecimal = value.replace(/[^0-9.]/g, '');
      const parts = numericDecimal.split('.');
      if (parts.length > 2) {
        numericDecimal = `${parts[0]}.${parts.slice(1).join('')}`;
      }
      setFormData({ ...formData, capacidad: numericDecimal });
      return;
    }
    
    // Sanitización de marca y modelo (solo caracteres limpios)
    if (name === 'marca' || name === 'modelo') {
      const cleanVal = value.replace(/[^a-zA-Z0-9\s.-]/g, '');
      setFormData({ ...formData, [name]: cleanVal });
      return;
    }
    
    setFormData({ ...formData, [name]: value });
  };

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setError('');
    setFormData({ placa: '', marca: '', modelo: '', capacidad: '', estado: 'DISPONIBLE' });
    setShowModal(true);
  };

  const handleEditClick = (vehicle) => {
    setIsEditing(true);
    setEditingId(vehicle.id);
    setError('');
    setFormData({
      placa: vehicle.placa,
      marca: vehicle.marca,
      modelo: vehicle.modelo,
      capacidad: vehicle.capacidad,
      estado: vehicle.estado
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = { ...formData, capacidad: parseFloat(formData.capacidad) };
      if (isEditing) {
        await api.put(`/vehiculos/${editingId}`, payload);
      } else {
        await api.post('/vehiculos', payload);
      }
      setShowModal(false);
      fetchVehicles();
      setFormData({ placa: '', marca: '', modelo: '', capacidad: '', estado: 'DISPONIBLE' });
      setIsEditing(false);
      setEditingId(null);
    } catch (error) {
      setError(error.response?.data?.error || 'Error al guardar el vehículo');
    }
  };

  const handleDelete = (id) => {
    setConfirmModal({
      show: true,
      title: 'Desactivar Vehículo',
      message: '¿Estás seguro de desactivar este vehículo?',
      onConfirm: async () => {
        try {
          await api.delete(`/vehiculos/${id}`);
          fetchVehicles();
        } catch (error) {
          alert(error.response?.data?.error || 'Error al eliminar');
        }
      }
    });
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
          onClick={handleOpenCreateModal}
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
                {isAdmin() && <th className="py-3 text-secondary small text-uppercase fw-bold text-end pe-4">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={isAdmin() ? 5 : 4} className="text-center py-5">Cargando flota...</td></tr>
              ) : vehicles.length === 0 ? (
                <tr><td colSpan={isAdmin() ? 5 : 4} className="text-center py-5 text-muted">No hay vehículos registrados.</td></tr>
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
                    {isAdmin() && (
                      <td className="text-end pe-4">
                        <button className="btn btn-link text-primary p-0 me-3" onClick={() => handleEditClick(v)} title="Editar Vehículo">
                          <Edit size={18} />
                        </button>
                        <button className="btn btn-link text-danger p-0" onClick={() => handleDelete(v.id)} title="Desactivar Vehículo">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    )}
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
                <h5 className="modal-title d-flex align-items-center gap-2">
                  <Truck size={20} /> 
                  {isEditing ? 'Editar Vehículo' : 'Registrar Vehículo'}
                </h5>
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

export default Vehicles;
