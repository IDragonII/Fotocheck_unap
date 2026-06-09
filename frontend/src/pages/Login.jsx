import { useState } from 'react';
import { login } from '../services/authService';
import { FaGraduationCap, FaEye, FaEyeSlash } from 'react-icons/fa';

export default function Login({ onLogin }) {
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [showClave, setShowClave] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(usuario, clave);
      onLogin(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="login-icon">
          <FaGraduationCap size={40} />
        </div>
        <h1>Sistema Fotocheck</h1>
        <p className="subtitle">Inicie sesion para continuar</p>

        {error && <div className="login-error">{error}</div>}

        <label>
          Usuario
          <input
            type="text"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            placeholder="Ingrese su usuario"
            autoFocus
          />
        </label>

        <label>
          Contrasena
          <div className="password-wrapper">
            <input
              type={showClave ? 'text' : 'password'}
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              placeholder="Ingrese su contrasena"
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowClave(!showClave)}
              tabIndex={-1}
            >
              {showClave ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
            </button>
          </div>
        </label>

        <button type="submit" disabled={loading}>
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}
