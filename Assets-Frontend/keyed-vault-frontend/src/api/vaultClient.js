const BASE_URL = import.meta.env.VITE_API_URL || '';
const BASE      = `${BASE_URL}/api/local`;

export function getToken() {
  return sessionStorage.getItem('keyed_jwt')
      || localStorage.getItem('keyed_jwt')
      || null;
}

function authHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchLedger() {
  const res = await fetch(`${BASE}/ledger`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Ledger fetch failed: ${res.status}`);
  const data = await res.json();
  const list = Array.isArray(data) ? data : (data.payload || []);
  return list.map(r => ({ ...r, fileHash: r.fileHash || r.assetHash || '' }));

}

export async function processAsset(file, authorId) {
  const form = new FormData();
  form.append('file', file);
  form.append('authorId', authorId);
  const token = getToken();
  const res = await fetch(`${BASE}/process`, {
    method: 'POST',
    body: form,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Process failed: ${res.status}`);
  return data;
}

export function getFileUrl(hash) {
  if (!hash || hash === 'undefined' || hash === 'null' || !hash.trim()) return null;
  return `${BASE}/file/${hash}`;
}

export async function login(identifier, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: identifier.trim(), password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Login failed: ${res.status}`);
  return data;
}

export async function fetchProfile() {
  const res = await fetch(`${BASE_URL}/api/auth/me`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Profile fetch failed: ${res.status}`);
  return res.json();
}