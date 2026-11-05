export class Diagnostics {
  constructor() { this.events = []; this.renderers = new Map(); }
  record(type, data = {}) {
    // Deliberately no session identities, content, provider response text or paths.
    const allowed = ['renderer', 'quality', 'fps', 'reason', 'width', 'height', 'dpr'];
    const value = Object.fromEntries(Object.entries(data).filter(([k, v]) => allowed.includes(k) && ['string', 'number', 'boolean'].includes(typeof v)));
    this.events.push({ time: new Date().toISOString(), type, ...value });
    const cutoff = Date.now() - 7 * 86400000;
    this.events = this.events.filter(e => Date.parse(e.time) >= cutoff).slice(-120);
  }
  update(id, value) { this.renderers.set(id, value); }
  remove(id) { this.renderers.delete(id); }
  clear() { this.events = []; }
  report() { return { plugin: 'dsh-stellar-effort', version: '1.1.5', time: new Date().toISOString(), renderers: [...this.renderers.values()], events: [...this.events], privacy: '仅本地内存摘要，无聊天、凭据、会话标识或遥测上传' }; }
}
