export const FORMAT = 2;
export const DEFAULTS = Object.freeze({
  speed: 1, activity: 1, style: 'hybrid', stars: true, meteors: true, nebulae: true, clusters: true,
  lens: true, lensStrength: .6, gravity: .55, density: 1, meteorRate: 1, nebulaRate: 1, clusterRate: 1,
  spin: 1, brightness: .85, glow: .6, trails: .65, motionBlur: .3,
  reducedMotion: false, followSystemMotion: true, quality: 'auto', uiScale: 1,popupPosition:null,dismiss:'fade',dock:true,
  viewWidth: 860, viewHeight: 380, viewFeather: 8
});
export const NUMBERS = Object.freeze({ speed: [.1, 10], activity: [0, 2], lensStrength: [0, 1], gravity: [0, 1], density: [.25, 2], meteorRate: [0, 3], nebulaRate: [0, 3], clusterRate: [0, 3], spin: [.1, 3], brightness: [.25, 1.2], glow: [0, 1], trails: [0, 1], motionBlur: [0, 1], uiScale: [.8, 1.25], viewWidth: [314,860], viewHeight: [38,380], viewFeather: [0,32] });
const enumerations = { style: ['realistic', 'scifi', 'hybrid', 'minimal'], quality: ['auto', 'high', 'medium', 'low', 'static'], dismiss: ['fade', 'instant'] };
const plain = v => v && typeof v === 'object' && !Array.isArray(v) && [Object.prototype, null].includes(Object.getPrototypeOf(v));
export const DEVICE_KEYS=Object.freeze(['quality','reducedMotion','followSystemMotion','uiScale','popupPosition','dismiss','dock']);
export const visualConfig=value=>Object.fromEntries(Object.entries(validateConfig(value)).filter(([k])=>!DEVICE_KEYS.includes(k)));
export const deviceConfig=value=>Object.fromEntries(Object.entries(validateConfig(value)).filter(([k])=>DEVICE_KEYS.includes(k)));
function domain(value,device=false){if(!plain(value)||Object.keys(value).some(k=>!Object.hasOwn(DEFAULTS,k)||DEVICE_KEYS.includes(k)!==device))throw Error('配置字段不属于此数据域');return device?deviceConfig(value):visualConfig(value);}
export function validateConfig(input) {
  if (!plain(input)) throw Error('视觉参数必须为 JSON 对象');
  const output = { ...DEFAULTS };
  for (const [key, value] of Object.entries(input)) {
    if (key === 'revealStyle') continue; // retired comparison setting (burst was chosen)
    if (!Object.hasOwn(DEFAULTS, key)) throw Error(`未知视觉参数：${key.slice(0, 32)}`);
    if(key==='popupPosition'){if(value!==null&&(!plain(value)||Object.keys(value).length!==2||!['left','top'].every(k=>Object.hasOwn(value,k)&&Number.isFinite(value[k])&&Math.abs(value[k])<=100000)))throw Error('弹窗位置无效');output[key]=value===null?null:{left:value.left,top:value.top};continue;}
    if (NUMBERS[key]) {
      const [a, b] = NUMBERS[key];
      if (typeof value !== 'number' || !Number.isFinite(value) || value < a || value > b) throw Error(`参数 ${key} 超出范围`);
    } else if (enumerations[key]) {
      if (!enumerations[key].includes(value)) throw Error(`参数 ${key} 无效`);
    } else if (typeof value !== 'boolean') throw Error(`参数 ${key} 必须是布尔值`);
    output[key] = value;
  }
  // 382×120 and 640×260 were the whole (smaller) world before it grew; keep meaning "maximum".
  if ((output.viewWidth === 382 && output.viewHeight === 120) || (output.viewWidth === 640 && output.viewHeight === 260)) { output.viewWidth = DEFAULTS.viewWidth; output.viewHeight = DEFAULTS.viewHeight; }
  return output;
}
export function cleanName(name) {
  if (typeof name !== 'string' || !name.trim() || name.length > 48 || /[\u0000-\u001f\u007f]/u.test(name)) throw Error('预设名称需为 1–48 个可见字符');
  return name.trim();
}
export const BUILTINS = Object.freeze([
  { name: '写实深空', config: { ...DEFAULTS, style: 'realistic', glow: .4 } },
  { name: '科幻跃迁', config: { ...DEFAULTS, style: 'scifi', activity: 1.35, glow: .8, trails: .85 } },
  { name: '宁静星海', config: { ...DEFAULTS, activity: .55, density: .75, glow: .35, spin: .7 } }
].map(p=>({name:p.name,config:visualConfig(p.config)})));
export function freshDocument() { return { formatVersion: FORMAT, revision: 0, config: visualConfig(DEFAULTS), device:deviceConfig(DEFAULTS), presets: BUILTINS.map(p=>({name:p.name,config:visualConfig(p.config)})) }; }
export function validateDocument(input) {
  if (!plain(input)) throw Error('配置文件必须为 JSON 对象');
  if (input.formatVersion !== FORMAT) throw Object.assign(Error('此配置版本不受支持；原文件已保留'), { code: 'FORMAT_UNSUPPORTED' });
  if (Object.keys(input).some(k => !['formatVersion', 'revision', 'config', 'device', 'presets'].includes(k))) throw Error('配置文件包含未知字段');
  if (!Array.isArray(input.presets) || input.presets.length > 32) throw Error('最多保存 32 个预设');
  const names = new Set();
  const presets = input.presets.map(p => {
    if (!plain(p) || Object.keys(p).some(k => !['name', 'config'].includes(k))) throw Error('预设格式无效');
    const name = cleanName(p.name);
    if (names.has(name)) throw Error('预设名称重复'); names.add(name);
    return { name, config: domain(p.config) };
  });
  const revision = input.revision ?? 0;
  if (!Number.isSafeInteger(revision) || revision < 0) throw Error('配置修订号无效');
  return { formatVersion: FORMAT, revision, config: domain(input.config),device:domain(input.device,true), presets };
}
export function migrateV1(input){if(!plain(input)||input.formatVersion!==1||Object.keys(input).some(k=>!['formatVersion','revision','config','presets'].includes(k))||!Array.isArray(input.presets))throw Error('旧配置格式无效');const working=validateConfig(input.config);return validateDocument({formatVersion:FORMAT,revision:input.revision??0,config:visualConfig(working),device:deviceConfig(working),presets:input.presets.map(p=>{if(!plain(p)||Object.keys(p).some(k=>!['name','config'].includes(k)))throw Error('旧预设格式无效');return {name:p.name,config:visualConfig(p.config)};})});}
export function importPreset(text) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > 131072) throw Error('文件过大（上限 128 KB）');
  const parsed = JSON.parse(text);
  if (!plain(parsed) || ![1,FORMAT].includes(parsed.formatVersion)) throw Error('不支持此预设格式版本');
  if (Object.keys(parsed).some(k => !['formatVersion', 'name', 'config'].includes(k))) throw Error('仅可导入视觉参数预设');
  const config=parsed.formatVersion===1?visualConfig(parsed.config):domain(parsed.config);
  return { name: cleanName(parsed.name ?? '导入的预设'), config,...(parsed.formatVersion===1?{notice:'已读取旧视觉预设，本机保护设置保持不变'}:{}) };
}
export function exportPreset(name, config) { return JSON.stringify({ formatVersion: FORMAT, name: cleanName(name), config: visualConfig(config) }, null, 2); }
