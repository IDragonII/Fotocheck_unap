const API_URL = import.meta.env.VITE_API_URL;

export async function login(usuario, clave) {
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario, clave }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Error al iniciar sesion');
  }

  const session = {
    usuario: data.usuario,
    expires_at: data.expires_at,
  };
  localStorage.setItem('usuario', JSON.stringify(session));
  return data.usuario;
}

export function getUsuario() {
  const raw = localStorage.getItem('usuario');
  if (!raw) return null;

  const session = JSON.parse(raw);

  if (session.expires_at && new Date(session.expires_at) < new Date()) {
    logout();
    return null;
  }

  return session.usuario || session;
}

export function logout() {
  localStorage.removeItem('usuario');
}

export function isSessionExpired() {
  const raw = localStorage.getItem('usuario');
  if (!raw) return true;

  try {
    const session = JSON.parse(raw);
    if (session.expires_at && new Date(session.expires_at) < new Date()) {
      return true;
    }
    return false;
  } catch {
    return true;
  }
}
