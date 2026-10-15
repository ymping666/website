import {formatNumber as f, formatVector as vector} from './lesson-math.mjs';
export const round7Translations = {};
export const t = (en, zh) => { round7Translations[en] = zh; return en; };
export const esc = v => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels = {
 sample: t('One supplied sample per latent dimension', '每个潜变量维度的一个给定样本'),
 sampleNote: t('Purple circle: mean μ. Green square: result z. The line joins μ to z; all rows share one signed scale. This is a sample location, not a density plot.', '紫色圆点：均值 μ；绿色方块：结果 z。线段连接 μ 与 z，各行共用同一正负尺度。这是样本位置图，不是概率密度图。'),
 parts: t('KL contribution by latent dimension', '各潜变量维度的 KL 贡献'),
 partsNote: t('Purple: mean contribution μ²/2. Green: variance contribution (exp(logvar) − 1 − logvar)/2. Bar lengths use one shared scale in nats; they are not probabilities.', '紫色：均值贡献 μ²/2；绿色：方差贡献 (exp(logvar) − 1 − logvar)/2。条长共用以 nat 为单位的尺度，不表示概率。'),
 mean: t('Mean contribution', '均值贡献'), variance: t('Variance contribution', '方差贡献'),
 recon: t('Reconstruction mean', '重建误差平均值'), weighted: t('Weighted KL', '加权 KL'), total: t('Total loss', '总损失'),
 betaNote: t('Purple: reconstruction mean. Green: β × KL sum. Widths show their contributions to this fixed example, not model quality or training progress.', '紫色：重建误差平均值；绿色：β × KL 总和。条宽表示它们对当前固定示例的贡献，不表示模型质量或训练进度。'),
 empty: t('Empty vectors: no latent dimensions to draw.', '输入为空向量，没有可绘制的潜变量维度。'),
 output: t('Function output', '函数输出'), fixed: t('Same inputs, different β', '保持输入不变，只改变 β')
};
const say = (key, zh) => zh ? round7Translations[labels[key]] : labels[key];
const table = (headers, rows, label) => `<div class="lesson-table-scroll" role="region" tabindex="0" aria-label="${esc(label)}"><table class="lesson-table"><thead><tr>${headers.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(v=>`<td><code>${esc(v)}</code></td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
export function renderSample(tr, zh = false) {
  const bound = Math.max(1, Math.ceil(Math.max(0, ...tr.rows.flatMap(r=>[Math.abs(r.mu), Math.abs(r.z)]))));
  const px = x => 260 + x * 180 / bound;
  const diagram = tr.rows.length ? `<figure class="r7-chart" tabindex="0"><figcaption>${say('sample',zh)}</figcaption><svg viewBox="0 0 540 ${55+tr.rows.length*65}" role="img" aria-label="${say('sample',zh)}">${[-bound,0,bound].map(v=>`<text x="${px(v)}" y="20" text-anchor="middle">${f(v)}</text>`).join('')}${tr.rows.map(r=>{const y=55+r.i*65;return `<text x="12" y="${y+5}">z${r.i}</text><line x1="80" x2="440" y1="${y}" y2="${y}" stroke="#dce5e0"/><line x1="${px(r.mu)}" x2="${px(r.z)}" y1="${y}" y2="${y}" stroke="#147d64" stroke-width="4"/><circle cx="${px(r.mu)}" cy="${y}" r="7" fill="#8558ad"/><rect x="${px(r.z)-4}" y="${y-4}" width="8" height="8" fill="#147d64"/><text x="80" y="${y+25}">μ=${f(r.mu)} → z=${f(r.z)}</text>`;}).join('')}</svg></figure>` : `<p>${say('empty',zh)}</p>`;
  return `${diagram}<p class="fineprint">${say('sampleNote',zh)}</p>${table(['i','μ','logvar','exp(logvar)','σ = exp(logvar/2)','ε','σ × ε','z'],tr.rows.map(r=>[r.i,...['mu','logvar','variance','sigma','epsilon','noise','z'].map(k=>f(r[k]))]),say('sample',zh))}<p role="status"><span>${say('output',zh)}</span>: <output id="vae-sample-output">${vector(tr.output)}</output></p>`;
}
export function renderKL(tr, zh = false) {
  const bound = Math.max(1, ...tr.rows.map(r=>r.meanPart+r.variancePart));
  return `<figure class="r7-chart" tabindex="0"><figcaption>${say('parts',zh)}</figcaption>${tr.rows.length ? `<svg viewBox="0 0 540 ${55+tr.rows.length*50}" role="img" aria-label="${say('parts',zh)}"><text x="60" y="20">0</text><text x="380" y="20" text-anchor="end">${f(bound)} nat</text>${tr.rows.map(r=>`<text x="12" y="${54+r.i*50}">${r.i}</text><rect x="60" y="${36+r.i*50}" width="${r.meanPart/bound*320}" height="24" fill="#8558ad"/><rect x="${60+r.meanPart/bound*320}" y="${36+r.i*50}" width="${r.variancePart/bound*320}" height="24" fill="#147d64"/><text x="395" y="${54+r.i*50}">${f(r.kl)}</text>`).join('')}</svg>` : `<p>${say('empty',zh)}</p>`}</figure><p class="fineprint">${say('partsNote',zh)}</p>${table(['i','μ','logvar','exp(logvar)',say('mean',zh),say('variance',zh),'KLᵢ'],tr.rows.map(r=>[r.i,...['mu','logvar','variance','meanPart','variancePart','kl'].map(k=>f(r[k]))]),say('parts',zh))}<p role="status">Σ KLᵢ = <output id="vae-kl-output">${f(tr.output)}</output> nat</p>`;
}
export function renderBeta(tr, zh = false) {
  const bound = Math.max(1,tr.output);
  return `<figure class="r7-chart" tabindex="0"><figcaption>${say('total',zh)}</figcaption><svg viewBox="0 0 540 100" role="img" aria-label="${say('total',zh)}"><text x="50" y="20">0</text><text x="450" y="20" text-anchor="end">${f(bound)}</text><rect x="50" y="36" width="${tr.reconstruction/bound*400}" height="28" fill="#8558ad"/><rect x="${50+tr.reconstruction/bound*400}" y="36" width="${tr.weighted/bound*400}" height="28" fill="#147d64"/></svg></figure><p class="fineprint">${say('betaNote',zh)}</p>${table(['reconstruction','kl_per_dim','β',say('recon',zh),'Σ KLᵢ','β × Σ KLᵢ',say('total',zh)],[[vector(tr.errors),vector(tr.contributions),f(tr.beta),f(tr.reconstruction),f(tr.kl),f(tr.weighted),f(tr.output)]],say('total',zh))}<p role="status"><span>${say('output',zh)}</span>: <output id="vae-beta-output">${f(tr.output)}</output></p><h3>${say('fixed',zh)}</h3>${table(['β',say('recon',zh),say('weighted',zh),say('total',zh)],[0,1,2,4].map(b=>[b,f(tr.reconstruction),f(b*tr.kl),f(tr.reconstruction+b*tr.kl)]),say('fixed',zh))}`;
}
