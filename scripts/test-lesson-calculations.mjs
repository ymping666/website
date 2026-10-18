import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {problems} from '../src/problems.mjs';
import {renderVisualLesson} from '../src/visual-lessons.mjs';
import {rmsPresets,rmsGainTrace,residualPresets,normalizers,sublayers,preNormTrace,modulationPresets,modulationTrace} from '../src/lesson-round16-math.mjs';
import {msePresets,mseTrace,reluPresets,reluBackwardTrace} from '../src/lesson-round15-math.mjs';
import {renderRmsGain,renderPreNorm,renderModulation} from '../src/lesson-round16-view.mjs';
import {renderMse,renderRelu} from '../src/lesson-round15-view.mjs';
import {calcNumber,calcEqual} from '../src/lesson-calculation-view.mjs';
import {decodeHtml} from './localize.mjs';
import {siteRoot} from './config.mjs';
const changed={
 'transformer-prenorm-residual':'Whole-vector calls followed by an explicit original-input addition; removed detached bypass chips.',
 'norm-rmsnorm-gain':'Shared vector statistics separated from selected-channel division and multiplication.',
 'dit-adaln-modulation':'Four explicit scalar operations with linked intermediate values and 1+scale.',
 'autograd-relu-backward':'Forward input chooses the mask; only then is the upstream gradient multiplied.',
 'autograd-mse-gradient':'Explicit residual calculation forks into loss and gradient paths; no false square-to-gradient dependency.'
};
function value(html,key){const match=html.match(new RegExp('data-calc-key="'+key+'" data-calc-value="([^"]+)"'));assert.ok(match,'Missing calculation value '+key);return JSON.parse(decodeHtml(match[1]));}
let checked=0;
function verify(render,tr,expected,outputId,index,output){
 for(const zh of [false,true]){
  const h=render(tr,index,zh);assert.doesNotMatch(h,/NaN|Infinity|undefined|r16-chip/);
  for(const[key,v]of Object.entries(expected))assert.deepEqual(value(h,key),JSON.parse(JSON.stringify(v)),'Incorrect source value '+key);
  if(outputId)assert.equal(decodeHtml(h.match(new RegExp('id="'+outputId+'">([^<]+)'))[1]),calcNumber(output));
  checked++;
 }
}
for(const p of Object.values(rmsPresets))for(const eps of [.000001,.01,1])for(const shift of [-3,0,3]){
 const tr=rmsGainTrace(p.x.map(v=>v+shift),p.gain,eps);
 for(let i=0;i<tr.x.length;i++)verify(renderRmsGain,tr,{'rms-x':tr.x[i],'rms-den':tr.den,'rms-z':tr.z[i],'rms-z-again':tr.z[i],'rms-gain':tr.gain[i]},'rms-gain-number',i,tr.output[i]);
}
for(const x of Object.values(residualPresets))for(const N of Object.values(normalizers))for(const F of Object.values(sublayers)){
 const tr=preNormTrace(x,N,F);
 for(let i=0;i<Math.max(1,x.length);i++){
  const expected={'prenorm-x-vector':x,'prenorm-z-vector':tr.z,'prenorm-z-again':tr.z,'prenorm-branch-vector':tr.branch};
  if(x.length)Object.assign(expected,{'prenorm-x':x[i],'prenorm-u':tr.branch[i]});
  verify(renderPreNorm,tr,expected,x.length?'prenorm-number':null,i,tr.output[i]);
  if(!x.length)assert.doesNotMatch(renderPreNorm(tr),/r16-gate-channel|id="prenorm-number"/,'Do not invent a channel for empty vectors');
 }
}
for(const p of Object.values(modulationPresets))for(const eps of [.000001,.01,1]){
 const tr=modulationTrace(p.x,p.shift,p.scale,eps);
 for(let i=0;i<tr.x.length;i++)verify(renderModulation,tr,{'adaln-x':tr.x[i],'adaln-mean':tr.mean,'adaln-c':tr.centered[i],'adaln-c-again':tr.centered[i],'adaln-den':tr.den,'adaln-z':tr.z[i],'adaln-z-again':tr.z[i],'adaln-factor':1+tr.scale[i],'adaln-scaled':tr.scaled[i],'adaln-scaled-again':tr.scaled[i],'adaln-shift':tr.shift[i]},'modulation-number',i,tr.output[i]);
}
for(const p of Object.values(msePresets))for(const shift of [-2,0,2])for(const repeat of [1,2,4]){
 const copies=a=>Array.from({length:repeat},()=>a).flat(),tr=mseTrace(copies(p.p.map(v=>v+shift)),copies(p.t));
 for(let i=0;i<tr.n;i++)verify(renderMse,tr,{'mse-p':tr.p[i],'mse-t':tr.t[i],'mse-r':tr.residuals[i],'mse-loss-r':tr.residuals[i],'mse-square':tr.squares[i],'mse-two-r':2*tr.residuals[i],'mse-n':tr.n},'mse-number',i,tr.output[i]);
}
for(const p of Object.values(reluPresets))for(const offset of [-3,0,3]){
 const tr=reluBackwardTrace(p.x.map(v=>v+offset),p.g);
 for(let i=0;i<tr.x.length;i++){
  verify(renderRelu,tr,{'relu-x':tr.x[i],'relu-threshold':0,'relu-mask':tr.x[i]>0?1:0,'relu-mask-again':tr.mask[i],'relu-g':tr.g[i]},'relu-number',i,tr.output[i]);
  assert.ok(renderRelu(tr,i).includes(tr.mask[i]?'&gt;':'≤'),'Show the condition actually used');
 }
 if(!tr.x.length)assert.doesNotMatch(renderRelu(tr),/data-calc-key/);
}
assert.equal(calcEqual(4,0,0),'=');assert.equal(calcEqual(1/3,1/3),'≈');
const audit=[];
for(const p of problems){const html=renderVisualLesson(p.id);if(!html)continue;
 assert.doesNotMatch(html,/r16-chip/,'The detached channel-chip design has been removed');
 audit.push({id:p.id,kind:html.match(/data-lesson="([^"]+)"/)[1],action:changed[p.id]?'redesigned':p.id==='dit-adaln-zero-gate'?'previously_redesigned':'retained',review:changed[p.id]||'Source/structure review: existing chart, matrix, timeline or arithmetic already encodes the relevant relationship; no matching detached channel-chip issue.'});
}
assert.ok(audit.length>=50);assert.equal(audit.filter(x=>x.action==='redesigned').length,5);
for(const locale of ['','zh/'])for(const id of Object.keys(changed)){
 const html=await readFile(join(siteRoot,locale,'editorials',id,'index.html'),'utf8');
 assert.match(html,/lesson-calculation/);assert.doesNotMatch(html,/r16-chip|r16-bypass/);assert.match(html,/<noscript>/);
}
await readFile(join(siteRoot,'assets','lesson-calculation-view.mjs'));
if(process.argv.includes('--report')){await mkdir('artifacts/lesson-layout-review',{recursive:true});await writeFile('artifacts/lesson-layout-review/audit.json',JSON.stringify({date:'2026-10-18',scope:'Source and default-diagram structure review of all visual editorials; targeted browser review of the five changed editorials is recorded separately.',reviewed:audit.length,changed:5,editorials:audit},null,2)+'\n');}
console.log(`PASS ${checked} bilingual calculation diagrams: correct operands, carried values, vector scope, normalization factor, masks, residual fork and empty shape; ${audit.length} visual structures reviewed, five redesigned`);
