import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {siteRoot,siteBase} from './config.mjs';
import {attributes} from './meta-descriptions.mjs';

const ico=await readFile(join(siteRoot,'favicon.ico'));
assert.deepEqual(ico,await readFile(new URL('../src/brand/favicon.ico',import.meta.url)),'Built ICO matches brand asset');
assert.ok(ico.length>=54,'ICO has room for a header and three directory entries');
assert.equal(ico.readUInt16LE(0),0,'Reserved field');
assert.equal(ico.readUInt16LE(2),1,'ICO, not a cursor or disguised HTML/PNG');
assert.equal(ico.readUInt16LE(4),3,'Three icon resolutions');
let end=54;
for(const [i,size] of [16,32,48].entries()){
 const entry=6+16*i;
 assert.equal(ico[entry],size);assert.equal(ico[entry+1],size);
 assert.equal(ico[entry+2],0);assert.equal(ico[entry+3],0);
 assert.equal(ico.readUInt16LE(entry+4),1,'One color plane');
 assert.equal(ico.readUInt16LE(entry+6),32,'32-bit RGBA');
 const length=ico.readUInt32LE(entry+8),offset=ico.readUInt32LE(entry+12);
 const maskStride=Math.ceil(size/32)*4,pixelBytes=size*size*4;
 assert.equal(offset,end,'Frames are contiguous and do not overlap the directory');
 assert.equal(length,40+pixelBytes+maskStride*size,'Complete DIB color bitmap and AND mask');
 assert.ok(offset+length<=ico.length,'Frame fits in file');
 const frame=ico.subarray(offset,offset+length);
 assert.equal(frame.readUInt32LE(0),40,'BITMAPINFOHEADER');
 assert.equal(frame.readInt32LE(4),size);assert.equal(frame.readInt32LE(8),size*2);
 assert.equal(frame.readUInt16LE(12),1);assert.equal(frame.readUInt16LE(14),32);
 assert.equal(frame.readUInt32LE(16),0,'Uncompressed BGRA bitmap');
 assert.equal(frame.readUInt32LE(20),pixelBytes);
 let visible=0,transparent=0;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const alpha=frame[40+(y*size+x)*4+3];
  if(alpha)visible++;else transparent++;
  const masked=!!(frame[40+pixelBytes+y*maskStride+(x>>3)]&(1<<(7-x%8)));
  assert.equal(masked,alpha===0,'AND mask agrees with transparent pixels');
 }
 assert.ok(visible>size*size/2,'Icon contains visible artwork');
 assert.ok(transparent>0,'Rounded transparent corners retained');
 end=offset+length;
}
assert.equal(end,ico.length,'No trailing or truncated frames');
const base=siteBase();
assert.equal(await readFile(join(siteRoot,'_headers'),'utf8'),`${base}favicon.ico\n  Content-Type: image/x-icon\n`,'Only the ICO response header is configured');
for(const name of ['icon.svg','favicon-32.png','apple-touch-icon.png']){
 assert.deepEqual(await readFile(join(siteRoot,'assets',name)),await readFile(new URL('../src/brand/'+name,import.meta.url)),`${name} remains unchanged`);
}
let pages=0;
async function walk(directory){
 for(const entry of await readdir(directory,{withFileTypes:true})){
  const path=join(directory,entry.name);
  if(entry.isDirectory())await walk(path);
  else if(entry.name.endsWith('.html')){
   const html=await readFile(path,'utf8'),head=html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1];
   assert.ok(head,`${path}: head exists`);
   const links=[...head.matchAll(/<link\b[^>]*>/gi)].map(m=>attributes(m[0]));
   const icons=links.filter(a=>a.rel==='icon'&&a.href?.endsWith('favicon.ico'));
   assert.equal(icons.length,1,`${path}: exactly one ICO declaration in head`);
   assert.equal(icons[0].href,base+'favicon.ico',`${path}: build-base-aware root icon`);
   assert.equal(icons[0].type,'image/x-icon');
   assert.equal(icons[0].sizes,'16x16 32x32 48x48');
   assert.ok(links.some(a=>a.rel==='icon'&&a.href===base+'assets/icon.svg'),`${path}: SVG retained`);
   pages++;
  }
 }
}
await walk(siteRoot);
assert.ok(pages>0,'Rendered HTML pages checked');
for(const route of ['index.html','zh/index.html']){
 const html=await readFile(join(siteRoot,route),'utf8');
 assert.ok(html.includes(`rel="icon" type="image/png" sizes="32x32" href="${base}assets/favicon-32.png"`));
 assert.ok(html.includes(`rel="apple-touch-icon" sizes="180x180" href="${base}assets/apple-touch-icon.png"`));
}
console.log(`PASS favicon: valid 16/32/48px ICO frames, unchanged brand assets, scoped MIME header and ${pages} HTML references`);
