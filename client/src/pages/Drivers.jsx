import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, UserCircle, Save, Trash2, Phone, CreditCard, Edit, RotateCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Drivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showInactive, setShowInactive] = useState(false);
  const { isAdmin } = useAuth();
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: null
  });
  
  const [formData, setFormData] = useState({
    cedula: '',
    primerNombre: '',
    segundoNombre: '',
    primerApellido: '',
    segundoApellido: '',
    telefono: ''
  });

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/conductores?includeDeleted=true');
      setDrivers(data);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Sanitización en caliente de cédula y teléfono (solo números)
    if (name === 'cedula' || name === 'telefono') {
      const numericVal = value.replace(/\D/g, '');
      setFormData({ ...formData, [name]: numericVal });
      return;
    }
    
    // Sanitización en caliente de nombres (solo letras y espacios)
    if (['primerNombre', 'segundoNombre', 'primerApellido', 'segundoApellido'].includes(name)) {
      const alphaVal = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
      setFormData({ ...formData, [name]: alphaVal });
      return;
    }
    
    setFormData({ ...formData, [name]: value });
  };

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setError('');
    setFormData({ cedula: '', primerNombre: '', segundoNombre: '', primerApellido: '', segundoApellido: '', telefono: '' });
    setShowModal(true);
  };

  const handleEditClick = (driver) => {
    setIsEditing(true);
    setEditingId(driver.id);
    setError('');
    setFormData({
      cedula: driver.cedula,
      primerNombre: driver.primerNombre,
      segundoNombre: driver.segundoNombre || '',
      primerApellido: driver.primerApellido,
      segundoApellido: driver.segundoApellido || '',
      telefono: driver.telefono || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isEditing) {
        await api.put(`/conductores/${editingId}`, formData);
      } else {
        await api.post('/conductores', formData);
      }
      setShowModal(false);
      fetchDrivers();
      setFormData({ cedula: '', primerNombre: '', segundoNombre: '', primerApellido: '', segundoApellido: '', telefono: '' });
      setIsEditing(false);
      setEditingId(null);
    } catch (error) {
      setError(error.response?.data?.error || 'Error al guardar el conductor');
    }
  };

  const handleDelete = (id) => {
    setConfirmModal({
      show: true,
      title: 'Desactivar Conductor',
      message: '¿Estás seguro de desactivar este conductor?',
      onConfirm: async () => {
        try {
          await api.delete(`/conductores/${id}`);
          fetchDrivers();
        } catch (error) {
          alert(error.response?.data?.error || 'Error al eliminar');
        }
      }
    });
  };

  const handleRestore = async (id) => {
    try {
      await api.put(`/conductores/${id}`, { activo: true, deletedAt: null });
      fetchDrivers();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al reactivar el conductor');
    }
  };


  const displayedDrivers = showInactive 
    ? drivers 
    : drivers.filter(d => d.activo);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Cuerpo de Conductores</h4>
          <p className="text-muted small">Gestión de personal operativo y contacto</p>
        </div>
        <div className="d-flex gap-3 align-items-center">
          <div className="form-check form-switch m-0 d-flex align-items-center gap-2">
            <input 
              type="checkbox" 
              className="form-check-input cursor-pointer" 
              id="showInactiveSwitch" 
              checked={showInactive} 
              onChange={(e) => setShowInactive(e.target.checked)} 
            />
            <label className="form-check-label small fw-bold text-secondary cursor-pointer" htmlFor="showInactiveSwitch">Mostrar Inactivos</label>
          </div>
          {isAdmin() && (
            <button 
              className="btn btn-primary d-flex align-items-center gap-2 shadow-sm"
              onClick={handleOpenCreateModal}
            >
              <Plus size={20} /> Nuevo Conductor
            </button>
          )}
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th className="px-4 py-3 text-secondary small text-uppercase fw-bold">Cédula</th>
                <th className="py-3 text-secondary small text-uppercase fw-bold">Nombre Completo</th>
                <th className="py-3 text-secondary small text-uppercase fw-bold">Teléfono</th>
                <th className="py-3 text-secondary small text-uppercase fw-bold">Estado</th>
                {isAdmin() && <th className="py-3 text-secondary small text-uppercase fw-bold text-end pe-4">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={isAdmin() ? 5 : 4} className="text-center py-5">Cargando conductores...</td></tr>
              ) : displayedDrivers.length === 0 ? (
                <tr><td colSpan={isAdmin() ? 5 : 4} className="text-center py-5 text-muted">No se encontraron conductores.</td></tr>
              ) : (
                displayedDrivers.map((d) => (
                  <tr key={d.id}>
                    <td className="px-4 fw-bold text-primary">{d.cedula}</td>
                    <td>{d.primerNombre} {d.segundoNombre} {d.primerApellido} {d.segundoApellido}</td>
                    <td><Phone size={14} className="me-2 text-muted" /> {d.telefono || 'N/A'}</td>
                    <td>
                      <span className={`badge-status ${d.activo ? 'bg-success text-white' : 'bg-danger text-white'}`}>
                        {d.activo ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                    </td>
                    {isAdmin() && (
                      <td className="text-end pe-4">
                        <button className="btn btn-link text-primary p-0 me-3" onClick={() => handleEditClick(d)} title="Editar Conductor">
                          <Edit size={18} />
                        </button>
                        {d.activo ? (
                          <button className="btn btn-link text-danger p-0" onClick={() => handleDelete(d.id)} title="Desactivar Conductor">
                            <Trash2 size={18} />
                          </button>
                        ) : (
                          <button className="btn btn-link text-success p-0" onClick={() => handleRestore(d.id)} title="Reactivar Conductor">
                            <RotateCcw size={18} />
                          </button>
                        )}
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
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title d-flex align-items-center gap-2">
                  <UserCircle size={20} /> 
                  {isEditing ? 'Editar Conductor' : 'Registrar Conductor'}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  {error && <div className="alert alert-danger py-2 small">{error}</div>}
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Cédula</label>
                      <input type="text" name="cedula" className="form-control" value={formData.cedula} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Teléfono</label>
                      <input type="text" name="telefono" className="form-control" value={formData.telefono} onChange={handleInputChange} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Primer Nombre</label>
                      <input type="text" name="primerNombre" className="form-control" value={formData.primerNombre} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Segundo Nombre</label>
                      <input type="text" name="segundoNombre" className="form-control" value={formData.segundoNombre} onChange={handleInputChange} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Primer Apellido</label>
                      <input type="text" name="primerApellido" className="form-control" value={formData.primerApellido} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Segundo Apellido</label>
                      <input type="text" name="segundoApellido" className="form-control" value={formData.segundoApellido} onChange={handleInputChange} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary d-flex align-items-center gap-2"><Save size={18} /> Guardar Conductor</button>
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

export default Drivers;
