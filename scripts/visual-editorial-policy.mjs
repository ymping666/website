import {readFileSync} from 'node:fs';
import {renderVisualLesson,renderLessonResources} from '../src/visual-lessons.mjs';

// This is a fixed, shrinking backlog, never an exemption for future additions.
export const legacyTextEditorialIds=Object.freeze(JSON.parse(readFileSync(new URL('./legacy-text-editorials.json',import.meta.url),'utf8')));

export function assertVisualEditorialCoverage(catalog,{lesson=renderVisualLesson,resources=renderLessonResources,legacyIds=legacyTextEditorialIds}={}){
 const exemptions=new Set(legacyIds),known=new Set(catalog.map(p=>p.id)),required=[];
 if(exemptions.size!==legacyIds.length)throw Error('Duplicate legacy editorial exemptions');
 for(const id of exemptions)if(!known.has(id))throw Error('Remove stale legacy editorial exemption: '+id);
 for(const {id} of catalog){
  const visual=lesson(id),sources=resources(id);
  const hasVisual=typeof visual==='string'&&/<section\b[^>]*class="[^"]*\bvisual-lesson\b/.test(visual)&&/data-lesson="[^"]+"/.test(visual)&&/<h2\b/.test(visual)&&/<noscript>/.test(visual);
  if(exemptions.has(id)){
   if(visual)throw Error('Visual editorial upgraded; remove its legacy exemption: '+id);
   continue;
  }
  if(!hasVisual)throw Error('New/published problem requires a complete bilingual visual editorial: '+id);
  if(typeof sources!=='string'||!sources.includes('class="lesson-resources"'))throw Error('Visual editorial requires bottom reference resources: '+id);
  required.push(id);
 }
 return required;
}

export function assertBuiltVisualEditorial(html,id,locale){
 if(!html.includes(`lang="${locale==='zh'?'zh-CN':'en'}"`))throw Error('Editorial language mismatch: '+locale+'/'+id);
 const visual=html.indexOf('<section class="visual-lesson"'),code=html.indexOf('<pre class="code-pre">'),sources=html.indexOf('<section class="lesson-resources">');
 if(!(visual>=0&&code>visual&&sources>code)||!html.slice(visual,code).includes('<noscript>'))throw Error('Missing built visual editorial/static fallback or misplaced references: '+locale+'/'+id);
 const title=html.slice(visual,code).match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/)?.[1]?.replace(/<[^>]*>/g,'').trim();
 if(!title||(locale==='zh'?!/[\u3400-\u9fff]/.test(title):/[\u3400-\u9fff]/.test(title)))throw Error('Visual editorial heading is not localized: '+locale+'/'+id);
}
