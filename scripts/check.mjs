import{readdir,readFile}from'node:fs/promises';import{resolve,dirname,join}from'node:path';import{fileURLToPath}from'node:url';import{spawnSync}from'node:child_process';import{createContext,runInContext}from'node:vm';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');let checked=0;
async function visit(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const file=join(dir,entry.name);if(entry.isDirectory())await visit(file);else if(/\.(mjs|js)$/.test(entry.name)){const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8',windowsHide:true});if(result.status!==0)throw Error(result.stderr);checked++;}}}
await visit(join(root,'src'));await visit(join(root,'scripts'));await visit(join(root,'test'));await visit(join(root,'dist'));
let registered;runInContext(await readFile(join(root,'dist/client.js'),'utf8'),createContext({window:{__ModuleLoader__:{load:value=>{registered=value;}}}}));if(registered?.id!=='dsh-stellar-effort'||typeof registered.factory!=='function')throw Error('Invalid client module registration');
console.log(JSON.stringify({syntaxFiles:checked,clientModuleContract:'valid'}));
