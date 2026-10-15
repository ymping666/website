// Small, deterministic teaching examples; no model or random sampler is invoked.
export const diffusionPairs={mixed:{x0:[2,-1],eps:[1,2]},zero:{x0:[2,-1],eps:[0,0]},scalar:{x0:[2],eps:[1]},empty:{x0:[],eps:[]}};
export function reconstructionTrace(x0,eps,a,bias=0){
  const signalScale=Math.sqrt(a),noiseScale=Math.sqrt(1-a),gain=noiseScale/signalScale;
  const rows=x0.map((x,i)=>{const xt=signalScale*x+noiseScale*eps[i],hat=eps[i]+bias,removed=noiseScale*hat,residual=xt-removed,estimate=residual/signalScale;return {i,x0:x,eps:eps[i],hat,xt,removed,residual,estimate,error:estimate-x};});
  return {a,bias,signalScale,noiseScale,gain,rows,output:rows.map(r=>r.estimate)};
}
export function posteriorTrace(xt,x0,alpha,prev){
  const current=alpha*prev,beta=1-alpha,denom=1-current,c0=beta*Math.sqrt(prev)/denom,ct=Math.sqrt(alpha)*(1-prev)/denom,variance=beta*(1-prev)/denom;
  const rows=x0.map((x,i)=>({i,x0:x,xt:xt[i],clean:c0*x,noisy:ct*xt[i],mean:c0*x+ct*xt[i]}));
  return {alpha,prev,current,beta,denom,c0,ct,variance,sd:Math.sqrt(variance),rows,output:rows.map(r=>r.mean)};
}
export function ddimTrace(xt,eps,current,prev){
  const rows=xt.map((x,i)=>{const estimate=(x-Math.sqrt(1-current)*eps[i])/Math.sqrt(current),clean=Math.sqrt(prev)*estimate,noise=Math.sqrt(1-prev)*eps[i];return {i,xt:x,eps:eps[i],estimate,clean,noise,after:clean+noise};});
  return {current,prev,rows,output:rows.map(r=>r.after)};
}
