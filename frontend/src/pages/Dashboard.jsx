import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { FaUsers, FaIdCard, FaUserShield, FaQrcode } from 'react-icons/fa';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import './Dashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler);

const COLORS = {
  primary: '#1e40af',
  primaryLight: '#3b82f6',
  accent: '#c9a85a',
  accentLight: '#f5e6c8',
  green: '#10b981',
  red: '#ef4444',
  yellow: '#f59e0b',
  purple: '#8b5cf6',
  gray: '#6b7280',
};

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 600 },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1a2a4a',
      titleColor: '#ffffff',
      bodyColor: '#cfe0ff',
      borderColor: 'rgba(201,168,90,0.3)',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
    },
  },
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/dashboard').then(setStats);
  }, []);

  if (!stats) return <p>Cargando...</p>;

  const cards = [
    { label: 'Trabajadores', value: stats.totalTrabajadores, sub: `${stats.trabajadoresActivos} activos`, icon: <FaUsers />, color: COLORS.primary },
    { label: 'Fotochecks', value: stats.totalFotochecks, sub: `${stats.fotochecksVigentes} vigentes`, icon: <FaIdCard />, color: COLORS.green },
    { label: 'Usuarios', value: stats.totalUsuarios, sub: 'Registrados', icon: <FaUserShield />, color: COLORS.purple },
    { label: 'Accesos QR', value: stats.totalAccesos, sub: 'Ultimos 30 dias', icon: <FaQrcode />, color: COLORS.accent },
  ];

  const accesosDiaData = {
    labels: stats.accesosPorDia.map((d) => {
      const f = new Date(d.fecha);
      return `${f.getDate()}/${f.getMonth() + 1}`;
    }),
    datasets: [{
      label: 'Accesos',
      data: stats.accesosPorDia.map((d) => d.total),
      borderColor: COLORS.primary,
      backgroundColor: 'rgba(30,64,175,0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 6,
      pointBackgroundColor: COLORS.primary,
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
    }],
  };

  const accesosHoraData = {
    labels: stats.accesosPorHora.map((d) => `${d.hora}:00`),
    datasets: [{
      label: 'Accesos',
      data: stats.accesosPorHora.map((d) => d.total),
      backgroundColor: stats.accesosPorHora.map((d) =>
        d.hora >= 8 && d.hora <= 17 ? COLORS.primary : 'rgba(30,64,175,0.3)'
      ),
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  const topTrabData = {
    labels: stats.topTrabajadores.map((t) => `${t.nombres.split(' ')[0]} ${t.apellidos.split(' ')[0]}`),
    datasets: [{
      label: 'Escaneos',
      data: stats.topTrabajadores.map((t) => t.total),
      backgroundColor: [COLORS.primary, COLORS.accent, COLORS.green, COLORS.purple, COLORS.yellow],
      borderWidth: 0,
      borderRadius: 6,
    }],
  };

  const trabEstadoData = {
    labels: stats.trabajadoresPorEstado.map((e) => e.estado),
    datasets: [{
      data: stats.trabajadoresPorEstado.map((e) => e.total),
      backgroundColor: stats.trabajadoresPorEstado.map((e) => {
        if (e.estado === 'ACTIVO') return COLORS.green;
        if (e.estado === 'INACTIVO') return COLORS.red;
        return COLORS.yellow;
      }),
      borderWidth: 0,
      hoverOffset: 8,
    }],
  };

  const logsAccionData = {
    labels: stats.logsPorAccion.map((l) => l.accion || 'Sin accion'),
    datasets: [{
      data: stats.logsPorAccion.map((l) => l.total),
      backgroundColor: [COLORS.primary, COLORS.accent, COLORS.green, COLORS.purple, COLORS.yellow, COLORS.red, COLORS.gray],
      borderWidth: 0,
      hoverOffset: 8,
    }],
  };

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      <div className="stats-grid">
        {cards.map((c) => (
          <div key={c.label} className="stat-card" style={{ borderLeftColor: c.color }}>
            <div className="stat-icon" style={{ background: `${c.color}15`, color: c.color }}>{c.icon}</div>
            <div className="stat-info">
              <span className="stat-value">{c.value.toLocaleString()}</span>
              <span className="stat-label">{c.label}</span>
              <span className="stat-sub">{c.sub}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="charts-grid">
        <div className="chart-card chart-wide">
          <h3>Accesos QR por dia</h3>
          <div className="chart-box">
            <Line data={accesosDiaData} options={{ ...chartDefaults, scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } } } }} />
          </div>
        </div>

        <div className="chart-card">
          <h3>Accesos por hora</h3>
          <div className="chart-box">
            <Bar data={accesosHoraData} options={{ ...chartDefaults, scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } } } }} />
          </div>
        </div>

        <div className="chart-card">
          <h3>Top trabajadores</h3>
          <div className="chart-box">
            <Bar data={topTrabData} options={{ ...chartDefaults, indexAxis: 'y', scales: { y: { grid: { display: false } }, x: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } } } }} />
          </div>
        </div>

        <div className="chart-card">
          <h3>Trabajadores por estado</h3>
          <div className="chart-box chart-box-doughnut">
            <Doughnut data={trabEstadoData} options={{ ...chartDefaults, plugins: { ...chartDefaults.plugins, legend: { display: true, position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyle: 'circle' } } }, cutout: '60%' }} />
          </div>
        </div>

        <div className="chart-card">
          <h3>Logs por accion</h3>
          <div className="chart-box chart-box-doughnut">
            <Doughnut data={logsAccionData} options={{ ...chartDefaults, plugins: { ...chartDefaults.plugins, legend: { display: true, position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyle: 'circle' } } }, cutout: '60%' }} />
          </div>
        </div>

        <div className="chart-card">
          <h3>Fotochecks por estado</h3>
          <div className="chart-box chart-box-doughnut">
            <Doughnut data={fotochecksPorEstado(stats.fotochecksPorEstado)} options={{ ...chartDefaults, plugins: { ...chartDefaults.plugins, legend: { display: true, position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyle: 'circle' } } }, cutout: '60%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function fotochecksPorEstado(data) {
  return {
    labels: data.map((e) => e.estado),
    datasets: [{
      data: data.map((e) => e.total),
      backgroundColor: data.map((e) => {
        if (e.estado === 'VIGENTE') return COLORS.green;
        if (e.estado === 'VENCIDO') return COLORS.yellow;
        return COLORS.red;
      }),
      borderWidth: 0,
      hoverOffset: 8,
    }],
  };
}
