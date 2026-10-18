// Original small supplied-data examples; each helper leaves its inputs unchanged.
export const linearPresets={
 basic:{x:[1,2],w:[[2,3],[1,-1]],b:[4,1],g:[1,-2]},
 rectangular:{x:[1,-2,3],w:[[2,0,-1],[0,1,2]],b:[1,-1],g:[2,-1]},
 zero:{x:[0,0],w:[[1,2],[-1,3]],b:[-3,2],g:[0,0]},
 noInputs:{x:[],w:[[],[]],b:[2,-1],g:[3,-2]},
 noOutputs:{x:[1,2],w:[],b:[],g:[]}
};
export function linearForwardTrace(x,w,b){
 const products=w.map(row=>row.map((v,i)=>v*x[i]));
 const sums=products.map(row=>row.reduce((a,b)=>a+b,0));
 return {x,w,b,products,sums,output:sums.map((v,o)=>v+b[o])};
}
export function linearBackwardTrace(x,w,g){
 const contributions=x.map((_,i)=>w.map((row,o)=>row[i]*g[o]));
 const dx=contributions.map(row=>row.reduce((a,b)=>a+b,0));
 const dw=g.map(v=>x.map(xi=>v*xi)),db=[...g];
 return {x,w,g,contributions,output:[dx,dw,db]};
}
export const msePresets={basic:{p:[2,4],t:[1,2]},mixed:{p:[-1,2,3],t:[1,2,1]},single:{p:[3],t:[1]},matched:{p:[1,2],t:[1,2]}};
export function mseTrace(p,t){
 const n=p.length,residuals=p.map((v,i)=>v-t[i]),squares=residuals.map(v=>v*v),loss=squares.reduce((a,b)=>a+b,0)/n;
 return {p,t,n,residuals,squares,loss,output:residuals.map(r=>2*r/n)};
}
export const reluPresets={mixed:{x:[-1,0,2],g:[3,4,-5]},positive:{x:[1,2],g:[-7,2]},zeros:{x:[0,0],g:[10,-2]},empty:{x:[],g:[]}};
export function reluBackwardTrace(x,g){
 const mask=x.map(v=>v>0?1:0);
 return {x,g,mask,forward:x.map(v=>Math.max(0,v)),output:g.map((v,i)=>mask[i]?v:0)};
}
export const scalarFunctions={
 square:{fn:v=>v*v,derivative:v=>2*v,formula:'f(x) = x²'},
 cubic:{fn:v=>v*v*v,derivative:v=>3*v*v,formula:'f(x) = x³'},
 linear:{fn:v=>2*v+1,derivative:()=>2,formula:'f(x) = 2x + 1'},
 sine:{fn:Math.sin,derivative:Math.cos,formula:'f(x) = sin(x)'},
 absolute:{fn:Math.abs,derivative:v=>v===0?null:Math.sign(v),formula:'f(x) = |x|'}
};
export function centralTrace(fn,x,h){
 const plus=fn(x+h),minus=fn(x-h);
 return {x,h,plus,minus,numerator:plus-minus,denominator:2*h,output:(plus-minus)/(2*h),calls:[x+h,x-h]};
}
