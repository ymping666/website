import {siteRoot,siteBase} from './config.mjs';
import {readdir,readFile,stat} from 'node:fs/promises';
import {join,resolve,sep} from 'node:path';
const root=resolve(siteRoot);
const base=siteBase();
let pages=[],errors=[];
async function walk(dir){for(const de of await readdir(dir,{withFileTypes:true})){const file=join(dir,de.name);if(de.isDirectory())await walk(file);else if(de.name==='index.html')pages.push(file)}}
await walk(root);
import {problems} from '../src/problems.mjs';
import {practiceSets} from '../src/practice-sets.mjs';
import {concepts} from '../src/concepts.mjs';
const trackDirs=(await readdir(join(root,'tracks'),{withFileTypes:true})).filter(x=>x.isDirectory()).length;
const expected=9+practiceSets.length+trackDirs+concepts.length+2*problems.length;
if(pages.length!==expected)errors.push(`Expected ${expected} distinct HTML pages; found ${pages.length}`);
for(const file of pages){
 const html=await readFile(file,'utf8');
 if(!html.includes('<html lang="en">')||!html.includes('<meta name="description"'))errors.push(`Metadata incomplete: ${file}`);
 for(const match of html.matchAll(/(?:href|src)="(\/[^"?#]*)["?#]?/g)){
  const url=match[1]; if(!url.startsWith(base)) {errors.push(`Wrong base ${file}: ${url}`);continue;}
  const local=url.slice(base.length);
  const target=resolve(root,local);
  if(target!==root && !target.startsWith(root+sep)){errors.push(`Unsafe path ${file}: ${url}`);continue;}
  const dest=url.endsWith('/')?join(target,'index.html'):target;
  try{await stat(dest)}catch{errors.push(`Broken link ${file}: ${url}`)}
 }
}
if(errors.length){console.error(errors.slice(0,25).join('\n'));process.exit(1)}
console.log('PASS',pages.length,'English HTML routes and internal asset/navigation links');
