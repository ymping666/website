export const layoutPresets={
 basic:[[1,2,3,4],[5,6,7,8]],signed:[[1,-1,2,-2],[3,-3,4,-4]],
 six:[[10,11,12,13,14,15],[20,21,22,23,24,25],[30,31,32,33,34,35]],empty:[],zero:[[],[]]
};
export function headChoices(tokens){const width=tokens[0]?.length||0;return [1,2,3,4,6].filter(h=>width===0||width%h===0);}
export function splitTrace(tokens,count){
 const width=tokens[0]?.length||0,depth=width/count;
 const heads=Array.from({length:count},(_,h)=>tokens.map(row=>row.slice(h*depth,(h+1)*depth)));
 const mapping=tokens.flatMap((row,t)=>row.map((value,c)=>({t,c,h:Math.floor(c/depth),j:c%depth,value})));
 return {tokens,heads,count,width,depth,length:tokens.length,mapping,output:heads};
}
export function mergeTrace(heads){
 const count=heads.length,length=heads[0].length,depth=heads[0][0]?.length||0,width=count*depth;
 const tokens=Array.from({length},(_,t)=>heads.flatMap(head=>head[t]));
 const mapping=tokens.flatMap((row,t)=>row.map((value,c)=>({t,c,h:Math.floor(c/depth),j:c%depth,value})));
 return {tokens,heads,count,width,depth,length,mapping,output:tokens};
}
const keys=[[1,0],[0,1],[-1,0]],values=[[4,0,1],[0,4,2],[-2,0,3]];
export const crossPresets={
 basic:{queries:[[1,0],[0,1]],keys,values},uniform:{queries:[[0,0],[0,0]],keys,values},
 reversed:{queries:[[1,0],[0,1]],keys:[...keys].reverse(),values:[...values].reverse()},
 single:{queries:[[1,0],[0,1],[-1,0]],keys:[[1,2]],values:[[3,-1,2]]},
 large:{queries:[[1000],[999]],keys:[[1000],[999]],values:[[1,0],[0,1]]},
 scalar:{queries:[[1,0,1]],keys:[[1,0,0],[0,1,1]],values:[[2],[6]]}
};
export function crossTrace(queries,keys,values){
 const dk=keys[0].length,dv=values[0].length;
 const rows=queries.map((query,i)=>{
  const dots=keys.map(key=>key.reduce((s,k,j)=>s+k*query[j],0)),scores=dots.map(s=>s/Math.sqrt(dk)),maximum=Math.max(...scores);
  const shifted=scores.map(s=>s-maximum),exponentials=shifted.map(Math.exp),denominator=exponentials.reduce((s,w)=>s+w,0),weights=exponentials.map(w=>w/denominator);
  const contributions=values.map((v,k)=>v.map(x=>x*weights[k])),output=Array.from({length:dv},(_,j)=>contributions.reduce((s,v)=>s+v[j],0));
  return {i,query,dots,scores,maximum,shifted,exponentials,denominator,weights,contributions,output};
 });
 return {queries,keys,values,dk,dv,nq:queries.length,nk:keys.length,rows,output:rows.map(r=>r.output)};
}
