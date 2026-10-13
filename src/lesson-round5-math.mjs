// Original numerical examples; shared by static HTML and interactive controls.
export const topkPresets={mixed:[2,4,1,3],ties:[0,2,2,2],large:[1000,1001,999,998],negative:[-4,-1,-3,-2],single:[5]};
export function topkTrace(logits=topkPresets.mixed,k=2){
 const order=logits.map((_,i)=>i).sort((a,b)=>logits[b]-logits[a]||a-b),selected=order.slice(0,k);
 const peak=logits[selected[0]],weights=logits.map((v,i)=>selected.includes(i)?Math.exp(v-peak):0);
 const total=weights.reduce((a,b)=>a+b,0),output=weights.map(v=>v/total);
 const fullWeights=logits.map(v=>Math.exp(v-Math.max(...logits))),fullTotal=fullWeights.reduce((a,b)=>a+b,0);
 const full=fullWeights.map(v=>v/fullTotal),unrenormalized=full.map((v,i)=>selected.includes(i)?v:0);
 return {logits:[...logits],k,order,selected,peak,weights,total,output,full,unrenormalized,retainedMass:unrenormalized.reduce((a,b)=>a+b,0)};
}
export const cfgPresets={different:{u:[-1,0],c:[1,1]},opposed:{u:[1,-1],c:[0,1]},same:{u:[1,1],c:[1,1]},empty:{u:[],c:[]}};
export function cfgTrace(u=cfgPresets.different.u,c=cfgPresets.different.c,s=1.5){
 const delta=c.map((v,i)=>v-u[i]),scaled=delta.map(v=>s*v);
 return {u:[...u],c:[...c],s,delta,scaled,output:u.map((v,i)=>v+scaled[i])};
}
export const clipPresets={threeFour:[3,4],signed:[-6,8],small:[1,2],zero:[0,0],empty:[]};
export function clipTrace(grad=clipPresets.threeFour,maxNorm=2.5){
 const squares=grad.map(v=>v*v),norm=Math.sqrt(squares.reduce((a,b)=>a+b,0));
 const scale=norm>0?Math.min(1,maxNorm/norm):1,output=grad.map(v=>v*scale);
 const clamped=grad.map(v=>Math.max(-maxNorm,Math.min(maxNorm,v)));
 return {grad:[...grad],maxNorm,squares,norm,scale,output,outputNorm:Math.hypot(...output),clamped,clampedNorm:Math.hypot(...clamped)};
}
