import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { parse } from 'node:url';
import {
  resolveStaticPath,
  getMimeType,
  REPO_SRC_ROOT,
} from './targetResolver.js';
import { getMockCommandRouter } from './mockCommandRouter.js';

const PORT = Number(process.env.PORT || 8080);
const router = getMockCommandRouter();

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

function parseCommandFromBody(body, contentType = '') {
  if (!body) {
    return null;
  }

  if (contentType.includes('application/x-www-form-urlencoded')) {
    return new URLSearchParams(body).get('cmd');
  }

  if (contentType.includes('multipart/form-data')) {
    const match = body.match(/name="cmd"\r?\n\r?\n([^\r\n]+)/);
    return match ? match[1] : null;
  }

  return new URLSearchParams(body).get('cmd');
}

async function handleCgi(req, res) {
  try {
    const body = await readBody(req);
    const contentType = req.headers['content-type'] || '';
    const url = parse(req.url || '', true);
    const cmd = url.query.cmd || parseCommandFromBody(body, contentType);

    if (!cmd) {
      res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      });
      res.end('Web Error: cmd is missing from the request');
      return;
    }

    const result = router.execute(String(cmd));
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(result);
  } catch (error) {
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(`Web Error: ${error.message || error}`);
  }
}

function handleStatic(req, res) {
  const urlPath = parse(req.url || '/', true).pathname || '/';

  if (urlPath === '/mock-client' || urlPath === '/mock-client/') {
    res.writeHead(302, { Location: '/target/' });
    res.end();
    return;
  }

  const filePath = resolveStaticPath(urlPath);

  if (!filePath) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`Not found: ${urlPath}`);
    return;
  }

  try {
    const content = readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': getMimeType(filePath) });
    res.end(content);
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`Failed to read ${filePath}: ${error.message}`);
  }
}

const server = createServer(async (req, res) => {
  const method = req.method || 'GET';
  const urlPath = parse(req.url || '/', true).pathname || '/';

  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  if (method === 'POST' && urlPath === '/cgi/cmd.lua') {
    await handleCgi(req, res);
    return;
  }

  if (method === 'GET' && urlPath === '/cgi/cmd.lua') {
    await handleCgi(req, res);
    return;
  }

  if (method === 'GET') {
    handleStatic(req, res);
    return;
  }

  res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Method not allowed');
});

server.listen(PORT, () => {
  console.log('');
  console.log('  idDAS Legacy GUI — mock dev server');
  console.log(`  Static root : ${REPO_SRC_ROOT}`);
  console.log(`  Topology    : http://localhost:${PORT}/target/`);
  console.log(`  Topology D3 : http://localhost:${PORT}/topology-d3/`);
  console.log(`  Settings    : http://localhost:${PORT}/config/platform.settings.json`);
  console.log(`  Common home : http://localhost:${PORT}/`);
  console.log(`  Mock CGI    : POST http://localhost:${PORT}/cgi/cmd.lua`);
  console.log('');
});
