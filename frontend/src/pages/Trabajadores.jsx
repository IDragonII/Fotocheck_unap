import { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';
import { FaPlus, FaEdit, FaTrash, FaFileImport } from 'react-icons/fa';
import './CrudPage.css';

const initial = { dni: '', nombres: '', apellidos: '', empresa: '', area: '', cargo: '', telefono: '', correo: '', estado: 'ACTIVO' };

export default function Trabajadores() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [buscar, setBuscar] = useState('');
  const [form, setForm] = useState(initial);
  const [editing, setEditing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [importResult, setImportResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef(null);

  const load = (p = 1) => {
    api.get(`/trabajadores?page=${p}&buscar=${buscar}`).then((res) => {
      setItems(res.data);
      setPage(res.current_page);
      setLastPage(res.last_page);
    });
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e) => {
    e.preventDefault();
    load();
  };

  const openNew = () => { setForm(initial); setEditing(null); setShowModal(true); setError(''); };
  const openEdit = (item) => { setForm(item); setEditing(item.id); setShowModal(true); setError(''); };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await api.put(`/trabajadores/${editing}`, form);
      } else {
        await api.post('/trabajadores', form);
      }
      setShowModal(false);
      load(page);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Eliminar este trabajador?')) return;
    await api.delete(`/trabajadores/${id}`);
    load(page);
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    const formData = new FormData();
    formData.append('archivo', file);

    try {
      const res = await api.post('/trabajadores/importar', formData, true);
      setImportResult(res);
      load();
    } catch (err) {
      setImportResult({ message: err.message, errores: [] });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="crud-page">
      <div className="page-header">
        <h1>Trabajadores</h1>
        <div className="header-actions">
          <label className="btn-secondary" style={{ cursor: 'pointer' }}>
            <FaFileImport /> Importar Excel
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleImport} hidden />
          </label>
          <button className="btn-primary" onClick={openNew}><FaPlus /> Nuevo</button>
        </div>
      </div>

      {importing && <div className="import-status">Importando archivo...</div>}

      {importResult && (
        <div className={`import-result ${importResult.errores?.length ? 'with-errors' : ''}`}>
          <p>{importResult.message}</p>
          {importResult.creados !== undefined && (
            <p>Creados: {importResult.creados} | Actualizados: {importResult.actualizados}</p>
          )}
          {importResult.errores?.length > 0 && (
            <ul>
              {importResult.errores.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          )}
          <button className="btn-close" onClick={() => setImportResult(null)}>&times;</button>
        </div>
      )}

      <form className="search-bar" onSubmit={handleSearch}>
        <input placeholder="Buscar por nombre, apellido o DNI..." value={buscar} onChange={(e) => setBuscar(e.target.value)} />
        <button type="submit">Buscar</button>
      </form>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>DNI</th>
              <th>Nombres</th>
              <th>Apellidos</th>
              <th>Cargo</th>
              <th>Codigo</th>
              <th>NFS</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id}>
                <td data-label="DNI">{t.dni}</td>
                <td data-label="Nombres">{t.nombres}</td>
                <td data-label="Apellidos">{t.apellidos}</td>
                <td data-label="Cargo">{t.cargo || '-'}</td>
                <td data-label="Codigo"><code>{t.codigo_unico || '-'}</code></td>
                <td data-label="NFS"><code>{t.codigo_nfs || '-'}</code></td>
                <td data-label="Estado"><span className={`badge badge-${t.estado.toLowerCase()}`}>{t.estado}</span></td>
                <td data-label="Acciones" className="actions">
                  <button className="btn-icon" onClick={() => openEdit(t)}><FaEdit /></button>
                  <button className="btn-icon btn-danger" onClick={() => handleDelete(t.id)}><FaTrash /></button>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan="8" className="empty">No se encontraron registros</td></tr>}
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
            <h2>{editing ? 'Editar' : 'Nuevo'} Trabajador</h2>
            {error && <div className="form-error">{error}</div>}
            <form onSubmit={handleSave}>
              <div className="form-grid">
                <label>DNI<input value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value })} required /></label>
                <label>Nombres<input value={form.nombres} onChange={(e) => setForm({ ...form, nombres: e.target.value })} required /></label>
                <label>Apellidos<input value={form.apellidos} onChange={(e) => setForm({ ...form, apellidos: e.target.value })} required /></label>
                <label>Cargo<input value={form.cargo || ''} onChange={(e) => setForm({ ...form, cargo: e.target.value })} /></label>
                <label>Telefono<input value={form.telefono || ''} onChange={(e) => setForm({ ...form, telefono: e.target.value })} /></label>
                <label>Correo<input type="email" value={form.correo || ''} onChange={(e) => setForm({ ...form, correo: e.target.value })} /></label>
                <label>Estado<select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}><option>ACTIVO</option><option>INACTIVO</option><option>SUSPENDIDO</option></select></label>
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
