// Native MathML: available in the initial HTML, with no CDN, fonts or JS required.
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const mi = name => `<mi>${name}</mi>`;
const mn = number => `<mn>${number}</mn>`;
const mo = sign => `<mo>${sign}</mo>`;
const row = (...parts) => `<mrow>${parts.join('')}</mrow>`;
const sub = (base, index) => `<msub>${base}${index}</msub>`;
const square = value => `<msup>${value}${mn(2)}</msup>`;
const sqrt = value => `<msqrt>${value}</msqrt>`;
const frac = (top, bottom) => `<mfrac>${top}${bottom}</mfrac>`;
const parentheses = content => row(mo('('), content, mo(')'));
const fn = (name, arg) => row(`<mi mathvariant="normal">${name}</mi>`, parentheses(arg));
const equals = mo('='), plus = mo('+'), minus = mo('−'), times = mo('·');
const alpha = mi('α'), alphaBar = `<mover accent="true">${alpha}<mo>¯</mo></mover>`;
const alphaT = sub(alpha, mi('t')), alphaBarT = sub(alphaBar, mi('t'));
const x0 = sub(mi('x'), mn(0)), xt = sub(mi('x'), mi('t')), dk = sub(mi('d'), mi('k'));
const sum = index => `<munder>${mo('∑')}${mi(index)}</munder>`;
const math = (content, original = '', display = false) => `<math xmlns="http://www.w3.org/1998/Math/MathML" class="lesson-math${display ? ' lesson-math-display' : ''}"${original ? ` data-notation="${escape(original)}"` : ''}><mstyle displaystyle="${display}">${content}</mstyle></math>`;
const block = lines => `<div class="lesson-formula lesson-equations">${lines.map(line=>`<div class="lesson-equation">${math(line, '', true)}</div>`).join('')}</div>`;

const zi = sub(mi('z'), mi('i')), zj = sub(mi('z'), mi('j'));
const shifted = z => fn('exp', row(z, minus, mi('c')));
const commonFactor = fn('exp', row(minus, mi('c')));
const kj = sub(mi('k'), mi('i')), ai = sub(mi('a'), mi('i'));
const kh = sub(mi('K'), mi('h')), kw = sub(mi('K'), mi('w'));
const primeX = mi('x′'), primeY = mi('y′');
export const lessonEquations = {
  softmax: block([
    frac(shifted(zi), row(sum('j'), shifted(zj))),
    row(equals, frac(row(fn('exp',zi), times, commonFactor), row(mo('['), sum('j'), fn('exp',zj), mo(']'), times, commonFactor))),
    row(equals, frac(fn('exp',zi), row(sum('j'), fn('exp',zj))))
  ]),
  attention: block([
    row(sub(mi('s'),mi('i')), equals, frac(fn('dot', row(mi('q'), mo(','), kj)), sqrt(dk))),
    row(mi('a'), equals, fn('softmax', mi('s'))),
    row(sub(`<mi mathvariant="normal">output</mi>`,mi('j')), equals, sum('i'), ai, times, sub(mi('v'),row(mi('i'),mo(','),mi('j'))))
  ]),
  convolution: block([
    row(sub(mi('Y'),row(mi('i'),mo(','),mi('j'))), equals,
      `<munderover>${mo('∑')}${row(mi('a'),equals,mn(0))}${row(kh,minus,mn(1))}</munderover>`,
      `<munderover>${mo('∑')}${row(mi('b'),equals,mn(0))}${row(kw,minus,mn(1))}</munderover>`,
      sub(mi('X'),row(mi('i'),plus,mi('a'),mo(','),mi('j'),plus,mi('b'))), times, sub(mi('K'),row(mi('a'),mo(','),mi('b')))),
    row(fn('shape',mi('Y')),equals,mo('['),mi('H'),minus,kh,plus,mn(1),mo(','),mi('W'),minus,kw,plus,mn(1),mo(']'))
  ]),
  rope: block([
    row(primeX,equals,mi('x'),times,fn('cos',mi('θ')),minus,mi('y'),times,fn('sin',mi('θ'))),
    row(primeY,equals,mi('x'),times,fn('sin',mi('θ')),plus,mi('y'),times,fn('cos',mi('θ'))),
    row(square(primeX),plus,square(primeY),equals,square(mi('x')),plus,square(mi('y')))
  ]),
  diffusion: block([
    row(alphaT,equals,mn(1),minus,sub(mi('β'),mi('t'))),
    row(alphaBarT,equals,`<munderover>${mo('∏')}${row(mi('s'),equals,mn(1))}${mi('t')}</munderover>`,sub(alpha,mi('s'))),
    row(xt,equals,sqrt(alphaBarT),times,x0,plus,sqrt(row(mn(1),minus,alphaBarT)),times,mi('ε'))
  ])
};

const expressions = {
  '√(1 − ᾱₜ)': sqrt(row(mn(1),minus,alphaBarT)),
  '√(1−ᾱₜ)': sqrt(row(mn(1),minus,alphaBarT)),
  '√(1−ᾱ)': sqrt(row(mn(1),minus,alphaBar)),
  '√ᾱₜ': sqrt(alphaBarT), '√ᾱ': sqrt(alphaBar),
  '√dₖ': sqrt(dk), '√2': sqrt(mn(2)),
  'cos²(θ) + sin²(θ) = 1': row(square(fn('cos',mi('θ'))),plus,square(fn('sin',mi('θ'))),equals,mn(1)),
  'x′² + y′² = x² + y²': row(square(primeX),plus,square(primeY),equals,square(mi('x')),plus,square(mi('y'))),
  'x² + y²': row(square(mi('x')),plus,square(mi('y'))),
  'ᾱₜ': alphaBarT, 'ᾱ': alphaBar, 'αₜ': alphaT, 'βₜ': sub(mi('β'),mi('t')),
  'x₀': x0, 'xₜ': xt, 'dₖ': dk, 'dᵥ': sub(mi('d'),mi('v'))
};
const pattern = new RegExp(Object.keys(expressions).sort((a,b)=>b.length-a.length).map(key=>key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'), 'g');
export const typesetMathText = text => text.replace(pattern, original => math(expressions[original], original));
export const mathText = text => typesetMathText(escape(text));

// Run after localization so inserting MathML cannot interrupt phrase translation.
// Do not alter Python, code snippets, scripts, SVG, controls or existing MathML.
export function typesetVisualLesson(html) {
  const start = html.indexOf('<section class="visual-lesson"');
  if (start < 0) return html;
  const end = html.indexOf('<h2>Reference solution (Python)</h2>', start) >= 0
    ? html.indexOf('<h2>Reference solution (Python)</h2>', start)
    : html.indexOf('<h2>参考实现（Python）</h2>', start);
  if (end < 0) throw new Error('Visual lesson must precede the complete reference solution');
  let skip = null;
  const lesson = html.slice(start,end).split(/(<[^>]+>)/g).map(token => {
    if (token.startsWith('<')) {
      const tag = /^<\/?([a-z0-9-]+)/i.exec(token)?.[1]?.toLowerCase();
      if (/^<\//.test(token) && tag === skip) skip = null;
      else if (!skip && ['script','style','pre','code','textarea','svg','math','select','output'].includes(tag) && !/^<\//.test(token)) skip = tag;
      return token;
    }
    return skip ? token : typesetMathText(token);
  }).join('');
  return html.slice(0,start) + lesson + html.slice(end);
}

// Used by content checks to compare localized phrases before math typesetting.
export const originalMathText = html => html.replace(/<math\b[^>]*data-notation="([^"]*)"[^>]*>[\s\S]*?<\/math>/g, (_, original) => original);
