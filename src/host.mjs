import { join } from 'node:path';
import { homedir } from 'node:os';
import { ConfigRepository } from './storage.mjs';

export const name = 'dsh-stellar-effort';
export const inject = ['webServer', 'connection'];
export const VERSION = '1.1.5';

export function json(response, status, value) {
  const body = JSON.stringify(value);
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'content-length': Buffer.byteLength(body) });
  response.end(body);
}
export async function readJson(request) {
  let size = 0; const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 131072) throw Object.assign(Error('文件过大'), { status: 413 });
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw Object.assign(Error('JSON 格式无效'), { status: 400 }); }
}
export function isSameOrigin(request) {
  const origin = request.headers.origin;
  const site = request.headers['sec-fetch-site'];
  if (site && !['same-origin', 'none'].includes(site)) return false;
  // The Desktop shell uses a private, fixed application origin. It still must
  // pass the host's authenticated connection admission below.
  return !origin || origin === 'dsh-app://app' || ['http:', 'https:'].some(p => origin === `${p}//${request.headers.host}`);
}
export function createHandler(repository, connection) {
  return (request, response) => void (async () => {
    if (new URL(request.url || '/', 'http://localhost').pathname !== '/.stellar-effort/config') return json(response, 404, { error: 'not-found' });
    const verdict = connection.admit?.(request);
    const admitted = verdict ? !!verdict.peer && !Object.hasOwn(verdict, 'rejection') : connection.isAuthenticated?.(request) === true;
    if (!admitted) return json(response, 401, { error: 'authentication-required' });
    if (!isSameOrigin(request)) return json(response, 403, { error: 'cross-origin' });
    if (request.method === 'GET') return json(response, 200, repository.view());
    if (request.method !== 'PUT') return json(response, 405, { error: 'method-not-allowed' });
    if (request.headers['x-stellar-intent'] !== 'visual-config' || request.headers['content-type']?.split(';')[0].trim() !== 'application/json') return json(response, 403, { error: 'visual-intent-required' });
    const body = await readJson(request);
    if (!body || Object.keys(body).some(k => !['document', 'expectedRevision'].includes(k))) return json(response, 400, { error: 'invalid-fields' });
    const result = await repository.save(body.document, body.expectedRevision);
    return json(response, 200, result);
  })().catch(error => {
    if (response.headersSent) return response.end();
    json(response, error.status ?? 400, { error: error.code === 'CONFLICT' ? 'conflict' : error.code === 'READ_ONLY' ? 'read-only' : 'invalid-visual-config' });
  });
}
export async function apply(ctx, config = {}) {
  const directory = config.dataDir ?? join(process.env.DSH_HOME ?? join(homedir(), '.dsh'), 'stellar-effort');
  const repository = new ConfigRepository(directory); await repository.initialize();
  ctx.effect(() => ctx.webServer.register({ kind: 'prefix', path: '/.stellar-effort', handler: createHandler(repository, ctx.connection) }), 'stellar-effort: visual configuration');
}
