import{readFile,writeFile,mkdir,lstat,readlink,symlink,rmdir,copyFile,rename,access}from'node:fs/promises';
import{join,resolve,dirname,sep}from'node:path';import{homedir}from'node:os';import{fileURLToPath}from'node:url';import{createHash}from'node:crypto';import{execFileSync}from'node:child_process';
const NAME='dsh-stellar-effort',root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const home=resolve(process.env.DSH_HOME??join(homedir(),'.dsh'));const profile=process.argv.find(x=>x.startsWith('--profile='))?.slice(10)??'desktop';
if(!/^[a-zA-Z0-9_-]+$/.test(profile))throw Error('Invalid profile name');
const profileRoot=join(home,'profiles',profile),packageFile=join(profileRoot,'package.json'),installRoot=join(home,'plugins',NAME),link=join(profileRoot,'node_modules',NAME);
const uninstall=process.argv.includes('--uninstall');
if(dirname(installRoot)!==join(home,'plugins')||!profileRoot.startsWith(join(home,'profiles')+sep))throw Error('Unsafe installation destination');
if(process.platform==='win32'&&!process.argv.includes('--isolated-test')){
 const result=execFileSync('powershell.exe',['-NoProfile','-Command',"@(Get-Process -Name 'DeepSeek Harness' -ErrorAction SilentlyContinue).Count"],{encoding:'utf8',windowsHide:true});
 if(Number(result.trim())>0)throw Error('请先完全退出 DSH，再安装或卸载星轨推理；不会强制结束用户会话。');
}
let document;try{document=JSON.parse(await readFile(packageFile,'utf8'));}catch{throw Error('目标 profile 不存在或不是有效 JSON，请先运行一次 DSH。');}
const expected='link:'+installRoot.replaceAll('\\','/');
async function exists(path){try{await access(path);return true;}catch{return false;}}
async function ownLink(){try{const stat=await lstat(link);if(!stat.isSymbolicLink())throw Error('同名插件位置不是链接，未覆盖');if(resolve(dirname(link),await readlink(link)).toLowerCase()!==installRoot.toLowerCase())throw Error('同名插件链接指向其他目录，未覆盖');return true;}catch(e){if(e.code==='ENOENT')return false;throw e;}}
const hasLink=await ownLink();
if(await exists(installRoot)){
 let previous;try{previous=JSON.parse(await readFile(join(installRoot,'package.json'),'utf8'));await access(join(installRoot,'release-manifest.json'));}catch{throw Error('同名插件目录没有可验证的安装标记，未移动或覆盖');}
 if(previous.name!==NAME)throw Error('同名目录不属于本插件，未覆盖');
}
if(document.dependencies?.[NAME]&&document.dependencies[NAME].replaceAll('\\','/')!==expected)throw Error('已存在不同来源的同名插件，请先用 DSH 插件管理器处理。');
const stamp=new Date().toISOString().replace(/[:.]/g,'-'),backup=join(home,'plugins',NAME+'-backups',stamp);await mkdir(backup,{recursive:true});await copyFile(packageFile,join(backup,'profile-package.json'));
document.dependencies??={};document.dsh??={};document.dsh.profile??={};document.dsh.profile.bundles??=[];
if(uninstall){
 delete document.dependencies[NAME];document.dsh.profile.bundles=document.dsh.profile.bundles.filter(x=>x!==NAME);
 await writeFile(packageFile+'.stellar.tmp',JSON.stringify(document,null,2)+'\n');await rename(packageFile+'.stellar.tmp',packageFile);
 if(hasLink)await rmdir(link);
 console.log(JSON.stringify({status:'uninstalled',profile,backup,retained:[installRoot,join(home,'stellar-effort')]}));
}else{
 const manifest=JSON.parse(await readFile(join(root,'release-manifest.json'),'utf8'));const stage=join(home,'plugins',NAME+'-stage-'+stamp);await mkdir(stage,{recursive:true});
 for(const entry of manifest.files){const relative=entry.path;if(typeof relative!=='string'||relative.includes('..')||relative.startsWith('/')||relative.includes('\\'))throw Error('Invalid manifest path');const source=resolve(root,relative),target=resolve(stage,relative);if(!source.startsWith(root+sep)||!target.startsWith(stage+sep))throw Error('Unsafe package path');const bytes=await readFile(source);if(createHash('sha256').update(bytes).digest('hex')!==entry.sha256)throw Error('Package fingerprint mismatch: '+relative);await mkdir(dirname(target),{recursive:true});await copyFile(source,target);}
 await copyFile(join(root,'release-manifest.json'),join(stage,'release-manifest.json'));
 let moved=false;
 try{
  if(await exists(installRoot)){await rename(installRoot,join(backup,'previous-package'));moved=true;}
  await rename(stage,installRoot);await mkdir(dirname(link),{recursive:true});if(!hasLink)await symlink(installRoot,link,process.platform==='win32'?'junction':'dir');
  document.dependencies[NAME]=expected;document.dsh.profile.bundles=[...new Set([...document.dsh.profile.bundles,NAME])];
  await writeFile(packageFile+'.stellar.tmp',JSON.stringify(document,null,2)+'\n');await rename(packageFile+'.stellar.tmp',packageFile);
 }catch(error){if(!hasLink&&await ownLink())await rmdir(link);if(moved){if(await exists(installRoot))await rename(installRoot,stage+'-retained');await rename(join(backup,'previous-package'),installRoot);}throw error;}
 console.log(JSON.stringify({status:'installed',version:manifest.version,profile,files:manifest.files.length,installRoot,backup,restartRequired:true}));
}
