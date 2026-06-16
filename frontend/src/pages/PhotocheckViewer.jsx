import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FaSyncAlt, FaWifi } from 'react-icons/fa';
import logoUrl from '../assets/logo.png';
import firmaUrl from '../assets/firma.png';
import { proxyImageUrl } from '../services/api';
import './PhotocheckViewer.css';

const API_URL = import.meta.env.VITE_API_URL;

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export default function PhotocheckViewer() {
  const { codigo } = useParams();
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [fotoUrl, setFotoUrl] = useState(null);
  const [firmaImg, setFirmaImg] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/public/fotocheck/${codigo}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Fotocheck no encontrado');
        const json = await res.json();
        if (cancelled) return;
        setData(json);
        const [foto, firma] = await Promise.all([
          loadImage(json.trabajador.foto ? proxyImageUrl(json.trabajador.foto) : null),
          loadImage(firmaUrl),
        ]);
        if (!cancelled) {
          setFotoUrl(foto);
          setFirmaImg(firma);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) { setError(err.message); setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [codigo]);

  if (loading && !error) {
    return (
      <div className="pcv-container">
        <div className="pcv-overlay"><div className="pcv-spinner" /><p>Cargando fotocheck...</p></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pcv-container">
        <div className="pcv-overlay">
          <div className="pcv-error"><h2>No se encontro el fotocheck</h2><p>{error}</p></div>
        </div>
      </div>
    );
  }

  const t = data.trabajador;
  const f = data.fotocheck;
  const nombre = t.nombre_completo || `${t.nombres} ${t.apellidos}`;
  const phone = (t.telefono || '').replace(/^51/, '');

  return (
    <div className="pcv-container">
      <div className={`pcv-card ${flipped ? 'pcv-flipped' : ''}`}>
        <div className="pcv-face pcv-front">
          <div className="pcv-front-header">
            <img src={logoUrl} alt="UNA" className="pcv-logo" />
            <div className="pcv-university">
              <span>UNIVERSIDAD</span>
              <span>NACIONAL DEL</span>
              <span>ALTIPLANO</span>
            </div>
          </div>
          <div className="pcv-blue-strip" />
          <div className="pcv-front-body">
            <div className="pcv-photo-frame">
              {fotoUrl ? (
                <img src={fotoUrl.src || fotoUrl} alt={nombre} className="pcv-photo" />
              ) : (
                <div className="pcv-photo-placeholder">{nombre.split(' ').filter(Boolean).slice(0, 2).map(s => s[0]).join('')}</div>
              )}
            </div>
            <h2 className="pcv-name">{nombre}</h2>
            <div className="pcv-divider" />
            <p className="pcv-cargo">{t.cargo || t.area || ''}</p>
          </div>
          <div className="pcv-front-footer">
            <div className="pcv-nfc">
              <FaWifi className="pcv-nfc-icon" />
              <span className="pcv-nfc-label">NFC</span>
            </div>
            <span className="pcv-code">{t.codigo_nfs || ''}</span>
          </div>
        </div>

        <div className="pcv-face pcv-back">
          <div className="pcv-back-header">
            <h3>DATOS COMPLEMENTARIOS</h3>
          </div>
          <div className="pcv-back-body">
            <div className="pcv-back-blue-strip" />
            <div className="pcv-back-content">
              <section className="pcv-section">
                <h4>Contacto</h4>
                <div className="pcv-info-row"><span>Email</span><span>{t.correo || '---'}</span></div>
                <div className="pcv-info-row"><span>Telefono</span><span>+51 {phone || '---'}</span></div>
              </section>
              <section className="pcv-section">
                <h4>Informacion Laboral</h4>
                <div className="pcv-info-row"><span>Regimen</span><span>D.L. 276</span></div>
                <div className="pcv-info-row"><span>Dependencia</span><span>{t.area || t.empresa || '---'}</span></div>
                <div className="pcv-info-row"><span>Cargo</span><span>{t.cargo || '---'}</span></div>
                <div className="pcv-info-row"><span>F. Ingreso</span><span>{new Date().toLocaleDateString()}</span></div>
              </section>
              <div className="pcv-firma-section">
                {firmaImg && (
                  <div className="pcv-firma-img-wrap">
                    <img src={firmaUrl} alt="Firma" className="pcv-firma-img" />
                  </div>
                )}
                <div className="pcv-firma-line" />
                <span className="pcv-firma-label">FIRMA AUTORIZADA</span>
              </div>
            </div>
          </div>
          <div className="pcv-back-footer">
            Propiedad de la Universidad Nacional del Altiplano
          </div>
        </div>
      </div>

      <button className="pcv-toggle" onClick={() => setFlipped(!flipped)}>
        <FaSyncAlt /> {flipped ? 'Ver Anverso' : 'Ver Reverso'}
      </button>
    </div>
  );
}
