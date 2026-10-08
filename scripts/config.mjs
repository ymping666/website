import { fileURLToPath } from 'node:url';

export const siteRoot = fileURLToPath(new URL('../site/', import.meta.url));
export const pythonCommand = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3');

export function siteBase(raw = process.env.SITE_BASE || '/') {
  const path = raw.replace(/^\/+|\/+$/g, '');
  if (path.split('/').some(part => part === '.' || part === '..') || /[\\?#\s]/.test(path)) {
    throw new Error('SITE_BASE must be a URL path such as / or /website/');
  }
  return path ? `/${path}/` : '/';
}
