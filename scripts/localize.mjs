import { readFile, readdir } from 'node:fs/promises';
import { zhUI, translate } from '../src/locales/zh-ui.mjs';
import { problems } from '../src/problems.mjs';
import { concepts } from '../src/concepts.mjs';
import { practiceSets } from '../src/practice-sets.mjs';
import { searchTranslations } from '../src/search-pages.mjs';
import { policyTranslations } from '../src/policy-pages.mjs';

export const escapeHtml = text => String(text).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
export const decodeHtml = text => text.replace(/&(amp|lt|gt|quot|nbsp|#39|#\d+);/g, (_, entity) =>
  ({amp:'&',lt:'<',gt:'>',quot:'"',nbsp:'\u00a0','#39':"'"}[entity] ?? String.fromCodePoint(Number(entity.slice(1)))));

export async function loadChinese() {
  const directory = new URL('../src/locales/', import.meta.url);
  const files = (await readdir(directory)).filter(name => /^zh-content-.*\.json$/.test(name)).sort();
  const translations = (await Promise.all(files.map(name => readFile(new URL(name, directory), 'utf8').then(JSON.parse)))).flat();
  const dictionary = { ...zhUI, ...JSON.parse(await readFile(new URL('zh-static.json', directory), 'utf8')) };
  const indexed = new Map(translations.map(item => [item.id || item.slug, item]));
  const add = (original, translated, label) => {
    if (typeof translated !== 'string' || !translated.trim()) throw new Error('Missing Chinese translation: ' + label);
    dictionary[original] = translated;
  };
  for (const original of [...problems, ...concepts, ...practiceSets]) {
    const key = original.id || original.slug, chinese = indexed.get(key);
    if (!chinese) throw new Error('Missing Chinese content: ' + key);
    for (const field of ['title','description','requirements','explanation','pitfall','hints','complexity','summary','prerequisites','subtitle','audience','outcomes','caution']) {
      if (original[field] === undefined) continue;
      if (Array.isArray(original[field])) {
        if (chinese[field]?.length !== original[field].length) throw new Error(`Chinese ${key}.${field} length mismatch`);
        original[field].forEach((value, i) => add(value, chinese[field][i], `${key}.${field}[${i}]`));
      } else add(original[field], chinese[field], `${key}.${field}`);
    }
    if (original.tests) {
      if (chinese.testNames?.length !== original.tests.length) throw new Error('Chinese test names missing: ' + key);
      original.tests.forEach((test, i) => add(test.name, chinese.testNames[i], key + '.testNames'));
    }
    if (original.segments) {
      if (chinese.notes?.length !== original.segments.length) throw new Error('Chinese practice-set notes missing: ' + key);
      original.segments.forEach((segment, i) => add(segment.note, chinese.notes[i], key + '.notes'));
    }
  }
  Object.assign(dictionary, searchTranslations, policyTranslations);
  return { dictionary, translate: text => translate(text, dictionary) };
}

export function localizeHtml(html, path, { base, origin, dictionary }) {
  const t = text => translate(text, dictionary);
  const href = locale => base + (locale === 'zh' ? 'zh/' : '') + path.replace(/^\//, '');
  let skip = null;
  let chinese = html.split(/(<[^>]+>)/g).map(token => {
    if (token.startsWith('<')) {
      const tag = /^<\/?([a-z0-9]+)/i.exec(token)?.[1]?.toLowerCase();
      if (/^<\//.test(token) && tag === skip) { skip = null; return token; }
      if (skip) return token;
      if (['script','style','pre','code','textarea'].includes(tag) && !/^<\//.test(token)) skip = tag;
      if (tag === 'html') token = token.replace('lang="en"', 'lang="zh-CN"');
      if (tag === 'a' && !token.includes('data-language=')) token = token.replace(/href="([^"#]+)"/, (whole, url) => {
        if (!url.startsWith(base) || url.startsWith(base + 'assets/') || url.startsWith(base + 'zh/')) return whole;
        return `href="${base}zh/${url.slice(base.length)}"`;
      });
      token = token.replace(/(aria-label|placeholder|title)="([^"]*)"/g, (_, name, value) => `${name}="${escapeHtml(t(decodeHtml(value)))}"`);
      token = token.replace(/data-title="([^"]*)"/g, (_, value) => {
        const original = decodeHtml(value);
        const problem = problems.find(problem => original.startsWith(problem.title.toLowerCase()));
        return `data-title="${escapeHtml(original + (problem ? ' ' + t(problem.title) + ' ' + t(problem.track) : ''))}"`;
      });
      if (tag === 'meta' && token.includes('name="description"')) token = token.replace(/content="([^"]*)"/, (_, value) => `content="${escapeHtml(t(decodeHtml(value)))}"`);
      if (tag === 'link' && token.includes('rel="canonical"')) token = token.replace(/href="[^"]*"/, `href="${origin + href('zh')}"`);
      return token;
    }
    return skip ? token : escapeHtml(t(decodeHtml(token)));
  }).join('');
  chinese = chinese.replace(/(<script type="application\/json" id="challenge-json">)([\s\S]*?)(<\/script>)/, (_, start, json, end) => {
    const data = JSON.parse(json);
    data.hints = data.hints.map(t);
    data.tests = data.tests.map(test => ({ ...test, name: t(test.name) }));
    return start + JSON.stringify(data).replace(/</g, '\\u003c') + end;
  });
  return decorate(chinese, path, { base, origin, locale:'zh' });
}

export function decorate(html, path, { base, origin, locale = 'en' }) {
  const href = language => base + (language === 'zh' ? 'zh/' : '') + path.replace(/^\//, '');
  const alternatives = origin ? ['en','zh'].map(language => `<link rel="alternate" hreflang="${language === 'zh' ? 'zh-CN' : 'en'}" href="${origin + href(language)}">`).join('') + `<link rel="alternate" hreflang="x-default" href="${origin + href('en')}">` : '';
  html = html.replace('</head>', alternatives + '</head>');
  const title = decodeHtml(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] || 'TensorDrill');
  const description = decodeHtml(html.match(/<meta name="description" content="([^"]*)"/)?.[1] || '');
  const social = `<meta property="og:type" content="website"><meta property="og:site_name" content="TensorDrill"><meta property="og:locale" content="${locale === 'zh' ? 'zh_CN' : 'en_US'}"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}">${origin ? `<meta property="og:url" content="${escapeHtml(origin + href(locale))}">` : ''}<meta name="twitter:card" content="summary"><meta name="twitter:title" content="${escapeHtml(title)}"><meta name="twitter:description" content="${escapeHtml(description)}">`;
  const website = origin && path === '/' ? `<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'WebSite',name:'TensorDrill',url:origin + base,inLanguage:['en','zh-CN']}).replace(/</g,'\\u003c')}</script>` : '';
  html = html.replace('</head>', social + website + '</head>');
  const switcher = `<nav class="language-switch" aria-label="${locale === 'zh' ? '语言' : 'Language'}"><a data-language="en" href="${href('en')}"${locale === 'en' ? ' aria-current="page"' : ''}>EN</a><a data-language="zh" href="${href('zh')}" lang="zh-CN"${locale === 'zh' ? ' aria-current="page"' : ''}>中文</a></nav>`;
  return html.replace('<span class="header-note"', switcher + '<span class="header-note"');
}
