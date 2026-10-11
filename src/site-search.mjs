export const normalizeSearch = value => String(value).normalize('NFKC').toLowerCase()
  .replace(/[_\-–—]+/g, ' ').replace(/\s+/g, ' ').trim();

// Match every term, across both languages. Titles outrank descriptions and tags.
export function searchSite(entries, query, type = 'all') {
  const phrase = normalizeSearch(query).slice(0, 200);
  if (!phrase) return [];
  const terms = [...new Set(phrase.split(' '))];
  const number = /^#?\d+$/.test(phrase) ? Number(phrase.replace('#', '')) : null;
  const priority = { problem: 0, editorial: 1, concept: 2, set: 3, topic: 4 };
  return entries.flatMap((entry, order) => {
    if (type !== 'all' && entry.type !== type) return [];
    const titles = Object.values(entry.title).map(normalizeSearch);
    const keywords = normalizeSearch(entry.keywords);
    const description = normalizeSearch(Object.values(entry.description).join(' '));
    const all = [...titles, keywords, description].join(' ');
    if (number !== null ? entry.number !== number : !terms.every(term => all.includes(term))) return [];
    const score = titles.some(title => title === phrase) ? 200 :
      titles.some(title => title.includes(phrase)) ? 100 : 0;
    const relevance = terms.reduce((sum, term) => sum + (titles.some(title => title.includes(term)) ? 20 : keywords.includes(term) ? 8 : 1), score);
    return [{ entry, relevance, order }];
  }).sort((a, b) => b.relevance - a.relevance || priority[a.entry.type] - priority[b.entry.type] || a.order - b.order)
    .map(result => result.entry);
}
