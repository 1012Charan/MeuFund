const apiBase = (import.meta.env.VITE_API_URL?.trim() || 'http://localhost:5001/api')
  .replace(/\/+$/, '');

export async function apiRequest(path, { token, method = 'GET', body } = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const result = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(result?.message ?? 'The request could not be completed.');
    error.status = response.status;
    throw error;
  }
  return result;
}
