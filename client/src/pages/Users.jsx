import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Users as UsersIcon, Plus, Save, UserCheck, UserX, AlertCircle } from 'lucide-react';

const Users = () => {
  const { user, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  
  // Estado para el formulario de creación/edición
  const [formData, setFormData] = useState({
    primerNombre: '',
    segundoNombre: '',
    primerApellido: '',
    segundoApellido: '',
    correo: '',
    password: '',
    rol: 'OPERADOR',
  });

  useEffect(() => {
    if (isAdmin()) {
      fetchUsers();
    }
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/usuarios');
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Sanitización en caliente de nombres (solo letras y espacios)
    if (['primerNombre', 'segundoNombre', 'primerApellido', 'segundoApellido'].includes(name)) {
      const alphaVal = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
      setFormData({ ...formData, [name]: alphaVal });
      return;
    }
    
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validar robustez de contraseña en frontend para evitar rebotes de la API
    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (!/[0-9]/.test(formData.password)) {
      setError('La contraseña debe contener al menos un número.');
      return;
    }
    if (!/[^A-Za-z0-9]/.test(formData.password)) {
      setError('La contraseña debe contener al menos un carácter especial (ej. !@#$%^&*).');
      return;
    }

    try {
      await api.post('/usuarios', formData);
      setShowModal(false);
      fetchUsers();
      setFormData({
        primerNombre: '',
        segundoNombre: '',
        primerApellido: '',
        segundoApellido: '',
        correo: '',
        password: '',
        rol: 'OPERADOR',
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar el usuario');
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      // Toggle logic in DB via PUT
      await api.put(`/usuarios/${userId}`, { activo: !currentStatus });
      fetchUsers();
    } catch (err) {
      console.error('Error toggling user status:', err);
      const errMsg = err.response?.data?.error || 'No se pudo cambiar el estado del usuario';
      alert(errMsg);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/usuarios/${userId}`, { rol: newRole });
      fetchUsers();
    } catch (err) {
      console.error('Error changing user role:', err);
      const errMsg = err.response?.data?.error || 'No se pudo cambiar el rol del usuario';
      alert(errMsg);
    }
  };

  if (!isAdmin()) {
    return <div className="alert alert-danger p-3">Acceso restringido. Solo los administradores pueden ver y controlar esta sección.</div>;
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <UsersIcon className="text-primary" size={24} />
            Administración de Personal
          </h4>
          <p className="text-muted small">Registra nuevos trabajadores y controla sus permisos y estados operativos.</p>
        </div>
        <button 
          className="btn btn-primary d-flex align-items-center gap-2"
          onClick={() => setShowModal(true)}
        >
          <Plus size={20} /> Registrar Usuario
        </button>
      </div>

      {/* Tabla de Usuarios */}
      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th className="px-4 py-3 text-secondary small text-uppercase fw-bold">Nombre Completo</th>
                <th className="py-3 text-secondary small text-uppercase fw-bold">Correo Electrónico</th>
                <th className="py-3 text-secondary small text-uppercase fw-bold">Rol</th>
                <th className="py-3 text-secondary small text-uppercase fw-bold">Estado</th>
                <th className="py-3 text-secondary small text-uppercase fw-bold text-end px-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                    Cargando usuarios...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-5 text-muted">No hay usuarios registrados.</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 fw-medium text-dark">
                      {u.primerNombre} {u.segundoNombre || ''} {u.primerApellido} {u.segundoApellido || ''}
                    </td>
                    <td className="text-muted">{u.correo}</td>
                    <td>
                      <select 
                        value={u.rol} 
                        className="form-select form-select-sm fw-semibold w-auto border-0 bg-light"
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        disabled={u.id === user?.id}
                      >
                        <option value="OPERADOR">OPERADOR</option>
                        <option value="ADMIN">ADMINISTRADOR</option>
                      </select>
                    </td>
                    <td>
                      <span className={`badge px-3 py-1.5 rounded-pill ${u.activo ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                        {u.activo ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                    </td>
                    <td className="text-end px-4">
                      <button 
                        onClick={() => handleToggleStatus(u.id, u.activo)}
                        className={`btn btn-sm d-inline-flex align-items-center gap-1 ${u.activo ? 'btn-outline-danger' : 'btn-outline-success'}`}
                        disabled={u.id === user?.id}
                        title={u.id === user?.id ? 'No puedes suspender tu propia cuenta de administrador' : ''}
                      >
                        {u.activo ? (
                          <>
                            <UserX size={16} /> Suspender
                          </>
                        ) : (
                          <>
                            <UserCheck size={16} /> Activar
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Registro */}
      {showModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-md modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title d-flex align-items-center gap-2">
                  <Plus size={20} /> Registrar Nuevo Trabajador
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
                      <label className="form-label small fw-bold">Primer Nombre *</label>
                      <input type="text" name="primerNombre" className="form-control" value={formData.primerNombre} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Segundo Nombre</label>
                      <input type="text" name="segundoNombre" className="form-control" value={formData.segundoNombre} onChange={handleInputChange} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Primer Apellido *</label>
                      <input type="text" name="primerApellido" className="form-control" value={formData.primerApellido} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Segundo Apellido</label>
                      <input type="text" name="segundoApellido" className="form-control" value={formData.segundoApellido} onChange={handleInputChange} />
                    </div>
                    
                    <div className="col-12">
                      <label className="form-label small fw-bold">Correo Electrónico *</label>
                      <input type="email" name="correo" className="form-control" placeholder="nombre@novapalma.com" value={formData.correo} onChange={handleInputChange} required />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-bold">Contraseña Inicial *</label>
                      <input type="password" name="password" className="form-control" placeholder="Mínimo 8 caracteres" value={formData.password} onChange={handleInputChange} required />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-bold">Rol Operativo *</label>
                      <select name="rol" className="form-select" value={formData.rol} onChange={handleInputChange} required>
                        <option value="OPERADOR">OPERADOR (Acceso limitado a Viajes, Vehículos y Conductores)</option>
                        <option value="ADMIN">ADMINISTRADOR (Acceso total al sistema, Finanzas, Tarifas y Personal)</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary d-flex align-items-center gap-2">
                    <Save size={18} /> Guardar Trabajador
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

export default Users;
