import { FORMAT,freshDocument, validateDocument, validateConfig, cleanName,visualConfig,deviceConfig } from './shared/config.mjs';

export class VisualPreferences {
  constructor(adapter) {
    this.adapter = adapter; this.listeners = new Set(); this.undoStack = []; this.redoStack = []; this.gestureBase = null;
    const initial=freshDocument();this.state = { ...initial,config:{...initial.config,...initial.device}, status: 'loading', notice: '', readOnly: false }; this.version = 0;this.savedVersion=0; this.saving = false; this.pending = false; this.disposed = false;
    this.baselineReady=false;this.readGeneration=0;this.writeEpoch=0;
  }
  subscribe = fn => { this.listeners.add(fn); return () => this.listeners.delete(fn); };
  getSnapshot = () => this.state;
  emit(patch = {}) { if (this.disposed) return; this.state = { ...this.state, ...patch }; this.listeners.forEach(fn => fn()); }
  async load({discard=false}={}) {
    const version=this.version,epoch=this.writeEpoch;
    if(this.disposed)return false;
    if(this.saving){this.emit({notice:'正在确认保存，请稍后重新读取'});return false;}
    if(this.version!==this.savedVersion&&!discard){this.emit({notice:'尚未确认的修改已保留；可先导出草稿，再确认重新读取'});return false;}
    const generation=++this.readGeneration;
    if(discard){clearTimeout(this.timer);this.emit({status:'loading',notice:'正在重新读取，成功前仍保留当前草稿'});}
    const current=()=>!this.disposed&&generation===this.readGeneration&&version===this.version&&epoch===this.writeEpoch;
    const preserveNewDraft=()=>{if(discard&&!this.disposed&&generation===this.readGeneration&&epoch===this.writeEpoch)this.emit({status:'offline',notice:'读取期间出现新修改，草稿已保留，请保存或重新读取'});};
    try {
      const raw = await this.adapter.read();
      if(!current()){preserveNewDraft();return false;}
      const {notice,readOnly,...document} = raw;
      const value = validateDocument(document);
      this.baselineReady=!readOnly;this.savedVersion=version;if(discard){this.undoStack=[];this.redoStack=[];this.gestureBase=null;}
      this.emit({ ...value,config:{...value.config,...value.device}, status: readOnly ? 'protected' : 'saved', notice: notice || '', readOnly: !!readOnly });return true;
    } catch { if(current())this.emit({ status: 'offline', notice: '视觉设置未能从宿主读取；草稿已保留，未确认保存' });else preserveNewDraft();return false; }
  }
  beginGesture() { this.gestureBase ??= visualConfig(this.state.config); }
  endGesture() { if (this.gestureBase && JSON.stringify(this.gestureBase) !== JSON.stringify(visualConfig(this.state.config))) this.pushUndo(this.gestureBase); this.gestureBase = null;if(this.version!==this.savedVersion)this.schedule(); }
  pushUndo(config) { this.undoStack.push(visualConfig(config)); this.undoStack = this.undoStack.slice(-40); this.redoStack = []; }
  change(patch, { history = true } = {}) {
    if (this.state.readOnly) return;
    const next = validateConfig({ ...this.state.config, ...patch });
    if (JSON.stringify(next) === JSON.stringify(this.state.config)) return;
    if (history && !this.gestureBase&&JSON.stringify(visualConfig(next))!==JSON.stringify(visualConfig(this.state.config))) this.pushUndo(this.state.config);
    this.version++; this.emit({ config: next,device:deviceConfig(next) }); if (!this.gestureBase) this.schedule();
  }
  applyVisual(config){this.change(visualConfig(config));}
  undo() { if (!this.undoStack.length || this.state.readOnly) return; this.redoStack.push(visualConfig(this.state.config));const next={...this.undoStack.pop(),...deviceConfig(this.state.config)};this.version++; this.emit({ config: next }); this.schedule(); }
  redo() { if (!this.redoStack.length || this.state.readOnly) return; this.undoStack.push(visualConfig(this.state.config));const next={...this.redoStack.pop(),...deviceConfig(this.state.config)};this.version++; this.emit({ config: next }); this.schedule(); }
  setPresets(presets) {
    if (this.state.readOnly) return;
    const next = validateDocument({ formatVersion: FORMAT, revision: this.state.revision, config: visualConfig(this.state.config),device:deviceConfig(this.state.config), presets });
    this.version++; this.emit({ presets: next.presets }); this.schedule();
  }
  savePreset(name, config = this.state.config) {
    name = cleanName(name);
    const existing = this.state.presets.findIndex(p => p.name === name);
    const list = structuredClone(this.state.presets);
    const next = { name, config: visualConfig(config) };
    if (existing < 0) list.push(next); else list[existing] = next;
    this.setPresets(list);
  }
  schedule() {
    if (this.state.readOnly || ['offline', 'loading', 'conflict'].includes(this.state.status)) return;
    clearTimeout(this.timer); this.emit({ status: 'saving' });
    this.timer = setTimeout(() => void this.flush(), 250);
  }
  flush() {
    clearTimeout(this.timer);
    if (this.saving) { this.pending = true; return this.inFlight; }
    if(!this.baselineReady){this.emit({notice:'尚未取得可保存的配置；临时修改已保留，请确认重新读取后再处理'});return Promise.resolve(false);}
    if (this.disposed || this.state.readOnly || ['loading', 'conflict'].includes(this.state.status)) return Promise.resolve(false);
    if(this.savedVersion===this.version)return Promise.resolve(this.state.status==='saved');
    this.saving = true;this.writeEpoch++; const version = this.version;
    const document = validateDocument({ formatVersion: FORMAT, revision: this.state.revision, config: visualConfig(this.state.config),device:deviceConfig(this.state.config), presets: this.state.presets });
    this.inFlight=(async()=>{
    try {
      const result = await this.adapter.write(document, document.revision);
      if (this.disposed) return;
      this.savedVersion=version;
      this.emit({ revision: result.revision, status: version === this.version ? 'saved' : 'saving', notice: '' });
    } catch (error) {
      if (error?.code === 'CONFLICT') {
        this.emit({ status: 'conflict', notice: '其他窗口更新了视觉配置；请重新读取后再调整，当前草稿未覆盖对方设置' });
      } else this.emit({ status: 'offline', notice: '视觉配置保存未确认；当前仅临时生效，可导出备份或重新读取' });
    } finally {
      this.saving = false;
      if ((this.pending || version !== this.version) && this.state.status === 'saving') { this.pending = false;return this.flush(); }
    }
    return this.state.status==='saved';})();return this.inFlight;
  }
  dispose() { if(this.disposal)return this.disposal;this.readGeneration++;clearTimeout(this.timer);this.listeners.clear();this.disposal=this.flush().then(saved=>{this.disposed=true;return saved;});return this.disposal; }
}
export function hostPreferences() {
  return {
    async read() { const response = await fetch('/.stellar-effort/config', { credentials: 'same-origin', cache: 'no-store' }); if (!response.ok) throw Error('read failed'); return response.json(); },
    async write(document, expectedRevision) {
      const response = await fetch('/.stellar-effort/config', { method: 'PUT', credentials: 'same-origin', headers: { 'content-type': 'application/json', 'x-stellar-intent': 'visual-config' }, body: JSON.stringify({ document, expectedRevision }) });
      if (!response.ok) throw Object.assign(Error('save failed'), { code: response.status === 409 ? 'CONFLICT' : 'SAVE_FAILED' });
      return response.json();
    }
  };
}
