// Original teaching examples. These functions also drive the static HTML fallback.
export const causalPresets={
 mixed:[[2,1,5],[0,2,4],[3,0,1]],
 uniform:[[0,0,0],[0,0,0],[0,0,0]],
 single:[[3]],empty:[]
};
export function causalTrace(logits=causalPresets.mixed){
 const masked=logits.map((row,i)=>row.map((v,j)=>j>i?-Infinity:v));
 const weights=masked.map(row=>{
  const maximum=Math.max(...row),exp=row.map(v=>Math.exp(v-maximum));
  const sum=exp.reduce((a,b)=>a+b,0);return exp.map(v=>v/sum);
 });
 return {logits:logits.map(row=>[...row]),masked,weights};
}
export const rmsPresets={positive:[1,3],signed:[3,-4],constant:[3,3],zero:[0,0,0],tiny:[0.001,-0.002],single:[-5]};
export function rmsTrace(x=rmsPresets.positive,eps=0.000001){
 const squares=x.map(v=>v*v),meanSquare=squares.reduce((a,b)=>a+b,0)/x.length;
 const denominator=Math.sqrt(meanSquare+eps),output=x.map(v=>v/denominator);
 const mean=x.reduce((a,b)=>a+b,0)/x.length,centered=x.map(v=>v-mean);
 const variance=centered.reduce((a,v)=>a+v*v,0)/x.length;
 const layerNorm=centered.map(v=>v/Math.sqrt(variance+eps));
 return {x:[...x],eps,squares,meanSquare,denominator,output,mean,outputMean:mean/denominator,outputMeanSquare:meanSquare/(meanSquare+eps),layerNorm};
}
export const flowPresets={diagonal:{x0:[-2,-1],x1:[2,3]},opposed:{x0:[3,-2],x1:[-1,2]},stationary:{x0:[1,1],x1:[1,1]}};
export function flowTrace(x0=flowPresets.diagonal.x0,x1=flowPresets.diagonal.x1,t=0.25){
 const sourcePart=x0.map(v=>(1-t)*v),targetPart=x1.map(v=>t*v);
 return {x0:[...x0],x1:[...x1],t,sourcePart,targetPart,output:sourcePart.map((v,i)=>v+targetPart[i]),velocity:x0.map((v,i)=>x1[i]-v)};
}
