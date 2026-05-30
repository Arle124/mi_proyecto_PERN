import { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

/**
 * Proveedor de Autenticación con Blindaje de Sesión.
 * Como DevOps Senior, hemos delegado la gestión del token al navegador (HttpOnly Cookies).
 * El estado local solo persiste la data no sensible del usuario.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Recuperamos solo la info de perfil, el token vive en la cookie HttpOnly
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (correo, password) => {
    try {
      // El servidor responderá con Set-Cookie: token=...
      const { data } = await api.post('/auth/login', { correo, password });
      
      // Persistimos solo data de UI
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.error || 'Error de autenticación en el servidor' 
      };
    }
  };

  const logout = async () => {
    try {
      // Notificamos al servidor para que limpie la cookie HttpOnly
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Error durante el cierre de sesión:', error);
    } finally {
      // Limpieza de estado local garantizada
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const isAdmin = () => user?.rol === 'ADMIN';

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, isAdmin, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
