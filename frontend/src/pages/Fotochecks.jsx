import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { FaTrash, FaSync } from 'react-icons/fa';
import './CrudPage.css';

export default function Fotochecks() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [buscar, setBuscar] = useState('');
  const [generando, setGenerando] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [resultado, setResultado] = useState(null);

  const load = (p = 1) => {
    api.get(`/fotochecks?page=${p}&buscar=${buscar}`).then((res) => {
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

  const handleDelete = async (id) => {
    if (!confirm('Anular este fotocheck?')) return;
    await api.delete(`/fotochecks/${id}`);
    load(page);
  };

  const handleGenerar = async () => {
    setGenerando(true);
    try {
      const res = await api.post('/fotochecks/generar', {});
      setResultado(res);
      setShowModal(true);
      load();
    } catch (err) {
      setResultado({ message: err.message, creados: 0 });
      setShowModal(true);
    } finally {
      setGenerando(false);
    }
  };

  return (
    <div className="crud-page">
      <div className="page-header">
        <h1>Fotochecks</h1>
        <div className="header-actions">
          <button className="btn-secondary" onClick={handleGenerar} disabled={generando}>
            <FaSync /> {generando ? 'Generando...' : 'Generar'}
          </button>
        </div>
      </div>

      <form className="search-bar" onSubmit={handleSearch}>
        <input placeholder="Buscar por nombre o DNI del trabajador..." value={buscar} onChange={(e) => setBuscar(e.target.value)} />
        <button type="submit">Buscar</button>
      </form>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Codigo</th>
              <th>Trabajador</th>
              <th>DNI</th>
              <th>Emision</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((f) => (
              <tr key={f.id}>
                <td data-label="Codigo"><code>{f.codigo}</code></td>
                <td data-label="Trabajador">{f.trabajador?.nombres} {f.trabajador?.apellidos}</td>
                <td data-label="DNI">{f.trabajador?.dni}</td>
                <td data-label="Emision">{new Date(f.fecha_emision).toLocaleDateString()}</td>
                <td data-label="Estado"><span className={`badge badge-${f.estado.toLowerCase()}`}>{f.estado}</span></td>
                <td data-label="Acciones" className="actions">
                  <button className="btn-icon btn-danger" onClick={() => handleDelete(f.id)}><FaTrash /></button>
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
          <div className="modal modal-result" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">
              {resultado?.creados > 0 ? '✓' : '!'}
            </div>
            <h2>Generar Fotochecks</h2>
            <p className="modal-message">{resultado?.message}</p>
            {resultado?.creados > 0 && (
              <p className="modal-detail">Se crearon <strong>{resultado.creados}</strong> fotocheck(s)</p>
            )}
            <div className="form-actions">
              <button className="btn-primary" onClick={() => setShowModal(false)}>Aceptar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
