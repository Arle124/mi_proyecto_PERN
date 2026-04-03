import { useState, useEffect } from 'react'
import axios from 'axios'

function App() {
  const [usuarios, setUsuarios] = useState([])

  // Función para pedir los usuarios al backend
  const obtenerUsuarios = async () => {
    try {
      const res = await axios.get('http://localhost:3001/usuarios')
      setUsuarios(res.data)
    } catch (error) {
      console.error("Error al conectar con el backend:", error)
    }
  }

  // Se ejecuta una sola vez al cargar la página
  useEffect(() => {
    obtenerUsuarios()
  }, [])

  return (
    <div className="container mt-5">
      <div className="card shadow-lg border-0 bg-dark text-white rounded-4">
        <div className="card-body p-5 text-center">
          <h1 className="display-5 mb-4">Lista de Usuarios 👤</h1>
          
          <div className="table-responsive">
            <table className="table table-dark table-hover mt-3">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.length > 0 ? (
                  usuarios.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3">Buscando usuarios en la base de datos...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <button 
            className="btn btn-outline-info mt-3" 
            onClick={obtenerUsuarios}
          >
            Actualizar Lista
          </button>
        </div>
      </div>
    </div>
  )
}

export default App