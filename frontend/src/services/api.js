const API_URL = import.meta.env.VITE_API_URL;

async function request(url, options = {}) {
  const isFormData = options.body instanceof FormData;
  const headers = isFormData ? {} : { 'Content-Type': 'application/json', ...options.headers };

  const res = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Error en la peticion');
  }
  return res.json();
}

export const api = {
  get: (url) => request(url),
  post: (url, body, isFormData = false) =>
    request(url, { method: 'POST', body: isFormData ? body : JSON.stringify(body) }),
  put: (url, body) => request(url, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (url) => request(url, { method: 'DELETE' }),
  download: async (url, filename) => {
    const res = await fetch(`${API_URL}${url}`);
    if (!res.ok) throw new Error('Error al descargar');
    const blob = await res.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  },
};

export function proxyImageUrl(url) {
  if (!url) return null;
  const encoded = btoa(url).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  return `${API_URL}/proxy/image/${encoded}`;
}
