import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, ShieldAlert } from 'lucide-react';

const Login = () => {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const result = await login(correo, password);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card p-4 shadow-lg" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="text-center mb-4">
          <div className="bg-primary d-inline-block p-3 rounded-circle mb-3">
            <LogIn size={32} color="white" />
          </div>
          <h2 className="fw-bold">Novapalma</h2>
          <p className="text-muted">Gestión Logística Inteligente</p>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-2 py-2">
            <ShieldAlert size={20} />
            <small>{error}</small>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label text-secondary small fw-semibold">Correo Electrónico</label>
            <input
              type="email"
              className="form-control"
              placeholder="ejemplo@novapalma.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="form-label text-secondary small fw-semibold">Contraseña</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
            disabled={loading}
          >
            {loading ? 'Validando...' : 'Entrar al Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
