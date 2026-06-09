import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { FaUsers, FaIdCard, FaUserShield } from 'react-icons/fa';
import './Dashboard.css';

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/dashboard').then(setStats);
  }, []);

  if (!stats) return <p>Cargando...</p>;

  const cards = [
    { label: 'Trabajadores', value: stats.totalTrabajadores, sub: `${stats.trabajadoresActivos} activos`, icon: <FaUsers /> },
    { label: 'Fotochecks', value: stats.totalFotochecks, sub: `${stats.fotochecksVigentes} vigentes`, icon: <FaIdCard /> },
    { label: 'Usuarios', value: stats.totalUsuarios, sub: 'Registrados', icon: <FaUserShield /> },
  ];

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <div className="stats-grid">
        {cards.map((c) => (
          <div key={c.label} className="stat-card">
            <div className="stat-icon">{c.icon}</div>
            <div className="stat-info">
              <span className="stat-value">{c.value}</span>
              <span className="stat-label">{c.label}</span>
              <span className="stat-sub">{c.sub}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
