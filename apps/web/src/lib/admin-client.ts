import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export function createAdminClient(adminKey: string) {
  return axios.create({
    baseURL: `${API_URL}/api/admin`,
    headers: { 'x-admin-key': adminKey },
  });
}

export function getAdminKey(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('admin_key') ?? '';
}

export function setAdminKey(key: string) {
  localStorage.setItem('admin_key', key);
}

export function clearAdminKey() {
  localStorage.removeItem('admin_key');
}
