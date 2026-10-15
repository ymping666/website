export const codebooks = {square:[[0,0],[2,0],[0,2],[2,2]],duplicate:[[0,0],[0,0],[2,2]],single:[[1,1]],emptyDimensions:[[],[],[]]};
export const distortionPresets = {
  mixed:{encoder:[[0,2],[2,2]],quantized:[[1,0],[2,4]]},
  matched:{encoder:[[1,2],[3,4]],quantized:[[1,2],[3,4]]},
  single:{encoder:[[2]],quantized:[[5]]},
  empty:{encoder:[],quantized:[]}
};
export function nearestTrace(vector,codebook){
  const rows=codebook.map((code,i)=>{
    const differences=vector.map((x,d)=>x-code[d]),squares=differences.map(x=>x*x);
    return {i,code:[...code],differences,squares,distance:squares.reduce((a,b)=>a+b,0)};
  });
  let index=0;for(let i=1;i<rows.length;i++)if(rows[i].distance<rows[index].distance)index=i;
  return {vector:[...vector],rows,index,ties:rows.filter(r=>r.distance===rows[index].distance).map(r=>r.i),selected:[...codebook[index]]};
}
export function usageTrace(indices,nCodes){
  const counts=Array(nCodes).fill(0);for(const index of indices)counts[index]++;
  const total=indices.length;
  const rows=counts.map((count,k)=>{const p=total?count/total:0;return {k,count,p,term:p>0?-p*Math.log(p):0};});
  const entropy=total?rows.reduce((s,r)=>s+r.term,0):null;
  return {rows,total,active:counts.filter(x=>x>0).length,entropy,output:total?Math.exp(entropy):0};
}
export function indicesFromCounts(counts,repeats=1){
  return counts.flatMap((n,k)=>Array(n*repeats).fill(k));
}
export function distortionInputs(preset,scale=1,rowRepeats=1,featureRepeats=1){
  const encoder=Array.from({length:rowRepeats},()=>preset.encoder.map(r=>Array.from({length:featureRepeats},()=>[...r]).flat())).flat();
  const base=preset.quantized.map((r,i)=>r.map((x,d)=>preset.encoder[i][d]+scale*(x-preset.encoder[i][d])));
  const quantized=Array.from({length:rowRepeats},()=>base.map(r=>Array.from({length:featureRepeats},()=>[...r]).flat())).flat();
  return {encoder,quantized};
}
export function distortionTrace(encoder,quantized){
  const rows=encoder.flatMap((row,n)=>row.map((x,d)=>{const q=quantized[n][d],difference=x-q;return {n,d,encoder:x,quantized:q,difference,square:difference*difference};}));
  const total=rows.reduce((s,r)=>s+r.square,0),count=rows.length;
  return {encoder:encoder.map(r=>[...r]),quantized:quantized.map(r=>[...r]),rows,total,count,output:count?total/count:0};
}
