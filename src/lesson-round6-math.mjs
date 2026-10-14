// Small deterministic teaching traces, independent of plotting and the DOM.
export const layerPresets={mixed:[1,2,3],signed:[-3,1,2],constant:[3,3,3],single:[5],zero:[0,0,0]};
export function layerTrace(x=layerPresets.mixed,eps=0.01){
 const mean=x.reduce((a,b)=>a+b,0)/x.length,centered=x.map(v=>v-mean),squares=centered.map(v=>v*v);
 const variance=squares.reduce((a,b)=>a+b,0)/x.length,denominator=Math.sqrt(variance+eps),output=centered.map(v=>v/denominator);
 return {x:[...x],eps,mean,centered,squares,variance,denominator,output,outputMean:output.reduce((a,b)=>a+b,0)/x.length,outputVariance:variance/(variance+eps)};
}
export const gradientPresets={constant:[2,2,2,2,2,2,2,2],alternating:[2,-2,2,-2,2,-2,2,-2],reversal:[2,2,-2,-2,-2,-2,-2,-2],zero:[0,0,0,0,0,0,0,0]};
export function momentumTrace(gradients=gradientPresets.reversal,lr=0.1,momentum=0.9,steps=3,initialVelocity=0){
 let param=3,velocity=initialVelocity,plain=3;const rows=[];
 for(let i=0;i<steps;i++){
  const previousParam=param,previousVelocity=velocity,retained=momentum*velocity,grad=gradients[i];
  velocity=retained+grad;const change=-lr*velocity;param+=change;plain-=lr*grad;
  rows.push({step:i+1,grad,previousParam,previousVelocity,retained,velocity,change,param,plain});
 }
 return {lr,momentum,steps,initialVelocity,rows,output:[param,velocity]};
}
export function adamTrace(gradients=gradientPresets.constant,beta1=0.9,beta2=0.999,steps=3){
 let m=0,v=0;const rows=[];
 for(let i=0;i<steps;i++){
  const grad=gradients[i];m=beta1*m+(1-beta1)*grad;v=beta2*v+(1-beta2)*grad*grad;
  const step=i+1,d1=1-beta1**step,d2=1-beta2**step,mHat=m/d1,vHat=v/d2;
  rows.push({step,grad,m,v,d1,d2,mHat,vHat});
 }
 const last=rows.at(-1);return {beta1,beta2,steps,rows,output:[last.mHat,last.vHat]};
}
