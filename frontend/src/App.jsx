import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './pages/Layout';
import Dashboard from './pages/Dashboard';
import Trabajadores from './pages/Trabajadores';
import Fotochecks from './pages/Fotochecks';
import AccesosQr from './pages/AccesosQr';
import Usuarios from './pages/Usuarios';
import Roles from './pages/Roles';
import Logs from './pages/Logs';
import PhotocheckViewer from './pages/PhotocheckViewer';
import { getUsuario, logout, isSessionExpired } from './services/authService';
import './App.css';

function ProtectedRoute({ children }) {
  const usuario = getUsuario();
  return usuario ? children : <Navigate to="/login" />;
}

function App() {
  const [usuario, setUsuario] = useState(() => getUsuario());

  useEffect(() => {
    const interval = setInterval(() => {
      if (isSessionExpired()) {
        logout();
        setUsuario(null);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/:codigo" element={<PhotocheckViewer />} />
        <Route path="/login" element={usuario ? <Navigate to="/" /> : <Login onLogin={setUsuario} />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="trabajadores" element={<Trabajadores />} />
          <Route path="fotochecks" element={<Fotochecks />} />
          <Route path="accesos-qr" element={<AccesosQr />} />
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="roles" element={<Roles />} />
          <Route path="logs" element={<Logs />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
