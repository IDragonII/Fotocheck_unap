import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import './CrudPage.css';

const initial = { usuario: '', clave: '', nombres: '', apellidos: '', estado: 'ACTIVO', roles: [] };

export default function Usuarios() {
  const [items, setItems] = useState([]);
  const [roles, setRoles] = useState([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [buscar, setBuscar] = useState('');
  const [form, setForm] = useState(initial);
  const [editing, setEditing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');

  const load = (p = 1) => {
    api.get(`/usuarios?page=${p}&buscar=${buscar}`).then((res) => {
      setItems(res.data);
      setPage(res.current_page);
      setLastPage(res.last_page);
    });
  };

  useEffect(() => {
    load();
    api.get('/roles').then(setRoles);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e) => { e.preventDefault(); load(); };

  const openNew = () => { setForm(initial); setEditing(null); setShowModal(true); setError(''); };
  const openEdit = (item) => {
    setForm({ ...item, clave: '', roles: item.roles?.map((r) => r.id) || [] });
    setEditing(item.id);
    setShowModal(true);
    setError('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await api.put(`/usuarios/${editing}`, form);
      } else {
        await api.post('/usuarios', form);
      }
      setShowModal(false);
      load(page);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Eliminar este usuario?')) return;
    await api.delete(`/usuarios/${id}`);
    load(page);
  };

  const toggleRole = (rolId) => {
    const roles = form.roles.includes(rolId) ? form.roles.filter((r) => r !== rolId) : [...form.roles, rolId];
    setForm({ ...form, roles });
  };

  return (
    <div className="crud-page">
      <div className="page-header">
        <h1>Usuarios</h1>
        <button className="btn-primary" onClick={openNew}><FaPlus /> Nuevo</button>
      </div>

      <form className="search-bar" onSubmit={handleSearch}>
        <input placeholder="Buscar por usuario, nombre o apellido..." value={buscar} onChange={(e) => setBuscar(e.target.value)} />
        <button type="submit">Buscar</button>
      </form>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Nombres</th>
              <th>Apellidos</th>
              <th>Roles</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((u) => (
              <tr key={u.id}>
                <td data-label="Usuario">{u.usuario}</td>
                <td data-label="Nombres">{u.nombres}</td>
                <td data-label="Apellidos">{u.apellidos}</td>
                <td data-label="Roles">{u.roles?.map((r) => r.nombre).join(', ') || '-'}</td>
                <td data-label="Estado"><span className={`badge badge-${u.estado.toLowerCase()}`}>{u.estado}</span></td>
                <td data-label="Acciones" className="actions">
                  <button className="btn-icon" onClick={() => openEdit(u)}><FaEdit /></button>
                  <button className="btn-icon btn-danger" onClick={() => handleDelete(u.id)}><FaTrash /></button>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan="6" className="empty">No se encontraron registros</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button disabled={page <= 1} onClick={() => load(page - 1)}>Anterior</button>
        <span>Pagina {page} de {lastPage}</span>
        <button disabled={page >= lastPage} onClick={() => load(page + 1)}>Siguiente</button>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? 'Editar' : 'Nuevo'} Usuario</h2>
            {error && <div className="form-error">{error}</div>}
            <form onSubmit={handleSave}>
              <div className="form-grid">
                <label>Usuario<input value={form.usuario} onChange={(e) => setForm({ ...form, usuario: e.target.value })} required /></label>
                <label>Contrasena<input type="password" value={form.clave} onChange={(e) => setForm({ ...form, clave: e.target.value })} placeholder={editing ? 'Dejar vacio para no cambiar' : ''} required={!editing} /></label>
                <label>Nombres<input value={form.nombres} onChange={(e) => setForm({ ...form, nombres: e.target.value })} required /></label>
                <label>Apellidos<input value={form.apellidos} onChange={(e) => setForm({ ...form, apellidos: e.target.value })} required /></label>
                <label>Estado<select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}><option>ACTIVO</option><option>INACTIVO</option></select></label>
              </div>
              <div className="roles-section">
                <span className="roles-label">Roles:</span>
                <div className="roles-list">
                  {roles.map((r) => (
                    <label key={r.id} className="role-check">
                      <input type="checkbox" checked={form.roles.includes(r.id)} onChange={() => toggleRole(r.id)} />
                      {r.nombre}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
