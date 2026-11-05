import { clamp, directoryView, nearestLevel, selectionKey } from './shared/mapping.mjs';
// How long the "changed from X to Y" notice stays (task book 8.6: brief, then gone).
export const NOTICE_MS = 2500;

export class EffortController {
  constructor(directory, { timeout = 5000, available = true, diagnostics } = {}) {
    this.directory = directory; this.timeout = timeout; this.available = available; this.diagnostics = diagnostics;
    this.listeners = new Set(); this.epoch = 0; this.ticket = 0; this.disposed = false; this.pending = null; this.queued = null; this.notice = null;
    this.view = directoryView(directory.store.getSnapshot());
    this.state = { ...this.view, position: this.view.actual?.position ?? 0, phase: 'ready', message: this.view.reason, pressed: false, cancelZone: false };
    this.lastKey = this.authorityKey();
    this.unsubscribe = directory.store.subscribe(() => this.synchronize());
    this.emit();
  }
  subscribe = fn => { this.listeners.add(fn); return () => this.listeners.delete(fn); };
  getSnapshot = () => this.state;
  emit(patch = {}) {
    if (this.disposed) return;
    this.state = { ...this.state, ...this.view, disabled: !this.available || this.view.disabled, syncing: this.available && this.view.syncing, requested: this.requested(), ...patch };
    if (!this.available) this.state.message = '此会话不支持推理等级选择';
    this.listeners.forEach(fn => fn());
  }
  authorityKey() { return this.view.fingerprint + selectionKey(this.view.current); }
  // Where the knob rests without a gesture: the newest in-flight target while it
  // is still being applied, otherwise DSH authority. Prevents the release snap-back.
  resting() {
    const target = this.queued?.target ?? (this.pending && this.state.phase !== 'unknown' ? this.pending.target : null);
    return this.view.levels.find(l => l.id === target?.reasoningEffort)?.position ?? this.view.actual?.position ?? 0;
  }
  // The level being written (queued or in flight), kept apart from DSH authority
  // so the header can say "Off → Max" instead of showing the old value alone.
  requested() {
    const target = this.queued?.target ?? this.pending?.target;
    return this.view.levels.find(l => l.id === target?.reasoningEffort) ?? null;
  }
  refresh() {
    const previous = this.view.status;
    this.view = directoryView(this.directory.store.getSnapshot());
    const key = this.authorityKey();
    if (key !== this.lastKey) { this.epoch++; this.lastKey = key; }
    // A rejected host select leaves the shared directory in 'error' until its
    // inputs resync; one read-only load restores it instead of locking the slider.
    if (this.view.status === 'error' && previous !== 'error') Promise.resolve().then(() => this.disposed || this.directory.load?.()).catch(() => {});
  }
  synchronize() {
    if (this.disposed) return;
    this.refresh();
    if (this.gesture) {
      // A later preview may coexist with our previous serialized write. Its
      // matching echo is expected, rather than an external edit of that preview.
      if(this.pending && this.view.fingerprint===this.pending.fingerprint && this.view.actual?.id===this.pending.target.reasoningEffort && !this.gesture.conflict) this.gesture.epoch=this.epoch;
      if (this.gesture.epoch !== this.epoch) this.gesture.conflict = true;
      this.emit({ message: this.gesture.conflict ? 'DSH 设置已变化，松手将取消本次调整' : this.state.message });
    } else if (this.pending) {
      this.emit({ position: this.resting() });
      this.maybeConfirm();
    } else this.emit({ position: this.resting(), phase: 'ready', message: this.notice && (!this.view.disabled || this.view.syncing) ? this.notice : this.view.reason });
  }
  // A confirmed change is announced briefly; a new gesture or a cancel ends it early.
  announce(text) { clearTimeout(this.noticeTimer); this.notice = text; this.noticeTimer = setTimeout(() => { this.notice = null; if (!this.disposed && !this.gesture && !this.pending) this.emit({ message: this.view.reason }); }, NOTICE_MS); }
  quiet() { clearTimeout(this.noticeTimer); this.notice = null; }
  begin({ pointer = true } = {}) {
    if (this.state.disabled) return false;
    this.quiet();
    this.gesture = { epoch: this.epoch, fingerprint: this.view.fingerprint, conflict: false, pointer };
    this.emit({ phase: 'preview', pressed: pointer, message: '预览中 · 松手后应用', cancelZone: false });
    return true;
  }
  preview(position, cancelZone = false) {
    if (!this.gesture && !this.begin({ pointer: false })) return;
    this.emit({ position: clamp(position), cancelZone, message: cancelZone ? '松手取消 · 回到轨道可继续' : this.gesture.conflict ? 'DSH 设置已变化，松手将取消本次调整' : '预览中 · 确认后应用' });
  }
  cancel(message = '') {
    this.quiet();
    this.gesture = null; this.queued = null;
    this.emit({ position: this.resting(), phase: this.pending ? this.state.phase === 'unknown' ? 'unknown' : 'applying' : 'ready', pressed: false, cancelZone: false, message: message || (this.pending ? '正在确认先前调整' : this.view.reason) });
  }
  async release() {
    if (!this.gesture) return;
    this.synchronize();
    const gesture = this.gesture;
    const level = nearestLevel(this.view.levels, this.state.position);
    if (this.state.cancelZone || gesture.conflict || gesture.fingerprint !== this.view.fingerprint || this.state.disabled || !level) {
      this.cancel(gesture.conflict ? '已取消过时调整，已同步 DSH 当前设置' : '已取消'); return;
    }
    this.gesture = null;
    const target = { ...this.view.current, reasoningEffort: level.id };
    this.emit({ pressed: false, position: level.position, cancelZone: false });
    if (this.pending) {
      if (this.state.phase === 'unknown') { this.cancel('先前调整结果未知，请等待连接与状态恢复'); return; }
      this.queued = { target, fingerprint: this.view.fingerprint }; this.emit({ phase: 'applying', message: '等待先前调整完成，再应用最新选择' }); return;
    }
    return this.commit(target);
  }
  async commit(target) {
    if (this.disposed || this.pending) return;
    this.refresh();
    if (this.view.disabled || target.provider !== this.view.current?.provider || target.model !== this.view.current?.model || !this.view.levels.some(l => l.id === target.reasoningEffort)) { this.cancel('模型已变化，已取消调整'); return; }
    if (target.reasoningEffort === this.view.actual?.id) { this.cancel(''); return; }
    const op = { id: ++this.ticket, target, from: this.view.actual?.name, fingerprint: this.view.fingerprint, accepted: false, timer: null };
    this.pending = op;
    this.emit({ phase: 'applying', message: '正在应用到下一次请求…' });
    op.timer = setTimeout(() => {
      if (this.pending !== op || this.disposed) return;
      this.queued = null; this.emit({ phase: 'unknown', message: '结果尚未确认 · 不会自动重复提交' });
      if (!this.gesture) this.emit({ position: this.resting() });
      this.diagnostics?.record('selection-unknown');
    }, this.timeout);
    try {
      const result = await this.directory.select(target);
      if (this.disposed || this.pending !== op) return;
      if (!result?.ok) { this.finish(op, 'error', result?.error?.code === 'session/writer-held' ? '会话被另一 DSH 实例占用，请关闭重复实例后重试' : 'DSH 未接受调整，已恢复当前真实等级'); return; }
      op.accepted = true;
      this.synchronize(); this.maybeConfirm();
    } catch {
      if (!this.disposed && this.pending === op) {
        // A transport error may happen after the host committed. Never invent a
        // failure or perform a compensating write. A matching projection proves it.
        op.accepted = true;
        this.synchronize();
        if (this.pending === op) { this.queued = null; this.emit({ phase: 'unknown', message: '连接中断，结果未知 · 请等待 DSH 状态恢复' }); if (!this.gesture) this.emit({ position: this.resting() }); }
      }
    }
  }
  maybeConfirm() {
    const op = this.pending;
    if (!op || !op.accepted) return;
    if (this.view.fingerprint !== op.fingerprint) { this.queued = null; this.finish(op, 'conflict', '模型已切换，显示当前 DSH 设置'); }
    else if (this.view.actual?.id === op.target.reasoningEffort && this.view.current?.provider === op.target.provider && this.view.current?.model === op.target.model) { const text = op.from && op.from !== this.view.actual?.name ? `已从 ${op.from} 变更为 ${this.view.actual.name} · 下一次请求生效` : '已应用 · 下一次请求生效'; this.announce(text); this.finish(op, 'ready', text); }
  }
  finish(op, phase, message) {
    if (this.pending !== op) return;
    clearTimeout(op.timer); this.pending = null;
    const queued = this.queued; this.queued = null;
    this.diagnostics?.record(`selection-${phase}`);
    const next = queued && phase === 'ready' && queued.fingerprint === this.view.fingerprint && !this.gesture ? queued : null;
    const nextPosition = this.view.levels.find(l => l.id === next?.target.reasoningEffort)?.position;
    if (!this.gesture) this.emit({ phase, message, position: nextPosition ?? this.view.actual?.position ?? 0 }); else this.emit({ message });
    if (next) void this.commit(next.target);
  }
  dispose() { this.disposed = true; this.quiet(); clearTimeout(this.pending?.timer); this.unsubscribe?.(); this.listeners.clear(); this.pending = null; this.queued = null; this.gesture = null; }
}
