import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Trips from './pages/Trips';
import Vehicles from './pages/Vehicles';
import Drivers from './pages/Drivers';
import Tariffs from './pages/Tariffs';

// Componentes Placeholder para otros módulos (MVP Vertical Slice)
const Users = () => <div><h4>Módulo de Usuarios</h4><p>Panel de Administración de Personal.</p></div>;
const Dashboard = () => (
  <div className="row g-4">
    <div className="col-md-3">
      <div className="card p-3 text-center">
        <h2 className="fw-bold text-primary">12</h2>
        <p className="text-muted small m-0">Viajes este mes</p>
      </div>
    </div>
    <div className="col-md-3">
      <div className="card p-3 text-center">
        <h2 className="fw-bold text-success">85%</h2>
        <p className="text-muted small m-0">Flota Activa</p>
      </div>
    </div>
    <div className="col-md-3">
      <div className="card p-3 text-center">
        <h2 className="fw-bold text-info">24</h2>
        <p className="text-muted small m-0">Conductores</p>
      </div>
    </div>
    <div className="col-md-3">
      <div className="card p-3 text-center">
        <h2 className="fw-bold text-warning">$2.4M</h2>
        <p className="text-muted small m-0">Facturación</p>
      </div>
    </div>
    <div className="col-12">
      <Trips />
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Ruta Pública */}
          <Route path="/login" element={<Login />} />

          {/* Rutas Protegidas bajo Layout */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Layout><Dashboard /></Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/viajes" 
            element={
              <ProtectedRoute>
                <Layout><Trips /></Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/vehiculos" 
            element={
              <ProtectedRoute>
                <Layout><Vehicles /></Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/conductores" 
            element={
              <ProtectedRoute>
                <Layout><Drivers /></Layout>
              </ProtectedRoute>
            } 
          />
          
          {/* Rutas de Administrador */}
          <Route 
            path="/usuarios" 
            element={
              <AdminRoute>
                <Layout><Users /></Layout>
              </AdminRoute>
            } 
          />
          <Route 
            path="/tarifas" 
            element={
              <AdminRoute>
                <Layout><Tariffs /></Layout>
              </AdminRoute>
            } 
          />

          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
