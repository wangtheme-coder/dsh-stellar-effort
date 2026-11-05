import{readFile,writeFile,readdir}from'node:fs/promises';import{resolve,dirname,join,relative}from'node:path';import{fileURLToPath}from'node:url';import{createHash}from'node:crypto';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),files=[];
// What the plugin needs at run time, plus its installer. Previews, tests, docs and source
// images stay in the repository; keep this list in step with "files" in package.json.
const include=['src','dist','scripts','package.json','cordis.patch.yml','README.md','LICENSE','THIRD_PARTY_NOTICES.md','ASSETS_CREDITS.md','install.cmd','uninstall.cmd'];
const skip=()=>false;
async function collect(file){if(skip(relative(root,file).replaceAll('\\','/')))return;const entries=await readdir(file,{withFileTypes:true}).catch(()=>null);if(entries){for(const e of entries)await collect(join(file,e.name));}else{const bytes=await readFile(file);files.push({path:relative(root,file).replaceAll('\\','/'),bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}}
for(const p of include)await collect(resolve(root,p));files.sort((a,b)=>a.path.localeCompare(b.path));const pkg=JSON.parse(await readFile(join(root,'package.json'),'utf8'));
await writeFile(join(root,'release-manifest.json'),JSON.stringify({name:pkg.name,version:pkg.version,generated:new Date().toISOString(),files},null,2)+'\n');console.log(JSON.stringify({files:files.length,totalBytes:files.reduce((n,x)=>n+x.bytes,0)}));
