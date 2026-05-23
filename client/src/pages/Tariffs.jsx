import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Settings, Save, AlertCircle } from 'lucide-react';

const Tariffs = () => {
  const [tariffs, setTariffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchTariffs();
  }, []);

  const fetchTariffs = async () => {
    try {
      const { data } = await api.get('/tarifas');
      setTariffs(data);
    } catch (error) {
      console.error('Error al cargar tarifas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (producto, valorKg) => {
    try {
      await api.post('/tarifas', { producto, valorKg: parseFloat(valorKg) });
      setMessage({ type: 'success', text: `Tarifa del producto ${producto} actualizada correctamente.` });
      fetchTariffs();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'danger', text: 'Error al actualizar la tarifa.' });
    }
  };

  if (!isAdmin()) return <div className="alert alert-danger">Acceso restringido. Solo administradores.</div>;

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center mb-4">
        <Settings className="me-2 text-primary" size={28} />
        <h2 className="m-0 fw-bold">Gestión de Tarifas</h2>
      </div>

      {message && (
        <div className={`alert alert-${message.type} d-flex align-items-center`}>
          <AlertCircle className="me-2" size={18} />
          {message.text}
        </div>
      )}

      <div className="row g-4">
        {loading ? (
          <div className="col-12 text-center py-5 text-muted">Cargando tarifas...</div>
        ) : tariffs.length === 0 ? (
          <div className="col-12 text-center py-5 text-muted">No hay tarifas de cálculo automático configuradas.</div>
        ) : (
          tariffs.map((t) => (
            <div key={t.id} className="col-md-6">
              <div className="card h-100 shadow-sm border-0 bg-white">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="badge bg-success px-3 py-2 rounded-pill">
                      PRODUCTO {t.producto}
                    </span>
                    <small className="text-muted">Actualización: {new Date(t.updatedAt).toLocaleDateString()}</small>
                  </div>
                  
                  <h5 className="card-title text-muted mb-4">Valor por Kilogramo (COP)</h5>
                  
                  <div className="input-group input-group-lg mb-3">
                    <span className="input-group-text bg-light border-0">$</span>
                    <input
                      type="number"
                      className="form-control bg-light border-0 fw-bold"
                      defaultValue={t.valorKg}
                      id={`input-tariff-${t.id}`}
                      onBlur={(e) => handleUpdate(t.producto, e.target.value)}
                    />
                  </div>
                  
                  <p className="small text-muted mb-0">
                    * El cobro de fruta se calcula automáticamente multiplicando el tonelaje por 1000 kg y luego por este valor.
                  </p>
                </div>
                <div className="card-footer bg-transparent border-0 p-4 pt-0">
                  <button 
                    className="btn btn-primary w-100 d-flex align-items-center justify-content-center"
                    onClick={() => {
                      const input = document.getElementById(`input-tariff-${t.id}`);
                      handleUpdate(t.producto, input.value);
                    }}
                  >
                    <Save size={18} className="me-2" /> Guardar Cambios
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Tariffs;