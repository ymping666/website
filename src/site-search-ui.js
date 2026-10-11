import { searchSite } from './site-search.mjs';

const root = document.querySelector('[data-site-search]');
if (root) {
  const zh = document.documentElement.lang === 'zh-CN';
  const text = (en, cn) => zh ? cn : en;
  const input = root.querySelector('#site-query');
  const type = root.querySelector('#search-type');
  const status = root.querySelector('#search-status');
  const list = root.querySelector('#search-results');
  const more = root.querySelector('#search-more');
  const retry = root.querySelector('#search-retry');
  const labels = { problem: text('Problem', '题目'), editorial: text('Solution', '题解'), concept: text('Concept', '知识点'), set: text('Practice set', '专题题单'), topic: text('Topic', '知识主题') };
  const base = new URL(root.dataset.searchIndex, location.href).pathname.replace(/assets\/search-index\.json$/, '');
  let indexPromise, revision = 0, visible = 30, timer;
  const load = () => indexPromise ||= fetch(root.dataset.searchIndex).then(response => {
    if (!response.ok) throw Error('Search index unavailable');
    return response.json();
  }).catch(error => { indexPromise = null; throw error; });
  const syncURL = () => {
    const url = new URL(location.href);
    input.value.trim() ? url.searchParams.set('q', input.value.trim()) : url.searchParams.delete('q');
    type.value !== 'all' ? url.searchParams.set('type', type.value) : url.searchParams.delete('type');
    history.replaceState(null, '', url);
    for (const link of document.querySelectorAll('[data-language]')) {
      const target = new URL(link.href);
      target.search = url.search;
      link.href = target.href;
    }
  };
  const render = async ({ reset = true, updateURL = true } = {}) => {
    const current = ++revision, query = input.value.trim();
    if (reset) visible = 30;
    if (updateURL) syncURL();
    list.replaceChildren(); more.hidden = true; retry.hidden = true;
    if (!query) {
      root.removeAttribute('aria-busy');
      status.textContent = text('Enter a keyword to find something to practice.', '输入关键词，寻找想练习的内容。');
      return;
    }
    root.setAttribute('aria-busy', 'true');
    status.textContent = text('Searching…', '正在搜索…');
    try {
      const entries = await load();
      if (current !== revision) return;
      const results = searchSite(entries, query, type.value);
      status.textContent = results.length ? text(`${results.length} results · Showing ${Math.min(visible, results.length)}`, `${results.length} 条结果 · 已显示 ${Math.min(visible, results.length)} 条`) :
        text('No results. Try a shorter keyword, another language, or select All content.', '没有找到结果。试试更短的关键词、另一种语言，或选择全部内容。');
      for (const result of results.slice(0, visible)) {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.className = 'site-search-result';
        link.href = base + (zh ? 'zh/' : '') + result.path.slice(1);
        const label = document.createElement('span'); label.className = 'search-result-type'; label.textContent = labels[result.type];
        const title = document.createElement('h2'); title.textContent = result.title[zh ? 'zh' : 'en'];
        const description = document.createElement('p'); description.textContent = result.description[zh ? 'zh' : 'en'];
        link.append(label, title, description); item.append(link); list.append(item);
      }
      more.hidden = results.length <= visible;
    } catch {
      if (current !== revision) return;
      status.textContent = text('Search could not load. Check your connection and try again.', '搜索暂时无法加载，请检查网络后重试。');
      retry.hidden = false;
    } finally {
      if (current === revision) root.removeAttribute('aria-busy');
    }
  };
  const restoreURL = () => {
    const params = new URL(location.href).searchParams;
    input.value = (params.get('q') || '').slice(0, 200);
    type.value = [...type.options].some(option => option.value === params.get('type')) ? params.get('type') : 'all';
    render();
  };
  root.querySelector('form').addEventListener('submit', event => { event.preventDefault(); clearTimeout(timer); render(); });
  input.addEventListener('input', event => { ++revision; clearTimeout(timer); if (!event.isComposing) timer = setTimeout(render, 180); });
  // Do not search unfinished Chinese/Japanese IME input.
  input.addEventListener('compositionstart', () => { ++revision; clearTimeout(timer); });
  input.addEventListener('compositionend', () => { clearTimeout(timer); timer = setTimeout(render, 180); });
  type.addEventListener('change', () => { clearTimeout(timer); render(); });
  root.querySelector('#search-clear').addEventListener('click', () => { input.value = ''; clearTimeout(timer); render(); input.focus(); });
  more.addEventListener('click', async () => {
    const offset = visible;
    visible += 30;
    await render({ reset: false });
    list.children[offset]?.querySelector('a')?.focus();
  });
  retry.addEventListener('click', () => render());
  window.addEventListener('popstate', restoreURL);
  restoreURL();
}
