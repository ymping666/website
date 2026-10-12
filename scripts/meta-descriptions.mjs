import {readdir,readFile,mkdir,writeFile} from 'node:fs/promises';
import {join,relative,sep,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {siteRoot,siteBase} from './config.mjs';

export const decodeAttribute = value => value.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi,(_,entity)=>{
 if(entity[0]==='#')return String.fromCodePoint(parseInt(entity.slice(entity[1].toLowerCase()==='x'?2:1),entity[1].toLowerCase()==='x'?16:10));
 return {amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"}[entity.toLowerCase()];
});
export const characterCount = value => [...value].length;
export function attributes(tag) {
 return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)].map(m=>[m[1].toLowerCase(),decodeAttribute(m[2]??m[3]??m[4])]));
}
export function descriptions(html) {
 return [...html.matchAll(/<meta\b[^>]*>/gi)].map(m=>attributes(m[0])).filter(a=>a.name?.toLowerCase()==='description').map(a=>a.content??'');
}
// Everything except the three description fields must remain byte-for-byte identical.
export const nonDescriptionHash = html => createHash('sha256').update(html.replace(/<meta\b[^>]*>/gi,tag=>{
 const a=attributes(tag),key=a.name||a.property;
 return ['description','og:description','twitter:description'].includes(key)?tag.replace(/content="[^"]*"/, 'content="__DESCRIPTION__"'):tag;
})).digest('hex');
export async function inspectDescriptions(root=siteRoot) {
 const pages=[];
 const origin=(process.env.SITE_ORIGIN||'https://tensordrill.com').replace(/\/$/,'');
 async function walk(directory) {
  for(const entry of (await readdir(directory,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))) {
   const file=join(directory,entry.name);
   if(entry.isDirectory())await walk(file);
   else if(entry.name.endsWith('.html')) {
    const html=await readFile(file,'utf8'),path=relative(root,file).split(sep).join('/'),values=descriptions(html);
    const description=values[0]??'',length=characterCount(description),language=attributes(html.match(/<html\b[^>]*>/i)?.[0]||'').lang;
    const route=path==='index.html'?'':path.replace(/\/index\.html$/,'/');
    pages.push({path,url:origin+siteBase()+route,language,description,length,count:values.length,nonDescriptionHash:nonDescriptionHash(html)});
   }
  }
 }
 await walk(root);return pages;
}
export async function writeAudit(label) {
 const pages=await inspectDescriptions(),invalid=pages.filter(p=>p.count!==1||p.length<25||p.length>160);
 const protectedFiles={};
 for(const name of ['robots.txt','sitemap.xml','ads.txt']) {
  try {protectedFiles[name]=createHash('sha256').update(await readFile(join(siteRoot,name))).digest('hex');}
  catch(error){if(error.code!=='ENOENT')throw error;}
 }
 const directory='artifacts/meta-descriptions';await mkdir(directory,{recursive:true});
 await writeFile(join(directory,label+'.json'),JSON.stringify({pages,invalid,protectedFiles},null,2)+'\n');
 const cell=v=>String(v).replace(/\|/g,'\\|').replace(/\n/g,' ');
 await writeFile(join(directory,label+'.md'),`# Meta description audit: ${label}\n\n${pages.length} HTML pages; ${invalid.length} outside 25–160 characters or missing/duplicate descriptions.\n\n| URL | Language | Characters | Original description |\n| --- | --- | ---: | --- |\n`+invalid.map(p=>`| ${cell(p.url)} | ${p.language} | ${p.length} | ${cell(p.description)} |`).join('\n')+'\n');
 for(const lang of ['en','zh-CN']) {
  const rows=pages.filter(p=>p.language===lang),bad=invalid.filter(p=>p.language===lang);
  console.log(`${lang}: ${rows.length} pages; ${bad.length} outside 25–160; ${rows.filter(p=>p.length>=120&&p.length<=155).length} within 120–155`);
 }
 console.log(`Full descriptions and abnormal URLs: ${directory}/${label}.json and ${label}.md`);
 return {pages,invalid};
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]))await writeAudit(process.argv[2]||'audit');
