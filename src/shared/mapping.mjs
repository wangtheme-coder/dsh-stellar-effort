export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const anchors = Object.freeze({ off: 0, none: 0, minimal: .16, low: 1 / 3, medium: .5, high: 2 / 3, xhigh: 1, 'extra-high': 1, max: 1 });

// Positions describe art direction, never a numeric provider parameter. Preserve
// advertised order and exact identifiers; absent Max is never invented.
export function levelsFor(model) {
  const raw = model?.reasoning?.efforts;
  if (!Array.isArray(raw)) return [];
  const ids = new Set();
  const levels = raw.filter(x => x && typeof x.id === 'string' && !ids.has(x.id) && ids.add(x.id))
    .map((x, i, a) => ({ id: x.id, name: String(x.name ?? x.id), description: String(x.description ?? ''), position: anchors[x.id.toLowerCase()] ?? (a.length < 2 ? 0 : i / (a.length - 1)) }));
  if (levels.some((x, i) => i && x.position <= levels[i - 1].position)) levels.forEach((x, i) => { x.position = levels.length > 1 ? i / (levels.length - 1) : 0; });
  return levels;
}
export function nearestLevel(levels, position) {
  return levels.reduce((best, x) => !best || Math.abs(x.position - position) < Math.abs(best.position - position) ? x : best, undefined);
}
export function selectionKey(s) { return s ? JSON.stringify([s.provider, s.model, s.reasoningEffort ?? null]) : 'null'; }
export function directoryView(snapshot) {
  const current = snapshot?.current;
  const model = snapshot?.groups?.find(g => g.id === current?.provider)?.models?.find(m => m.id === current?.model);
  const levels = levelsFor(model);
  const id = current?.reasoningEffort ?? model?.reasoning?.defaultEffort;
  const actual = levels.find(x => x.id === id);
  let reason = '';
  if (!model || snapshot?.routable === false) reason = '当前模型暂不可用，请先在 DSH 选择模型';
  else if (levels.length < 2) reason = '此模型没有可调节的推理等级';
  else if (!actual) reason = 'DSH 尚未提供可确认的当前等级';
  // Host loading/idle/error with a usable model is transient: input stays
  // blocked, but the universe must not dim as if the control were unsupported.
  const syncing = !reason && !['ready', 'selecting'].includes(snapshot?.status);
  if (syncing) reason = '正在同步 DSH 状态';
  return { current, model, levels, actual, disabled: !!reason, syncing, status: snapshot?.status, reason, fingerprint: JSON.stringify([current?.provider, current?.model, levels.map(x => x.id)]) };
}
