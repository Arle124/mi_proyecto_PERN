import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Truck, 
  Users, 
  MapPin, 
  LogOut, 
  LayoutDashboard, 
  UserCircle,
  Banknote,
  DollarSign
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <div className="sidebar d-flex flex-column">
        <div className="mb-5 d-flex align-items-center gap-2">
          <Truck size={28} className="text-primary bg-white p-1 rounded" />
          <h4 className="m-0 fw-bold">Novapalma</h4>
        </div>

        <nav className="flex-grow-1">
          <NavLink to="/" className="nav-link" end>
            <LayoutDashboard size={20} /> Dashboard
          </NavLink>
          <NavLink to="/viajes" className="nav-link">
            <MapPin size={20} /> Viajes
          </NavLink>
          <NavLink to="/conductores" className="nav-link">
            <UserCircle size={20} /> Conductores
          </NavLink>
          <NavLink to="/vehiculos" className="nav-link">
            <Truck size={20} /> Vehículos
          </NavLink>
          {isAdmin() && (
            <>
              <NavLink to="/usuarios" className="nav-link">
                <Users size={20} /> Usuarios
              </NavLink>
              <NavLink to="/tarifas" className="nav-link">
                <Banknote size={20} /> Tarifas
              </NavLink>
              <NavLink to="/finanzas" className="nav-link">
                <DollarSign size={20} /> Finanzas
              </NavLink>
            </>
          )}
        </nav>

        <div className="mt-auto border-top border-secondary pt-3">
          <div className="d-flex align-items-center gap-3 mb-3 px-2">
            <div className="bg-secondary rounded-circle p-2">
              <UserCircle size={24} color="white" />
            </div>
            <div className="overflow-hidden">
              <p className="m-0 small fw-bold text-white text-truncate">{user?.primerNombre} {user?.primerApellido}</p>
              <p className="m-0 x-small text-muted text-uppercase" style={{ fontSize: '10px' }}>{user?.rol}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="btn btn-link nav-link w-100 text-start border-0 bg-transparent text-danger"
          >
            <LogOut size={20} /> Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-grow-1 p-4 bg-light overflow-auto vh-100">
        <header className="mb-4 d-flex justify-content-between align-items-center">
          <h2 className="fw-bold m-0 text-primary">Sistema Logístico</h2>
          <div className="bg-white px-3 py-1 rounded-pill shadow-sm small border">
            Estado: <span className="text-success fw-bold">Conectado</span>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
};

export default Layout;
