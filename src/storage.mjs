import { mkdir, readFile, writeFile, rename, readdir, unlink, copyFile, open } from 'node:fs/promises';
import { join } from 'node:path';
import { freshDocument, validateDocument,migrateV1 } from './shared/config.mjs';
import {randomUUID} from 'node:crypto';

export class ConfigRepository {
  constructor(directory) { this.directory = directory; this.file = join(directory, 'visual.json'); this.queue = Promise.resolve(); this.notice = ''; this.readOnly = false; }
  async initialize() {
    await mkdir(this.directory, { recursive: true });
    let legacy;try{legacy=JSON.parse(await readFile(this.file,'utf8'));}catch{/* normal recovery below */}
    if(legacy?.formatVersion===1){const migrated=migrateV1(legacy);await copyFile(this.file,join(this.directory,`visual.v1-backup-${Date.now()}-${randomUUID()}.json`));await this.atomic(migrated);this.document=migrated;this.notice='旧工作配置已升级，原件已备份，本机保护设置已保留';return this.view();}
    try { this.document = validateDocument(JSON.parse(await readFile(this.file, 'utf8'))); }
    catch (error) {
      if (error.code === 'FORMAT_UNSUPPORTED') { this.readOnly = true; this.notice = error.message; this.document = freshDocument(); return this.view(); }
      if (error.code !== 'ENOENT') {
        await copyFile(this.file, join(this.directory, `visual.corrupt-${Date.now()}.json`));
        const backups = (await readdir(this.directory)).filter(n => /^snapshot-\d+-\d+\.json$/u.test(n)).sort().reverse();
        for (const name of backups) {
          try { const raw=JSON.parse(await readFile(join(this.directory, name), 'utf8'));this.document = raw.formatVersion===1?migrateV1(raw):validateDocument(raw); this.notice = '视觉配置损坏，已恢复有效快照；异常原文件已保留'; break; } catch { /* try the next bounded snapshot */ }
        }
        this.notice ||= '视觉配置损坏，已使用默认值；异常原文件已保留';
      }
      this.document ||= freshDocument();
      await this.atomic(this.document);
    }
    return this.view();
  }
  view() { return { ...structuredClone(this.document), notice: this.notice, readOnly: this.readOnly }; }
  async atomic(document) {
    const tmp = join(this.directory, `visual-${process.pid}-${Date.now()}.tmp`);
    const handle = await open(tmp, 'wx');
    try { await handle.writeFile(JSON.stringify(document, null, 2) + '\n', 'utf8'); await handle.sync(); } finally { await handle.close(); }
    try { await rename(tmp, this.file); } catch (error) { await unlink(tmp).catch(() => {}); throw error; }
  }
  save(candidate, expectedRevision) {
    const operation = this.queue.then(async () => {
      if (this.readOnly) throw Object.assign(Error('未来版本配置受到保护，无法覆盖'), { status: 409, code: 'READ_ONLY' });
      if (expectedRevision !== this.document.revision) throw Object.assign(Error('视觉设置已在其他窗口更新'), { status: 409, code: 'CONFLICT' });
      const next = validateDocument(candidate); next.revision = this.document.revision + 1;
      const stamp = String(Date.now()).padStart(13, '0');
      await writeFile(join(this.directory, `snapshot-${stamp}-${this.document.revision}.json`), JSON.stringify(this.document), { flag: 'wx' });
      await this.atomic(next); this.document = next; this.notice = '';
      const backups = (await readdir(this.directory)).filter(n => /^snapshot-\d+-\d+\.json$/u.test(n)).sort().reverse();
      await Promise.all(backups.slice(5).map(n => unlink(join(this.directory, n))));
      return this.view();
    });
    this.queue = operation.catch(() => {}); return operation;
  }
}
