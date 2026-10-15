export const flowPairs={
  forward:{x0:[0,1],x1:[3,-1]},reverse:{x0:[3,-1],x1:[0,1]},
  stationary:{x0:[1,-1],x1:[1,-1]},scalar:{x0:[-1],x1:[2]},empty:{x0:[],x1:[]}
};
export function velocityTrace(x0,x1,t){
  const rows=x0.map((a,i)=>({i,x0:a,x1:x1[i],startPart:(1-t)*a,endPart:t*x1[i],position:(1-t)*a+t*x1[i],velocity:x1[i]-a}));
  return {t,rows,output:rows.map(r=>r.velocity)};
}
export const fields={
  growth:{formula:'v(x,t) = x',v:(x,t)=>x,exact:(x0,t)=>x0*Math.exp(t)},
  time:{formula:'v(x,t) = t',v:(x,t)=>t,exact:(x0,t)=>x0+.5*t*t},
  constant:{formula:'v(x,t) = 2',v:(x,t)=>2,exact:(x0,t)=>x0+2*t},
  decay:{formula:'v(x,t) = −x',v:(x,t)=>-x,exact:(x0,t)=>x0*Math.exp(-t)},
  fast:{formula:'v(x,t) = −4x',v:(x,t)=>-4*x,exact:(x0,t)=>x0*Math.exp(-4*t)},
  affine:{formula:'v(x,t) = x + t',v:(x,t)=>x+t,exact:(x0,t)=>(x0+1)*Math.exp(t)-t-1},
  zero:{formula:'v(x,t) = 0',v:(x,t)=>0,exact:(x0,t)=>x0}
};
export const stepCounts=[1,2,4,8,16];
export function odeTrace(method,x0,field,steps){
  const model=fields[field],h=1/steps,rows=[],calls=[];
  const evaluate=(x,t)=>{calls.push({x,t});return model.v(x,t);};
  let x=x0;
  for(let i=0;i<steps;i++){
    const t=i*h,k1=evaluate(x,t),predicted=x+h*k1;
    const k2=method==='heun'?evaluate(predicted,t+h):null;
    const slope=method==='heun'?(k1+k2)/2:k1,after=x+h*slope,endTime=t+h;
    rows.push({step:i+1,t,x,k1,predicted,k2,slope,after,endTime,exact:model.exact(x0,endTime)});x=after;
  }
  const exact=model.exact(x0,1);
  return {method,x0,field,steps,h,rows,calls,output:x,exact,error:Math.abs(x-exact)};
}
export function solverComparison(x0,field){
  return stepCounts.map(steps=>{const euler=odeTrace('euler',x0,field,steps),heun=odeTrace('heun',x0,field,steps);return {steps,euler:euler.output,heun:heun.output,eulerError:euler.error,heunError:heun.error,eulerCalls:euler.calls.length,heunCalls:heun.calls.length};});
}
