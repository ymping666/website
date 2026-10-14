export function buildSearchIndex({ problems, concepts, practiceSets, practiceCollections = [], tracks, translate }) {
  const pair = text => ({ en: text, zh: translate(text) });
  const keywords = values => values.flatMap(value => [value, translate(value)]).join(' ');
  return [
    ...problems.flatMap(problem => {
      const related = concepts.filter(concept => concept.ids.includes(problem.id)).map(concept => concept.title);
      const common = { number: problem.number, keywords: keywords([problem.id, problem.track, ...problem.tags, ...related]) };
      return [
        { ...common, type: 'problem', path: `/problems/${problem.id}/`, title: pair(problem.title), description: pair(problem.description) },
        { ...common, type: 'editorial', path: `/editorials/${problem.id}/`, title: { en: problem.title + ' — Solution', zh: translate(problem.title) + ' — 题解' }, description: pair(problem.description) }
      ];
    }),
    ...concepts.map(concept => ({ type: 'concept', path: `/concepts/${concept.slug}/`, title: pair(concept.title), description: pair(concept.summary), keywords: keywords([concept.slug, concept.family, ...concept.ids]) })),
    ...practiceSets.map(set => ({ type: 'set', path: `/practice-sets/${set.slug}/`, title: pair(set.title), description: pair(set.subtitle), keywords: keywords([set.slug, ...set.outcomes, ...set.segments.map(segment => segment.id)]) })),
    ...practiceCollections.map(collection => ({ type:'set', path:`/practice-sets/${collection.slug}/`, title:pair(collection.title), description:pair(collection.subtitle), keywords:keywords([collection.slug, ...collection.groups.flatMap(g=>[g.title,...g.sets.flatMap(slug=>{const s=practiceSets.find(s=>s.slug===slug);return [s.title,...s.segments.map(p=>p.id)];})])]) })),
    ...tracks.map(track => ({ type: 'topic', path: `/tracks/${track.slug}/`, title: pair(track.name), description: pair(track.subtitle), keywords: keywords([track.slug, ...track.groups.flat()]) }))
  ];
}
