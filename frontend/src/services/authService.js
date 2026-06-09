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

  localStorage.setItem('usuario', JSON.stringify(data.usuario));
  return data.usuario;
}

export function getUsuario() {
  const data = localStorage.getItem('usuario');
  return data ? JSON.parse(data) : null;
}

export function logout() {
  localStorage.removeItem('usuario');
}
