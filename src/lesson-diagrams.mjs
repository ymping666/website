// Original coordinate diagrams. SVG y increases downwards, so negate mathematical y.
const point = ([x, y]) => [160 + 48 * x, 160 - 48 * y];
const line = (start, end, color, marker = '', dash = '') => {
  const [x1, y1] = point(start), [x2, y2] = point(end);
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="3"${marker ? ` marker-end="url(#${marker})"` : ''}${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
};
const marker = (id, color) => `<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="${color}"/></marker>`;
const axes = `<path d="M16 160 H304 M160 16 V304" stroke="#b1bdb6" fill="none"/><text x="300" y="180">x</text><text x="172" y="22">y</text><text x="146" y="177">0</text>${[-2,-1,1,2].map(n => `<path d="M${160+48*n} 156 v8 M156 ${160-48*n} h8" stroke="#b1bdb6"/><text x="${160+48*n}" y="178" text-anchor="middle">${n}</text><text x="149" y="${164-48*n}" text-anchor="end">${n}</text>`).join('')}`;
const svg = content => `<svg class="lesson-vector-svg" viewBox="0 0 320 320" aria-hidden="true" focusable="false">${content}</svg>`;
export function ropeDiagram(trace) {
  const radius = trace.inputNorm * 48;
  const [x, y] = point(trace.output);
  return svg(`<defs>${marker('rope-before', '#178165')}${marker('rope-after', '#6555ad')}</defs>${axes}<circle cx="160" cy="160" r="${radius}" fill="none" stroke="#c8d7ce" stroke-dasharray="5 4"/>${line([0,0], trace.input, '#178165', 'rope-before', '6 4')}${line([0,0], trace.output, '#6555ad', 'rope-after')}<circle data-rope-end cx="${x}" cy="${y}" r="4" fill="#6555ad"/>`);
}
export function diffusionDiagram(trace) {
  const [x, y] = point(trace.output);
  return svg(`<defs>${marker('diff-signal', '#178165')}${marker('diff-noise', '#526fae')}</defs>${axes}${line([0,0],trace.output,'#6555ad','','5 4')}${line([0,0],trace.signalPart,'#178165','diff-signal')}${line(trace.signalPart,trace.output,'#526fae','diff-noise')}<circle data-diffusion-end cx="${x}" cy="${y}" r="5" fill="#6555ad"/>`);
}
