// Cost minimization throughout. Ties follow the Python problem contracts.
export const forecastPresets={
 trap:{a:{a:2,b:1,c:100},b:{a:0,b:3,c:94},truth:{a:0,b:1,c:100}},
 perfect:{a:{a:0,b:1,c:4},b:{a:0,b:1,c:4},truth:{a:0,b:1,c:4}},
 offset:{a:{a:2,b:3,c:6},b:{a:0,b:1,c:4},truth:{a:0,b:1,c:4}},
 tie:{a:{b:0,a:0},b:{b:0,a:1},truth:{a:5,b:0}},
 single:{a:{a:2},b:{a:0},truth:{a:1}}
};
const winner=(a,b)=>a<b?'A':b<a?'B':'tie';
export function forecastTrace(predA,predB,truth){
 const actions=Object.keys(truth).sort(),best=Math.min(...Object.values(truth));
 const model=pred=>{
  const chosen=actions.reduce((a,b)=>pred[b]<pred[a]?b:a);
  const errors=actions.map(a=>(pred[a]-truth[a])**2),sum=errors.reduce((s,v)=>s+v,0);
  return {pred,errors,sum,mse:sum/actions.length,chosen,actual:truth[chosen],regret:truth[chosen]-best};
 };
 const a=model(predA),b=model(predB);
 return {actions,truth,best,a,b,output:{mse_a:a.mse,mse_b:b.mse,regret_a:a.regret,regret_b:b.regret,lower_mse:winner(a.mse,b.mse),lower_regret:winner(a.regret,b.regret)}};
}
export const riskPresets={
 tradeoff:{means:{risky:0,safe:2},variances:{risky:16,safe:0}},
 sqrt:{means:{a:0,b:4},variances:{a:9,b:0}},
 tie:{means:{z:1,a:1},variances:{z:0,a:0}},
 negative:{means:{a:-3,b:-1,c:1},variances:{a:4,b:1,c:0}},
 empty:{means:{},variances:{}}
};
export function riskTrace(means,variances,weight){
 const rows=Object.keys(means).sort().map(action=>{
  const mean=means[action],variance=variances[action],std=Math.sqrt(variance),penalty=weight*std;
  return {action,mean,variance,std,penalty,score:mean+penalty};
 });
 const chosen=rows.reduce((best,r)=>!best||r.score<best.score?r:best,null);
 return {rows,weight,output:chosen?.action??null};
}
export const cemPresets={
 basic:{candidates:[[0,1,2],[1,1,0],[1,0,2],[2,2,1]],costs:[2,1,3,5],n:3},
 ties:{candidates:[[2],[1],[0]],costs:[0,0,0],n:3},
 single:{candidates:[[0,0],[0,0]],costs:[3,1],n:1},
 empty:{candidates:[[],[]],costs:[2,1],n:3},
 fractions:{candidates:[[0],[0],[1]],costs:[1,2,3],n:3}
};
export function cemTrace(candidates,costs,eliteCount,nActions){
 const ranked=Array.from({length:candidates.length},(_,i)=>i).sort((a,b)=>costs[a]-costs[b]||a-b),elites=ranked.slice(0,eliteCount);
 const counts=Array.from({length:candidates[0].length},()=>Array(nActions).fill(0));
 for(const i of elites)for(let t=0;t<counts.length;t++)counts[t][candidates[i][t]]++;
 return {candidates,costs,eliteCount,nActions,ranked,elites,counts,output:counts.map(row=>row.map(count=>count/eliteCount))};
}
