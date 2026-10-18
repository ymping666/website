// Shared presentation only. Values are computed by each lesson's verified trace.
import {formatNumber} from './lesson-math.mjs';
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const calcNumber=v=>v!==0&&Math.abs(v)<1e-5?v.toExponential(3):formatNumber(v);
export const calcEqual=(...values)=>values.every(v=>Number(calcNumber(v))===v)?'=':'≈';
export function calcNode(label,symbol,value,{index=null,tone='block',id='',key=''}={}){
 const vector=Array.isArray(value),text=vector?'['+value.map(calcNumber).join(', ')+']':calcNumber(value);
 const mobileFont=vector?'':` style="--calc-mobile-font:${Math.min(1.08,6.75/text.length).toFixed(3)}rem"`;
 return `<div class="r16-gate-node r16-gate-${tone}${vector?' lesson-calc-vector':''}"${key?` data-calc-key="${esc(key)}"`:''} data-calc-value="${esc(JSON.stringify(value))}"${mobileFont}><span class="r16-gate-label">${label}</span><span class="r16-gate-symbol">${esc(symbol)}${index===null?'':`<sub>${index}</sub>`}</span>${id?`<output id="${esc(id)}">${esc(text)}</output>`:`<samp>${esc(text)}</samp>`}</div>`;
}
export const calcLine=(nodes,operators,label)=>`<div class="r16-gate-arithmetic${nodes.length===2?' lesson-calc-transition':''}" role="group" aria-label="${esc(label)}">${nodes.map((node,i)=>node+(i<nodes.length-1?`<span class="r16-gate-operator" aria-hidden="true">${esc(operators[i])}</span>`:'')).join('')}</div>`;
export const calcStep=(number,title,body,merge=false)=>`<section class="r16-gate-step${merge?' r16-gate-step-merge':''}"><h4><span class="r16-gate-step-number">${number}</span><span>${title}</span></h4>${body}</section>`;
export const calcStory=(title,scope,index,body,note='')=>`<figure class="r16-gate-story lesson-calculation"><figcaption><strong>${title}</strong>${index===null?'':`<span class="r16-gate-channel"><span>${scope}</span> ${index}</span>`}</figcaption>${note?`<p class="r16-gate-scope">${note}</p>`:''}${body}</figure>`;
export const calcCarry=text=>`<p class="r16-gate-carry"><span aria-hidden="true">↓</span><span>${text}</span></p>`;
export const calcContext=rows=>`<dl class="lesson-calc-context">${rows.map(([label,html])=>`<div><dt>${label}</dt><dd>${html}</dd></div>`).join('')}</dl>`;
export const calcValue=value=>`<samp>${esc(Array.isArray(value)?JSON.stringify(value):calcNumber(value))}</samp>`;
export const calcRoot=(base,eps,result)=>`<math xmlns="http://www.w3.org/1998/Math/MathML"><msqrt><mrow><mn>${esc(calcNumber(base))}</mn><mo>+</mo><mn>${esc(String(eps))}</mn></mrow></msqrt><mo>≈</mo><mn>${esc(calcNumber(result))}</mn></math>`;
