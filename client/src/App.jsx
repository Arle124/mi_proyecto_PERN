import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Trips from './pages/Trips';
import Vehicles from './pages/Vehicles';
import Drivers from './pages/Drivers';
import Tariffs from './pages/Tariffs';
import Users from './pages/Users';
import Finance from './pages/Finance';
import api from './api/axios';

const Dashboard = () => {
  const [stats, setStats] = useState({
    tripsThisMonth: 0,
    activeVehicles: 0,
    activeDrivers: 0,
    totalBilling: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/dashboard/stats');
        setStats(data);
      } catch (error) {
        console.error('Error al cargar métricas del Dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="row g-4">
      <div className="col-md-3">
        <div className="card p-3 text-center border-0 shadow-sm bg-white">
          <h2 className="fw-bold text-primary mb-1">{loading ? '...' : stats.tripsThisMonth}</h2>
          <p className="text-muted small m-0 fw-medium">Viajes este mes</p>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card p-3 text-center border-0 shadow-sm bg-white">
          <h2 className="fw-bold text-success mb-1">{loading ? '...' : stats.activeVehicles}</h2>
          <p className="text-muted small m-0 fw-medium">Flota Activa</p>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card p-3 text-center border-0 shadow-sm bg-white">
          <h2 className="fw-bold text-info mb-1">{loading ? '...' : stats.activeDrivers}</h2>
          <p className="text-muted small m-0 fw-medium">Conductores Activos</p>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card p-3 text-center border-0 shadow-sm bg-white">
          <h2 className="fw-bold text-warning mb-1">
            {loading ? '...' : `$${Number(stats.totalBilling).toLocaleString()}`}
          </h2>
          <p className="text-muted small m-0 fw-medium">Facturación Mensual</p>
        </div>
      </div>
      <div className="col-12 mt-4">
        <div className="card p-4 border-0 shadow-sm bg-white">
          <Trips isDashboard={true} />
        </div>
      </div>
    </div>
  );
};

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
          <Route 
            path="/finanzas" 
            element={
              <AdminRoute>
                <Layout><Finance /></Layout>
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
