// Compose a compact experimental entry without changing homepage metadata.
export function practiceComparison(locale='en') {
  const t=(en,cn)=>locale==='zh'?cn:en;
  return `<dl class="practice-format"><div><dt>${t('Typical drills','常规刷题')}</dt><dd>${t('Read a prompt → Implement from scratch','读题 → 从零实现解法')}</dd></div><div class="practice-format-new"><dt>${t('This lab','这里练习')}</dt><dd>${t('Read existing code → Review AI suggestions → Debug & extend → Verify with tests','接手代码 → 审查 AI 建议 → 调试与迭代 → 测试验证')}</dd></div></dl>`;
}

export function withLabEntry(html, locale='en', base='/') {
  const zh=locale==='zh',t=(en,cn)=>zh?cn:en;
  const marker='<section class="habit-teaser"';
  if(html.split(marker).length!==2) throw new Error('Expected one homepage practice section');
  const entry=`<aside class="home-lab-entry" aria-label="${t('Experimental interview practice','实验性面试练习')}"><span class="home-lab-tag">${t('NEW FORMAT · EXPERIMENTAL','新形式 · 实验中')}</span><div><a href="${zh?'/zh':''}/labs/">${t('AI-Era Coding Interview Lab →','新型编程面试实战 →')}</a><p>${t('Start with existing code. Practice engineering judgment for AI-assisted interviews.','从接手已有代码开始，练习 AI 辅助编程面试中的工程判断。')}</p>${practiceComparison(locale)}</div></aside>`;
  return html.replace(marker,entry.replace(/href="\//g,`href="${base}`)+marker).replace('</head>',`<link rel="stylesheet" href="${base}assets/labs/home-entry.css"></head>`);
}
