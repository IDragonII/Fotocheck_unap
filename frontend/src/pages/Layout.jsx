import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { getUsuario } from '../services/authService';
import { FaHome, FaUsers, FaIdCard, FaUserShield, FaKey, FaQrcode, FaClipboardList, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';
import { useState } from 'react';
import './Layout.css';

const navItems = [
  { to: '/', icon: <FaHome />, label: 'Dashboard' },
  { to: '/trabajadores', icon: <FaUsers />, label: 'Trabajadores' },
  { to: '/fotochecks', icon: <FaIdCard />, label: 'Fotochecks' },
  { to: '/accesos-qr', icon: <FaQrcode />, label: 'Accesos QR' },
  { to: '/usuarios', icon: <FaUserShield />, label: 'Usuarios' },
  { to: '/roles', icon: <FaKey />, label: 'Roles' },
  { to: '/logs', icon: <FaClipboardList />, label: 'Logs' },
];

export default function Layout({ onLogout }) {
  const usuario = getUsuario();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const getIniciales = () => {
    if (!usuario) return '?';
    const n = usuario.nombres?.[0] || '';
    const a = usuario.apellidos?.[0] || '';
    return (n + a).toUpperCase();
  };

  const getRol = () => {
    if (!usuario?.roles) return '';
    const roles = Object.values(usuario.roles);
    return roles[0] || '';
  };

  return (
    <div className="layout">
      <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? <FaTimes /> : <FaBars />}
      </button>

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="user-avatar">{getIniciales()}</div>
          <div className="user-meta">
            <span className="user-name">{usuario?.nombres} {usuario?.apellidos}</span>
            <span className="user-role">{getRol()}</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <FaSignOutAlt />
            <span>Cerrar Sesion</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <main className="main-content">
        <header className="topbar">
          <span className="topbar-title">Sistema Fotocheck</span>
        </header>
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
