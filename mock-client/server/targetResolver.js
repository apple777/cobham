import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, normalize, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
export const REPO_SRC_ROOT = normalize(join(__dirname, '..', '..', 'src'));
export const MOCK_CLIENT_ROOT = normalize(join(__dirname, '..'));

/** Paths that live under msdh/ when requested via /target/ */
const MSDH_ONLY = new Set([
  '',
  'index.html',
  'header.html',
  'features.html',
  'initial_setup',
  'status',
  'code.js',
  'styles.css',
]);

/**
 * Resolve a /target/... URL to a file under src/.
 * @param {string} requestPath e.g. /target/profiles/code.js
 * @returns {string|null} absolute filesystem path
 */
export function resolveTargetPath(requestPath) {
  let subPath = requestPath.replace(/^\/target\/?/i, '').replace(/\/$/, '');

  if (!subPath) {
    return join(REPO_SRC_ROOT, 'msdh', 'index.html');
  }

  if (subPath === 'header.html') {
    return join(REPO_SRC_ROOT, 'msdh', 'header.html');
  }

  if (subPath === 'features.html') {
    return join(REPO_SRC_ROOT, 'msdh', 'features.html');
  }

  const candidates = [];

  if (MSDH_ONLY.has(subPath) || subPath.startsWith('initial_setup') || subPath.startsWith('status')) {
    candidates.push(join(REPO_SRC_ROOT, 'msdh', subPath));
    if (!extname(subPath)) {
      candidates.push(join(REPO_SRC_ROOT, 'msdh', subPath, 'index.html'));
    }
  }

  candidates.push(join(REPO_SRC_ROOT, subPath));
  if (!extname(subPath)) {
    candidates.push(join(REPO_SRC_ROOT, subPath, 'index.html'));
  }

  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) {
      return candidate;
    }
  }

  return null;
}

/**
 * Resolve any static asset path under src/.
 * @param {string} requestPath
 * @returns {string|null}
 */
export function resolveStaticPath(requestPath) {
  const cleanPath = requestPath.split('?')[0];
  if (cleanPath === '/' || cleanPath === '') {
    return join(REPO_SRC_ROOT, 'index.html');
  }

  if (cleanPath.startsWith('/target')) {
    return resolveTargetPath(cleanPath);
  }

  if (cleanPath.startsWith('/topology-d3')) {
    const sub = cleanPath.replace(/^\/topology-d3\/?/, '') || 'index.html';
    const candidates = [
      join(MOCK_CLIENT_ROOT, 'topology-d3', sub),
      join(MOCK_CLIENT_ROOT, 'topology-d3', sub, 'index.html'),
    ];
    if (!extname(sub)) {
      candidates.unshift(join(MOCK_CLIENT_ROOT, 'topology-d3', sub, 'index.html'));
      if (!sub) candidates.unshift(join(MOCK_CLIENT_ROOT, 'topology-d3', 'index.html'));
    }
    for (const candidate of candidates) {
      if (existsSync(candidate) && statSync(candidate).isFile()) {
        return candidate;
      }
    }
  }

  if (cleanPath.startsWith('/config/')) {
    const configPath = join(MOCK_CLIENT_ROOT, cleanPath.replace(/^\//, ''));
    if (existsSync(configPath) && statSync(configPath).isFile()) {
      return configPath;
    }
  }

  const relativePath = cleanPath.replace(/^\//, '');
  const absolutePath = join(REPO_SRC_ROOT, relativePath);

  if (existsSync(absolutePath) && statSync(absolutePath).isFile()) {
    return absolutePath;
  }

  return null;
}

export const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.lua': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

export function getMimeType(filePath) {
  return MIME_TYPES[extname(filePath).toLowerCase()] || 'application/octet-stream';
}
