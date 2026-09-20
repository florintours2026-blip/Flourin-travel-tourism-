/*
  FLORIN Supplier API client

  Add this module to the admin page when the Python API is deployed.

  Example:
    import { importHotelUrl, searchHotels, searchFlights, saveOffer } from './florin-supplier-api.js';

  Configure:
    window.FLORIN_API_BASE_URL = 'https://api.your-domain.com';
*/

import { auth } from './firebase-config.js';

const API_BASE =
  window.FLORIN_API_BASE_URL ||
  localStorage.getItem('florin_api_base_url') ||
  'http://localhost:8000';

async function token() {
  const user = auth.currentUser;
  if (!user) throw new Error('يجب تسجيل الدخول أولاً.');
  return user.getIdToken();
}

async function request(path, options = {}) {
  const idToken = await token();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    Authorization: `Bearer ${idToken}`
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || data.error || `HTTP ${response.status}`);
  }

  return data;
}

export async function importHotelUrl(url, role = 'customer') {
  return request('/api/hotels/import-url', {
    method: 'POST',
    body: JSON.stringify({ url, role })
  });
}

export async function searchHotels(payload) {
  return request('/api/hotels/search', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function searchFlights(payload) {
  return request('/api/flights/search', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function saveOffer(offer) {
  return request('/api/offers/save', {
    method: 'POST',
    body: JSON.stringify({ offer })
  });
}

export async function apiHealth() {
  return request('/health', { method: 'GET' });
}

if (typeof window !== 'undefined') {
  window.FLORIN_SUPPLIER_API = {
    importHotelUrl,
    searchHotels,
    searchFlights,
    saveOffer,
    apiHealth
  };
}
