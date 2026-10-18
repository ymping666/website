// Small original examples for four independent, supplied-data components.
export const rmsPresets={
 constant:{x:[3,3],gain:[2,-1]},mixed:{x:[3,4],gain:[1,2]},zero:{x:[0,0],gain:[2,3]},
 zeroGain:{x:[1,-2,3],gain:[0,0,0]},single:{x:[-2],gain:[3]}
};
export function rmsGainTrace(x,gain,eps){
 const squares=x.map(v=>v*v),meanSquare=squares.reduce((a,b)=>a+b,0)/x.length,den=Math.sqrt(meanSquare+eps),z=x.map(v=>v/den);
 return {x,gain,eps,squares,meanSquare,den,z,output:z.map((v,i)=>v*gain[i])};
}
export function layerStats(x,eps){
 const mean=x.reduce((a,b)=>a+b,0)/x.length,centered=x.map(v=>v-mean),squares=centered.map(v=>v*v),variance=squares.reduce((a,b)=>a+b,0)/x.length,den=Math.sqrt(variance+eps);
 return {mean,centered,variance,den,z:centered.map(v=>v/den)};
}
export const residualPresets={basic:[1,3],three:[2,4,6],constant:[2,2],empty:[]};
export const normalizers={
 center:v=>v.length?v.map(x=>x-v.reduce((a,b)=>a+b,0)/v.length):[],
 identity:v=>[...v],layer:v=>v.length?layerStats(v,.01).z:[]
};
export const sublayers={double:v=>v.map(x=>2*x),negative:v=>v.map(x=>-x),zero:v=>v.map(()=>0),square:v=>v.map(x=>x*x)};
export function preNormTrace(x,normalize,sublayer){
 const calls=[{fn:'normalize',input:[...x]}],z=normalize(x);calls.push({fn:'sublayer',input:[...z]});const branch=sublayer(z);
 return {x,z,branch,calls,output:x.map((v,i)=>v+branch[i])};
}
export const modulationPresets={
 basic:{x:[1,3],shift:[1,2],scale:[0,1]},neutral:{x:[1,3],shift:[0,0],scale:[0,0]},
 constant:{x:[2,2],shift:[3,4],scale:[8,9]},cancel:{x:[1,3],shift:[5,6],scale:[-1,-1]},
 three:{x:[-2,0,4],shift:[1,-1,0],scale:[.5,0,-2]}
};
export function modulationTrace(x,shift,scale,eps){
 const stats=layerStats(x,eps),factor=scale.map(v=>1+v),scaled=stats.z.map((v,i)=>v*factor[i]);
 return {x,shift,scale,eps,...stats,factor,scaled,output:scaled.map((v,i)=>v+shift[i])};
}
export const gatePresets={
 zero:{x:[1,2],block:[4,4],gate:[0,0]},signed:{x:[1,2],block:[4,4],gate:[.5,-.5]},
 large:{x:[1,2],block:[100,-50],gate:[0,0]},outside:{x:[0,0,0],block:[1,2,3],gate:[1,0,2]},
 empty:{x:[],block:[],gate:[]}
};
export function gatedResidualTrace(x,block,gate){
 const update=block.map((v,i)=>v*gate[i]);return {x,block,gate,update,allZero:gate.every(v=>v===0),output:x.map((v,i)=>v+update[i])};
}
