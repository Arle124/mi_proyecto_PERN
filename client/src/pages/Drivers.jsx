import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, UserCircle, Save, Trash2, Phone, CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Drivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const { isAdmin } = useAuth();
  
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
      const { data } = await api.get('/conductores');
      setDrivers(data);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/conductores', formData);
      setShowModal(false);
      fetchDrivers();
      setFormData({ cedula: '', primerNombre: '', segundoNombre: '', primerApellido: '', segundoApellido: '', telefono: '' });
    } catch (error) {
      setError(error.response?.data?.error || 'Error al registrar el conductor');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de desactivar este conductor?')) return;
    try {
      await api.delete(`/conductores/${id}`);
      fetchDrivers();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al eliminar');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Cuerpo de Conductores</h4>
          <p className="text-muted small">Gestión de personal operativo y contacto</p>
        </div>
        <button 
          className="btn btn-primary d-flex align-items-center gap-2"
          onClick={() => setShowModal(true)}
        >
          <Plus size={20} /> Nuevo Conductor
        </button>
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
              ) : drivers.length === 0 ? (
                <tr><td colSpan={isAdmin() ? 5 : 4} className="text-center py-5 text-muted">No hay conductores registrados.</td></tr>
              ) : (
                drivers.map((d) => (
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
                        <button className="btn btn-link text-danger p-0" onClick={() => handleDelete(d.id)}>
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
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title d-flex align-items-center gap-2"><UserCircle size={20} /> Registrar Conductor</h5>
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
    </div>
  );
};

export default Drivers;
