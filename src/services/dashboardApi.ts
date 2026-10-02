import { GOOGLE_APPS_SCRIPT_URL } from '../config';
import { DashboardData } from '../types/dashboard';

export async function getDashboardData(): Promise<DashboardData> {
  if (!GOOGLE_APPS_SCRIPT_URL?.trim()) {
    throw new Error('URL Google Apps Script belum dikonfigurasi.');
  }

  let response = await fetch('/api/dashboard', {
    method: 'GET',
    headers: { Accept: 'application/json', 'x-target-gas-url': GOOGLE_APPS_SCRIPT_URL.trim() },
  }).catch(() => null);
  if (!response || response.status >= 500) {
    response = await fetch(`${GOOGLE_APPS_SCRIPT_URL.trim()}?action=dashboard`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
  }
  if (!response.ok) throw new Error(`Dashboard API HTTP ${response.status}`);

  const data = (await response.json()) as DashboardData;
  if (!data.success) throw new Error('Data dashboard gagal dimuat.');
  return data;
}
