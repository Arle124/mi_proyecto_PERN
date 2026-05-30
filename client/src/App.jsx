import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Trips from './pages/Trips';
import Vehicles from './pages/Vehicles';
import Drivers from './pages/Drivers';
import Users from './pages/Users';
import Finance from './pages/Finance';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';

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
            path="/finanzas" 
            element={
              <AdminRoute>
                <Layout><Finance /></Layout>
              </AdminRoute>
            } 
          />

          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <Layout><Settings /></Layout>
              </ProtectedRoute>
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
