// Bounded, supplied-data components; no model calls or training loop.
const round=(source,revision,principle='clear',critique='explain the change')=>({source,principle,critique,revision});
export const revisionPresets={
 chain:{prompt:'Q',initial:'draft_0',principles:['clear'],rounds:[round('draft_0','revision_1'),round('revision_1','revision_2')]},
 duplicates:{prompt:'Q',initial:'same',principles:['clear'],rounds:[round('same','same'),round('same','same')]},
 whitespace:{prompt:' Q ',initial:' draft ',principles:['clear'],rounds:[round(' draft ',' answer '),round(' answer ','')]},
 broken:{prompt:'Q',initial:'draft_0',principles:['clear'],rounds:[round('draft_0','revision_1'),round('draft_0','revision_2')]},
 unknown:{prompt:'Q',initial:'draft_0',principles:['clear'],rounds:[round('draft_0','revision_1','unknown'),round('revision_1','revision_2')]},
 empty:{prompt:'Q',initial:'draft_0',principles:[],rounds:[]}
};
export function revisionTrace(prompt,initial,principles,rounds){
 const allowed=new Set(principles),pairs=[],rows=[];let current=initial,error=null;
 for(let i=0;i<rounds.length;i++){
  const item=rounds[i],expected=current,checked=error===null;
  const sourceOK=item.source===expected,principleOK=allowed.has(item.principle);
  if(checked){if(!sourceOK||!principleOK)error=i;else{current=item.revision;pairs.push([prompt,current]);}}
  rows.push({...item,expected,checked,sourceOK,principleOK});
 }
 return {prompt,initial,principles:[...principles],rows,error,output:error===null?pairs:null};
}
export function preferenceTrace(logA,logB,clamp){
 const peak=Math.max(logA,logB),weights=[Math.exp(logA-peak),Math.exp(logB-peak)];
 const raw=weights[0]/(weights[0]+weights[1]),p=clamp?Math.min(.6,Math.max(.4,raw)):raw;
 return {logs:[logA,logB],peak,weights,raw,clamp,output:[p,1-p],naive:Math.exp(logA)+Math.exp(logB)};
}
export function preferenceInputs(gap,offset){return [offset+Math.min(gap,0),offset-Math.max(gap,0)];}
export function sigmoid(d){return d>=0?1/(1+Math.exp(-d)):Math.exp(d)/(1+Math.exp(d));}
export function pairLoss(d,q){return Math.max(d,0)-q*d+Math.log1p(Math.exp(-Math.abs(d)));}
export function preferenceLossTrace(scoresA,scoresB,targets){
 const rows=scoresA.map((a,i)=>{const b=scoresB[i],q=targets[i],d=a-b,p=sigmoid(d);return {a,b,q,d,p,linear:Math.max(d,0)-q*d,correction:Math.log1p(Math.exp(-Math.abs(d))),loss:pairLoss(d,q),slope:p-q};});
 const total=rows.reduce((sum,row)=>sum+row.loss,0);
 return {rows,total,output:total/rows.length};
}
export function lossCurve(d,q){
 const span=Math.max(8,Math.abs(d)),optimum=q>0&&q<1?Math.log(q/(1-q)):null;
 const xs=Array.from({length:81},(_,i)=>-span+2*span*i/80);
 xs.push(d);if(optimum!==null&&Math.abs(optimum)<=span)xs.push(optimum);
 const points=[...new Set(xs)].sort((a,b)=>a-b).map(x=>[x,pairLoss(x,q)]);
 return {span,optimum,points,maximum:Math.max(...points.map(x=>x[1]),1)};
}
