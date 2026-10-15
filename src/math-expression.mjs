// Small, strict expression parser for a reviewed catalog, never arbitrary prose.
// Unsupported Python constructs are left alone rather than guessed at.
export const escapeMath=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const row=(...p)=>`<mrow>${p.join('')}</mrow>`,op=s=>`<mo>${escapeMath(s)}</mo>`;
const sub=(a,b)=>`<msub>${a}${b}</msub>`;
export function identifier(name){
  const greek={alpha:'α',beta:'β',gamma:'γ',mu:'μ',epsilon:'ε',eps:'ε'};
  if(name in greek)return `<mi>${greek[name]}</mi>`;
  if(name==='xt')return sub(identifier('x'),identifier('t'));
  if(name==='x0'||name==='x1')return sub(identifier('x'),`<mn>${name[1]}</mn>`);
  if(/^beta[12]$/.test(name))return sub(identifier('beta'),`<mn>${name.at(-1)}</mn>`);
  const decorated=/^(alpha_bar|x0_hat|eps_hat|m_hat|v_hat)(?:_(.+))?$/.exec(name);
  if(decorated){const base=decorated[1],over=`<mover accent="true">${identifier(base.split('_')[0])}<mo>${base.endsWith('bar')?'¯':'^'}</mo></mover>`;return decorated[2]?sub(over,identifier(decorated[2])):over;}
  if(name.endsWith('²'))return `<msup>${identifier(name.slice(0,-1))}<mn>2</mn></msup>`;
  if(name.endsWith('ᵗ'))return `<msup>${identifier(name.slice(0,-1))}${identifier('t')}</msup>`;
  if(/^[a-zA-Zα-ωΑ-Ω]+_[a-zA-Z0-9]+$/.test(name)){const [a,b]=name.split('_');return sub(identifier(a),/^\d+$/.test(b)?`<mn>${b}</mn>`:`<mi${b.length>1?' mathvariant="normal"':''}>${b}</mi>`);}
  const suffix=/^(.+?)([₀₁₂₃₄₅₆₇₈₉ᵢⱼₖₜ]+)$/.exec(name);
  if(suffix){const s=suffix[2].replace(/[₀₁₂₃₄₅₆₇₈₉ᵢⱼₖₜ]/g,c=>'0123456789ijkt'['₀₁₂₃₄₅₆₇₈₉ᵢⱼₖₜ'.indexOf(c)]);return sub(identifier(suffix[1]),/^\d+$/.test(s)?`<mn>${s}</mn>`:`<mi>${s}</mi>`);}
  return `<mi${name.length>1?' mathvariant="normal"':''}>${escapeMath(name)}</mi>`;
}
export function mathTokens(source){
  const matches=[...source.matchAll(/\s*(\*\*|<=|>=|==|!=|\d+(?:\.\d+)?(?:e[+-]?\d+)?|[a-zA-Zα-ωΑ-Ω][a-zA-Z0-9_α-ωΑ-Ω₀₁₂₃₄₅₆₇₈₉ᵢⱼₖₜ]*|[+\-*/=<>(),\[\]])/g)];
  if(matches.map(m=>m[0]).join('').trim()!==source.trim())throw Error('Unsupported math: '+source);
  return matches.map(m=>m[1]);
}
export function parseMath(source){
  const tokens=mathTokens(source);let i=0;
  const eat=t=>{if(tokens[i]!==t)throw Error('Expected '+t+' in '+source);i++;};
  const list=end=>{const a=[];if(tokens[i]!==end){a.push(expr(0));while(tokens[i]===','){i++;a.push(expr(0));}}eat(end);return a;};
  function atom(){
    const token=tokens[i++];let node;
    if(!token)throw Error('Missing operand: '+source);
    if(token==='-'||token==='+')node={type:'unary',op:token,value:expr(25)};
    else if(token==='('){node={type:'group',items:list(')')};}
    else if(token==='['){node={type:'vector',items:list(']')};}
    else if(/^\d/.test(token))node={type:'number',value:token};
    else if(/^[a-zA-Zα-ωΑ-Ω]/.test(token))node={type:'name',value:token};
    else throw Error('Unexpected token '+token);
    while(tokens[i]==='('||tokens[i]==='['){const open=tokens[i++],args=list(open==='('?')':']');node={type:open==='('?'call':'index',base:node,args};}
    return node;
  }
  function expr(min){let left=atom();const precedence={'=':5,'==':5,'!=':5,'<':5,'>':5,'<=':5,'>=':5,'+':10,'-':10,'*':20,'/':20,'**':30};
    while(precedence[tokens[i]]>=min){const operator=tokens[i++],p=precedence[operator];left={type:'binary',op:operator,left,right:expr(operator==='**'?p:p+1)};}
    return left;
  }
  const tree=expr(0);if(i!==tokens.length)throw Error('Unconsumed math: '+source);return tree;
}
export function renderMathTree(n){
  const render=renderMathTree,sequence=items=>items.map(render).join(op(','));
  const bare=value=>render(value.type==='group'&&value.items.length===1?value.items[0]:value);
  if(n.type==='name')return identifier(n.value);
  if(n.type==='number')return `<mn>${n.value}</mn>`;
  if(n.type==='unary')return row(op(n.op==='-'?'−':n.op),render(n.value));
  if(n.type==='group'||n.type==='vector')return row(op(n.type==='group'?'(':'['),sequence(n.items),op(n.type==='group'?')':']'));
  if(n.type==='index'){let base=n.base,args=[...n.args];while(base.type==='index'){args=[...base.args,...args];base=base.base;}return sub(render(base),row(sequence(args)));}
  if(n.type==='call'){
    if(n.base.type==='name'&&n.base.value==='sqrt'&&n.args.length===1)return `<msqrt>${bare(n.args[0])}</msqrt>`;
    return row(render(n.base),op('('),sequence(n.args),op(')'));
  }
  if(n.type==='binary'){
    if(n.op==='/')return `<mfrac>${bare(n.left)}${bare(n.right)}</mfrac>`;
    if(n.op==='**')return `<msup>${render(n.left)}${bare(n.right)}</msup>`;
    return row(render(n.left),op({'-':'−','*':'·','<=':'≤','>=':'≥','==':'=','!=':'≠'}[n.op]||n.op),render(n.right));
  }
  throw Error('Unknown math tree');
}
export const mathExpression=source=>renderMathTree(parseMath(source));
export const mathMarkup=(body,original='',display=false)=>`<math xmlns="http://www.w3.org/1998/Math/MathML" class="lesson-math${display?' lesson-math-display':''}"${display?' display="block"':''}${original?` data-notation="${escapeMath(original)}" title="${escapeMath(original)}"`:''}><mstyle displaystyle="${display}">${body}</mstyle></math>`;
